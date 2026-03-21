const DB_NAME = 'ai-interview-question-voice-cache';
const STORE_NAME = 'questionVoice';
const DB_VERSION = 1;
const MAX_CACHE_BYTES = 30 * 1024 * 1024;

export interface QuestionVoiceCacheIdentity {
  sessionId: string;
  questionIndex: number;
  text: string;
  voiceParamsHash?: string;
}

interface QuestionVoiceCacheRecord {
  key: string;
  sessionId: string;
  questionIndex: number;
  textHash: string;
  voiceParamsHash: string;
  text: string;
  blob: Blob;
  size: number;
  createdAt: number;
  lastAccessedAt: number;
}

function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
  });
}

async function openDatabase(): Promise<IDBDatabase | null> {
  if (!isIndexedDbAvailable()) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('sessionId', 'sessionId', { unique: false });
        store.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function sha256(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(index);
    hash |= 0;
  }
  return `fallback-${Math.abs(hash)}`;
}

async function buildKey(identity: QuestionVoiceCacheIdentity): Promise<{
  key: string;
  textHash: string;
  voiceParamsHash: string;
}> {
  const normalizedText = identity.text.trim();
  const voiceParamsHash = identity.voiceParamsHash ?? 'default';
  const textHash = await sha256(normalizedText);
  return {
    key: `interview-question-voice:${identity.sessionId}:${identity.questionIndex}:${textHash}:${voiceParamsHash}`,
    textHash,
    voiceParamsHash,
  };
}

async function getAllRecords(database: IDBDatabase): Promise<QuestionVoiceCacheRecord[]> {
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const records = await requestToPromise(store.getAll());
  await transactionDone(transaction);
  return records as QuestionVoiceCacheRecord[];
}

export async function getQuestionAudio(identity: QuestionVoiceCacheIdentity): Promise<Blob | null> {
  const database = await openDatabase();
  if (!database) {
    return null;
  }

  const { key } = await buildKey(identity);
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const record = await requestToPromise(store.get(key)) as QuestionVoiceCacheRecord | undefined;

  if (!record) {
    transaction.abort();
    return null;
  }

  record.lastAccessedAt = Date.now();
  store.put(record);
  await transactionDone(transaction);
  return record.blob;
}

export async function setQuestionAudio(identity: QuestionVoiceCacheIdentity, blob: Blob): Promise<void> {
  const database = await openDatabase();
  if (!database) {
    return;
  }

  const { key, textHash, voiceParamsHash } = await buildKey(identity);
  const now = Date.now();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const record: QuestionVoiceCacheRecord = {
    key,
    sessionId: identity.sessionId,
    questionIndex: identity.questionIndex,
    textHash,
    voiceParamsHash,
    text: identity.text.trim(),
    blob,
    size: blob.size,
    createdAt: now,
    lastAccessedAt: now,
  };
  store.put(record);
  await transactionDone(transaction);
  await trimCacheIfNeeded();
}

export async function deleteSessionAudio(sessionId: string): Promise<void> {
  const database = await openDatabase();
  if (!database) {
    return;
  }

  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index('sessionId');
  const range = IDBKeyRange.only(sessionId);

  await new Promise<void>((resolve, reject) => {
    const request = index.openCursor(range);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve();
        return;
      }
      cursor.delete();
      cursor.continue();
    };
    request.onerror = () => reject(request.error ?? new Error('Failed to delete session audio cache'));
  });

  await transactionDone(transaction);
}

export async function trimCacheIfNeeded(): Promise<void> {
  const database = await openDatabase();
  if (!database) {
    return;
  }

  const records = await getAllRecords(database);
  const totalSize = records.reduce((sum, record) => sum + record.size, 0);
  if (totalSize <= MAX_CACHE_BYTES) {
    return;
  }

  const sortedRecords = [...records].sort((left, right) => left.lastAccessedAt - right.lastAccessedAt);
  let currentSize = totalSize;
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  for (const record of sortedRecords) {
    if (currentSize <= MAX_CACHE_BYTES) {
      break;
    }
    store.delete(record.key);
    currentSize -= record.size;
  }

  await transactionDone(transaction);
}

