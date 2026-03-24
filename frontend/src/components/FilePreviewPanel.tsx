import {useEffect, useMemo, useRef, useState} from 'react';
import {AlertCircle, Download, FileText, Loader2, RefreshCw} from 'lucide-react';
import {Document, Page, pdfjs} from 'react-pdf';
import type {PreviewMeta, TextPreview} from '../api/knowledgebase';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface FilePreviewPanelProps {
  fetchMeta: () => Promise<PreviewMeta>;
  fetchText: () => Promise<TextPreview>;
  reloadKey?: string | number;
}

interface PreviewState {
  meta: PreviewMeta | null;
  text: TextPreview | null;
  error: string | null;
  loading: boolean;
}

function resolveUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

export default function FilePreviewPanel({
  fetchMeta,
  fetchText,
  reloadKey,
}: FilePreviewPanelProps) {
  const [state, setState] = useState<PreviewState>({
    meta: null,
    text: null,
    error: null,
    loading: true,
  });
  const [numPages, setNumPages] = useState(0);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const fetchMetaRef = useRef(fetchMeta);
  const fetchTextRef = useRef(fetchText);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchMetaRef.current = fetchMeta;
  }, [fetchMeta]);

  useEffect(() => {
    fetchTextRef.current = fetchText;
  }, [fetchText]);

  useEffect(() => {
    const container = pdfContainerRef.current;
    if (!container || state.meta?.previewType !== 'pdf') {
      return;
    }

    const updateWidth = () => {
      setPageWidth(Math.max(Math.floor(container.clientWidth) - 2, 0));
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [state.meta?.previewType]);

  const loadPreview = async () => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));
    setPdfError(null);
    setNumPages(0);

    try {
      const meta = await fetchMetaRef.current();
      let text: TextPreview | null = null;

      if (meta.previewType === 'text') {
        text = await fetchTextRef.current();
      }

      setState({
        meta,
        text,
        error: null,
        loading: false,
      });
    } catch (error) {
      setState({
        meta: null,
        text: null,
        error: error instanceof Error ? error.message : '预览加载失败，请稍后重试。',
        loading: false,
      });
    }
  };

  useEffect(() => {
    void loadPreview();
  }, [reloadKey]);

  const downloadUrl = resolveUrl(state.meta?.downloadUrl);
  const previewUrl = resolveUrl(state.meta?.previewUrl);
  const pageNumbers = useMemo(
    () => Array.from({ length: numPages }, (_, index) => index + 1),
    [numPages]
  );

  const handleDownload = async () => {
    if (!downloadUrl) {
      return;
    }

    try {
      const targetUrl = new URL(downloadUrl);
      if (targetUrl.origin === window.location.origin) {
        const response = await fetch(targetUrl.toString(), { credentials: 'include' });
        if (!response.ok) {
          throw new Error(`下载失败 (${response.status})`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = state.meta?.filename ?? '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        return;
      }
    } catch {
      // Fall through to a new tab if same-origin blob download fails.
    }

    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-800 truncate">
            {state.meta?.filename ?? '文件预览'}
          </h3>
          <p className="text-sm text-slate-500">
            {state.meta?.contentType ?? '加载文件信息中...'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void loadPreview()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!downloadUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            <Download className="w-4 h-4" />
            下载
          </button>
        </div>
      </div>

      {state.loading && (
        <div className="flex min-h-[320px] items-center justify-center gap-3 px-6 py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <span>预览加载中...</span>
        </div>
      )}

      {!state.loading && state.error && (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-slate-800">预览加载失败</p>
            <p className="text-sm text-slate-500">{state.error}</p>
          </div>
        </div>
      )}

      {!state.loading && !state.error && state.meta?.previewType === 'unsupported' && (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <FileText className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-slate-800">暂不支持在线预览</p>
            <p className="text-sm text-slate-500">{state.meta.message ?? '请下载文件后查看。'}</p>
          </div>
        </div>
      )}

      {!state.loading && !state.error && state.meta?.previewType === 'text' && (
        <div className="space-y-4 px-6 py-5">
          {state.text?.truncated && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              内容过长，当前仅展示部分内容。
            </div>
          )}
          <pre className="max-h-[640px] overflow-auto rounded-xl bg-slate-950 px-4 py-4 text-sm leading-6 text-slate-100 whitespace-pre-wrap break-words">
            {state.text?.text ?? ''}
          </pre>
        </div>
      )}

      {!state.loading && !state.error && state.meta?.previewType === 'pdf' && (
        <div className="px-4 py-5 md:px-6">
          {previewUrl ? (
            <div
              ref={pdfContainerRef}
              className="rounded-2xl border border-slate-200 bg-slate-100 p-3 md:p-4"
            >
              <Document
                file={previewUrl}
                loading={
                  <div className="flex min-h-[320px] items-center justify-center gap-3 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                    <span>PDF 加载中...</span>
                  </div>
                }
                error={
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center text-slate-500">
                    <AlertCircle className="h-7 w-7 text-red-500" />
                    <span>{pdfError ?? 'PDF 预览加载失败，请尝试下载查看。'}</span>
                  </div>
                }
                onLoadSuccess={({ numPages: totalPages }) => {
                  setNumPages(totalPages);
                  setPdfError(null);
                }}
                onLoadError={(error) => {
                  setPdfError(error instanceof Error ? error.message : 'PDF 预览加载失败');
                }}
              >
                <div className="space-y-4">
                  {pageNumbers.map(pageNumber => (
                    <div
                      key={pageNumber}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                      <Page
                        pageNumber={pageNumber}
                        width={pageWidth > 0 ? Math.min(pageWidth, 860) : undefined}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        loading={
                          <div className="flex h-[240px] items-center justify-center text-slate-400">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                        }
                      />
                    </div>
                  ))}
                </div>
              </Document>
            </div>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center text-slate-500">
              <AlertCircle className="h-7 w-7 text-red-500" />
              <span>PDF 预览地址无效，请尝试下载查看。</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
