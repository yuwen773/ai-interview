# Voice I/O Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add optional voice input/output capabilities to the existing interview system without modifying business logic.

**Architecture:** Layer voice I/O on top of existing services using Strategy Pattern for output (Text vs Voice). New voice endpoint calls ASR → existing `submitAnswer()` → strategy returns JSON or SSE audio stream.

**Tech Stack:** Spring Web (SSE), Spring AI DashScope (ASR/TTS), React (MediaRecorder API), Base64 audio encoding

---

## Prerequisites

Read these files before starting:
- `app/src/main/java/interview/guide/modules/audio/service/TtsService.java` - Current TTS implementation
- `app/src/main/java/interview/guide/modules/audio/service/AsrService.java` - Current ASR implementation
- `app/src/main/java/interview/guide/modules/interview/service/InterviewSessionService.java` - Core business logic (DO NOT MODIFY)
- `app/src/main/java/interview/guide/modules/interview/InterviewController.java` - Existing endpoints

---

## Task 1: Add TTS Stream SSE Method

**Files:**
- Create: `app/src/main/java/interview/guide/modules/audio/model/TtsStreamChunk.java`
- Modify: `app/src/main/java/interview/guide/modules/audio/service/TtsService.java`
- Modify: `pom.xml`

**Step 1: Add SSE dependency to pom.xml**

File: `app/pom.xml` - Find the `<dependencies>` section and add after the existing spring-ai-alibaba dependency:

```xml
<!-- SSE support for voice streaming -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

Run: `mvn dependency:tree | grep spring-boot-starter-web`
Expected: Shows spring-boot-starter-web in tree (already exists via spring-boot-starter-web)

**Step 2: Create TTS stream chunk model**

Create file: `app/src/main/java/interview/guide/modules/audio/model/TtsStreamChunk.java`

```java
package interview.guide.modules.audio.model;

import java.util.Base64;

/**
 * TTS audio chunk for SSE streaming
 */
public record TtsStreamChunk(
        String chunk,      // Base64 encoded audio data
        int index,         // Chunk sequence number
        boolean isEnd      // true for the last chunk
) {
    public static TtsStreamChunk audio(byte[] audioBytes, int index) {
        String base64 = Base64.getEncoder().encodeToString(audioBytes);
        return new TtsStreamChunk(base64, index, false);
    }

    public static TtsStreamChunk end() {
        return new TtsStreamChunk("", 0, true);
    }
}
```

**Step 3: Add streamTtsSse method to TtsService**

File: `app/src/main/java/interview/guide/modules/audio/service/TtsService.java` - Add this method after the existing `synthesize` method:

```java
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.ai.audio.tts.TextToSpeechPrompt;
import com.alibaba.cloud.ai.dashscope.audio.tts.DashScopeAudioSpeechOptions;
import com.alibaba.cloud.ai.dashscope.spec.DashScopeModel;
import reactor.core.publisher.Flux;

/**
 * Stream TTS output as SSE events
 * @param text Text to synthesize
 * @return SseEmitter that streams audio chunks
 */
public SseEmitter streamTtsSse(String text) {
    SseEmitter emitter = new SseEmitter(30000L); // 30 second timeout

    if (text == null || text.isBlank()) {
        try {
            emitter.send(SseEmitter.event()
                .name("error")
                .data(Map.of("message", "Text is empty")));
            emitter.complete();
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
        return emitter;
    }

    DashScopeAudioSpeechOptions options = DashScopeAudioSpeechOptions.builder()
            .model(DashScopeModel.AudioModel.COSYVOICE_V3_FLASH.getValue())
            .textType("PlainText")
            .voice("longanyang")
            .format("mp3")
            .sampleRate(22050)
            .build();

    TextToSpeechPrompt prompt = new TextToSpeechPrompt(text, options);

    AtomicInteger chunkIndex = new AtomicInteger(0);

    dashScopeSpeechSynthesisModel.stream(prompt)
        .doOnComplete(() -> {
            try {
                emitter.send(SseEmitter.event().name("end").data(TtsStreamChunk.end()));
                emitter.complete();
                log.info("TTS stream completed for text: {}", text.substring(0, Math.min(50, text.length())));
            } catch (IOException e) {
                log.error("Error sending end event", e);
                emitter.completeWithError(e);
            }
        })
        .doOnError(error -> {
            log.error("TTS stream error", error);
            emitter.completeWithError(error);
        })
        .subscribe(response -> {
            try {
                byte[] audioBytes = extractAudio(response);
                if (audioBytes != null && audioBytes.length > 0) {
                    TtsStreamChunk chunk = TtsStreamChunk.audio(audioBytes, chunkIndex.getAndIncrement());
                    emitter.send(SseEmitter.event().name("audio").data(chunk));
                    log.debug("Sent TTS chunk {}, size: {} bytes", chunk.index(), audioBytes.length);
                }
            } catch (IOException e) {
                log.error("Error sending audio chunk", e);
                emitter.completeWithError(e);
            }
        });

    return emitter;
}
```

Also add these imports at the top of the file if not present:
```java
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
```

**Step 4: Compile and verify**

Run: `cd app && mvn compile -q`
Expected: Compilation succeeds with no errors

**Step 5: Commit**

```bash
git add app/pom.xml app/src/main/java/interview/guide/modules/audio/
git commit -m "feat(audio): add SSE streaming method for TTS output"
```

---

## Task 2: Create Output Strategy Interface and Implementations

**Files:**
- Create: `app/src/main/java/interview/guide/modules/audio/strategy/AnswerOutputStrategy.java`
- Create: `app/src/main/java/interview/guide/modules/audio/strategy/TextOutputStrategy.java`
- Create: `app/src/main/java/interview/guide/modules/audio/strategy/VoiceOutputStrategy.java`

**Step 1: Create strategy interface**

Create file: `app/src/main/java/interview/guide/modules/audio/strategy/AnswerOutputStrategy.java`

```java
package interview.guide.modules.audio.strategy;

import interview.guide.modules.interview.model.SubmitAnswerResponse;

/**
 * Strategy interface for different answer output formats
 */
public interface AnswerOutputStrategy {
    /**
     * Process the answer response and return in the appropriate format
     * @param response The answer response from interview service
     * @return Object (can be Result, SseEmitter, or other types)
     */
    Object process(SubmitAnswerResponse response);
}
```

**Step 2: Create text output strategy**

Create file: `app/src/main/java/interview/guide/modules/audio/strategy/TextOutputStrategy.java`

```java
package interview.guide.modules.audio.strategy;

import interview.guide.common.model.Result;
import interview.guide.modules.interview.model.SubmitAnswerResponse;
import org.springframework.stereotype.Component;

/**
 * Text output strategy - returns standard JSON response
 */
@Component
public class TextOutputStrategy implements AnswerOutputStrategy {

    @Override
    public Object process(SubmitAnswerResponse response) {
        return Result.success(response);
    }
}
```

**Step 3: Create voice output strategy**

Create file: `app/src/main/java/interview/guide/modules/audio/strategy/VoiceOutputStrategy.java`

```java
package interview.guide.modules.audio.strategy;

import interview.guide.modules.audio.service.TtsService;
import interview.guide.modules.interview.model.SubmitAnswerResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Voice output strategy - returns SSE stream with TTS audio
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VoiceOutputStrategy implements AnswerOutputStrategy {

    private final TtsService ttsService;

    @Override
    public Object process(SubmitAnswerResponse response) {
        if (response.nextQuestion() == null) {
            log.warn("No next question available for voice output");
            throw new IllegalStateException("No question available for voice output");
        }

        String questionText = response.nextQuestion().question();
        log.info("Processing voice output for question: {}",
            questionText.substring(0, Math.min(50, questionText)));
        return ttsService.streamTtsSse(questionText);
    }
}
```

**Step 4: Compile and verify**

Run: `cd app && mvn compile -q`
Expected: Compilation succeeds

**Step 5: Commit**

```bash
git add app/src/main/java/interview/guide/modules/audio/strategy/
git commit -m "feat(audio): add strategy pattern for answer output (text/voice)"
```

---

## Task 3: Add Voice Answer Endpoint to Controller

**Files:**
- Modify: `app/src/main/java/interview/guide/modules/interview/InterviewController.java`

**Step 1: Add voice answer endpoint**

File: `app/src/main/java/interview/guide/modules/interview/InterviewController.java` - Add after the existing `submitAnswer` method:

```java
import interview.guide.modules.audio.strategy.AnswerOutputStrategy;
import interview.guide.modules.audio.service.AsrService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Submit answer via voice input
 * Supports both text and voice output modes
 */
@PostMapping("/api/interview/{sessionId}/answer/voice")
@RateLimit(dimensions = {RateLimit.Dimension.GLOBAL}, count = 10)
public Object submitVoiceAnswer(
        @PathVariable String sessionId,
        @RequestParam("file") MultipartFile audioFile,
        @RequestParam(defaultValue = "voice") String outputMode) {

    log.info("Voice answer submitted: sessionId={}, outputMode={}, fileSize={}",
        sessionId, outputMode, audioFile.getSize());

    // Validate audio file
    if (audioFile.isEmpty()) {
        return Result.error(ErrorCode.INVALID_REQUEST, "Audio file is empty");
    }

    // Step 1: ASR - transcribe audio to text
    String userAnswer;
    try {
        userAnswer = asrService.transcribe(audioFile);
        if (userAnswer == null || userAnswer.isBlank()) {
            return Result.error(ErrorCode.ASR_FAILED, "Speech recognition returned empty result");
        }
        log.info("ASR result: {}", userAnswer.substring(0, Math.min(100, userAnswer)));
    } catch (Exception e) {
        log.error("ASR processing failed", e);
        return Result.error(ErrorCode.ASR_FAILED, "Speech recognition failed: " + e.getMessage());
    }

    // Step 2: Get current question index
    InterviewSessionDTO session;
    try {
        session = sessionService.getSession(sessionId);
    } catch (BusinessException e) {
        log.error("Session not found: {}", sessionId);
        return Result.error(e.getErrorCode(), e.getMessage());
    }

    int currentIndex = session.currentIndex();

    // Step 3: Call existing service (NO CHANGES TO BUSINESS LOGIC)
    SubmitAnswerRequest request = new SubmitAnswerRequest(sessionId, currentIndex, userAnswer);
    SubmitAnswerResponse response;
    try {
        response = sessionService.submitAnswer(request);
    } catch (BusinessException e) {
        log.error("Submit answer failed", e);
        return Result.error(e.getErrorCode(), e.getMessage());
    }

    // Step 4: Return based on output strategy
    AnswerOutputStrategy strategy = getOutputStrategy(outputMode);
    return strategy.process(response);
}

/**
 * Get output strategy based on mode
 */
private AnswerOutputStrategy getOutputStrategy(String mode) {
    return "voice".equalsIgnoreCase(mode) ? voiceOutputStrategy : textOutputStrategy;
}
```

**Step 2: Add required dependencies and fields**

Add these fields to the controller class (after existing field declarations):

```java
private final AsrService asrService;
private final AnswerOutputStrategy voiceOutputStrategy;
private final AnswerOutputStrategy textOutputStrategy;

public InterviewController(
        InterviewSessionService sessionService,
        InterviewHistoryService historyService,
        InterviewQuestionService questionService,
        AsrService asrService,
        @Qualifier("voiceOutputStrategy") AnswerOutputStrategy voiceOutputStrategy,
        @Qualifier("textOutputStrategy") AnswerOutputStrategy textOutputStrategy) {
    this.sessionService = sessionService;
    this.historyService = historyService;
    this.questionService = questionService;
    this.asrService = asrService;
    this.voiceOutputStrategy = voiceOutputStrategy;
    this.textOutputStrategy = textOutputStrategy;
}
```

**Step 3: Add ASR_FAILED error code**

File: `app/src/main/java/interview/guide/common/exception/ErrorCode.java` - Add to the enum:

```java
ASR_FAILED(2005, "Speech recognition failed"),
```

**Step 4: Compile and verify**

Run: `cd app && mvn compile -q`
Expected: Compilation succeeds

**Step 5: Commit**

```bash
git add app/src/main/java/interview/guide/modules/interview/InterviewController.java
git add app/src/main/java/interview/guide/common/exception/ErrorCode.java
git commit -m "feat(interview): add voice answer endpoint with SSE support"
```

---

## Task 4: Frontend - Voice Recorder Hook

**Files:**
- Create: `frontend/src/hooks/useVoiceRecorder.ts`

**Step 1: Create voice recorder hook**

Create file: `frontend/src/hooks/useVoiceRecorder.ts`

```typescript
import { useState, useRef } from 'react';

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  error: string | null;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // Try different MIME types for browser compatibility
      let mimeType = 'audio/webm';
      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav'];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(message);
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('No recorder active'));
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || 'audio/webm'
        });
        setIsRecording(false);
        resolve(blob);
      };

      mediaRecorderRef.current.onerror = (event) => {
        setIsRecording(false);
        reject(new Error('Recording error'));
      };

      mediaRecorderRef.current.stop();
    });
  };

  return { isRecording, startRecording, stopRecording, error };
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useVoiceRecorder.ts
git commit -m "feat(frontend): add voice recorder hook"
```

---

## Task 5: Frontend - Voice Player Hook

**Files:**
- Create: `frontend/src/hooks/useVoicePlayer.ts`

**Step 1: Create voice player hook**

Create file: `frontend/src/hooks/useVoicePlayer.ts`

```typescript
import { useRef, useState } from 'react';

export interface UseVoicePlayerReturn {
  isPlaying: boolean;
  playAudioStream: (response: Response) => Promise<void>;
  stopPlayback: () => void;
  error: string | null;
}

export function useVoicePlayer(): UseVoicePlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  const playAudioStream = async (response: Response) => {
    setError(null);
    audioQueueRef.current = [];
    isPlayingRef.current = true;
    setIsPlaying(true);

    try {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            try {
              const jsonStr = trimmed.slice(5).trim();
              const data = JSON.parse(jsonStr);

              if (data.name === 'audio' && data.data?.chunk) {
                audioQueueRef.current.push(data.data.chunk);
              } else if (data.name === 'end') {
                // End marker received
              } else if (data.name === 'error') {
                throw new Error(data.data?.message || 'TTS error');
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', trimmed);
            }
          }
        }
      }

      // Start playing queued audio
      await playQueuedAudio();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Playback failed';
      setError(message);
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  };

  const playQueuedAudio = async (): Promise<void> => {
    if (audioQueueRef.current.length === 0) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    const audio = audioRef.current || new Audio();
    audioRef.current = audio;

    audio.onended = () => {
      if (isPlayingRef.current && audioQueueRef.current.length > 0) {
        playNextChunk(audio);
      } else {
        setIsPlaying(false);
        isPlayingRef.current = false;
      }
    };

    audio.onerror = () => {
      console.error('Audio playback error');
      if (isPlayingRef.current && audioQueueRef.current.length > 0) {
        playNextChunk(audio);
      } else {
        setIsPlaying(false);
        isPlayingRef.current = false;
      }
    };

    playNextChunk(audio);
  };

  const playNextChunk = (audio: HTMLAudioElement) => {
    if (audioQueueRef.current.length === 0) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    const base64Audio = audioQueueRef.current.shift()!;
    audio.src = `data:audio/mp3;base64,${base64Audio}`;
    audio.play().catch(console.error);
  };

  const stopPlayback = () => {
    isPlayingRef.current = false;
    audioQueueRef.current = [];
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
  };

  return { isPlaying, playAudioStream, stopPlayback, error };
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useVoicePlayer.ts
git commit -m "feat(frontend): add voice player hook for SSE streams"
```

---

## Task 6: Frontend - Voice Control Panel Component

**Files:**
- Create: `frontend/src/components/VoiceControlPanel.tsx`
- Create: `frontend/src/components/VoiceControlPanel.module.css`

**Step 1: Create voice control panel component**

Create file: `frontend/src/components/VoiceControlPanel.tsx`

```typescript
import React, { useState } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useVoicePlayer } from '../hooks/useVoicePlayer';
import styles from './VoiceControlPanel.module.css';

export interface VoiceControlPanelProps {
  sessionId: string;
  questionIndex: number;
  onAnswerSubmitted?: (hasNext: boolean, nextQuestionIndex: number) => void;
  disabled?: boolean;
}

export function VoiceControlPanel({
  sessionId,
  questionIndex,
  onAnswerSubmitted,
  disabled = false
}: VoiceControlPanelProps) {
  const { isRecording, startRecording, stopRecording, error: recordError } = useVoiceRecorder();
  const { isPlaying, playAudioStream, error: playError } = useVoicePlayer();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outputMode, setOutputMode] = useState<'text' | 'voice'>('voice');

  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsSubmitting(true);
      try {
        const audioBlob = await stopRecording();

        // Create form data
        const formData = new FormData();
        formData.append('file', audioBlob, 'answer.wav');
        formData.append('outputMode', outputMode);

        // Submit to backend
        const response = await fetch(
          `/api/interview/${sessionId}/answer/voice`,
          {
            method: 'POST',
            body: formData
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Handle response based on output mode
        if (outputMode === 'voice') {
          await playAudioStream(response);
        }

        // Parse response body for callback
        const text = await response.clone().text();
        if (text) {
          try {
            const data = JSON.parse(text);
            if (data.success && onAnswerSubmitted) {
              onAnswerSubmitted(
                data.data.hasNextQuestion,
                data.data.currentIndex
              );
            }
          } catch {
            // SSE stream, ignore JSON parse
          }
        }
      } catch (err) {
        console.error('Voice submission error:', err);
        alert(err instanceof Error ? err.message : 'Submission failed');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      await startRecording();
    }
  };

  const error = recordError || playError;

  return (
    <div className={styles.voicePanel}>
      <div className={styles.controls}>
        <label className={styles.modeToggle}>
          <input
            type="checkbox"
            checked={outputMode === 'voice'}
            onChange={(e) => setOutputMode(e.target.checked ? 'voice' : 'text')}
            disabled={disabled || isRecording || isSubmitting}
          />
          <span>语音输出</span>
        </label>

        <button
          onClick={handleToggleRecording}
          disabled={disabled || isSubmitting || isPlaying}
          className={`${styles.recordButton} ${
            isRecording ? styles.recording : ''
          }`}
        >
          {isSubmitting ? '处理中...' :
           isRecording ? '停止录音' :
           isPlaying ? '播放中...' :
           '开始录音'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      <div className={styles.hint}>
        {isRecording && '正在录音... 点击停止按钮提交'}
        {!isRecording && '点击开始录音，完成后点击停止提交'}
      </div>
    </div>
  );
}
```

**Step 2: Create component styles**

Create file: `frontend/src/components/VoiceControlPanel.module.css`

```css
.voicePanel {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 16px 0;
}

.controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.modeToggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.modeToggle input {
  cursor: pointer;
}

.recordButton {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background: #1890ff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.recordButton:hover:not(:disabled) {
  background: #40a9ff;
}

.recordButton:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

.recordButton.recording {
  background: #ff4d4f;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.error {
  margin-top: 8px;
  padding: 8px;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  color: #ff4d4f;
  font-size: 12px;
}

.hint {
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/VoiceControlPanel.tsx
git add frontend/src/components/VoiceControlPanel.module.css
git commit -m "feat(frontend): add voice control panel component"
```

---

## Task 7: Frontend - Integrate Voice Panel into Interview Page

**Files:**
- Modify: `frontend/src/pages/InterviewPage.tsx` (or similar interview page)

**Step 1: Import and use VoiceControlPanel**

Add to your interview page (exact file may vary):

```typescript
import { VoiceControlPanel } from '../components/VoiceControlPanel';

// In the component, add where the answer input is:
<VoiceControlPanel
  sessionId={sessionId}
  questionIndex={currentQuestionIndex}
  onAnswerSubmitted={(hasNext, nextIndex) => {
    if (hasNext) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      // Interview completed
      navigate('/report');
    }
  }}
  disabled={!currentQuestion}
/>
```

**Step 2: Commit**

```bash
git add frontend/src/pages/InterviewPage.tsx
git commit -m "feat(frontend): integrate voice control panel into interview page"
```

---

## Task 8: Testing

**Step 1: Backend unit test**

Run: `cd app && mvn test -Dtest=InterviewControllerTest`
Expected: All tests pass

**Step 2: Frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors

**Step 3: Manual test checklist**

1. Start backend: `cd app && mvn spring-boot:run`
2. Start frontend: `cd frontend && npm run dev`
3. Create an interview session
4. Test voice input:
   - Click "开始录音"
   - Speak a test answer
   - Click "停止录音"
   - Verify audio is submitted
5. Test voice output:
   - Verify "语音输出" toggle is checked
   - After submission, verify audio plays
6. Test text output mode:
   - Uncheck "语音输出"
   - Submit voice answer
   - Verify response is JSON text
7. Test error cases:
   - Submit empty audio (should error)
   - Test with invalid session ID (should error)

**Step 4: Final commit**

```bash
git add -A
git commit -m "test: add manual testing verification"
```

---

## Completion Criteria

- [ ] Backend compiles without errors
- [ ] Frontend builds without errors
- [ ] Voice input transcribes correctly (ASR)
- [ ] Voice output plays correctly (TTS)
- [ ] Text/voice output modes both work
- [ ] Error handling works for edge cases
- [ ] Existing text-based interview still works unchanged

---

## Notes for Implementation

1. **TTS Model**: Uses `COSYVOICE_V3_FLASH` for streaming. If not available, fall back to `COSYVOICE_V1` in TtsService.

2. **Audio Format**: Frontend records as webm/wav, backend ASR handles it. TTS outputs mp3.

3. **SSE Timeout**: Set to 30 seconds. For long questions, may need to increase.

4. **Browser Compatibility**: The hook tries multiple MIME types for recording. Test in target browsers.

5. **Rate Limiting**: The endpoint uses `@RateLimit(10)` globally. Adjust if needed.
