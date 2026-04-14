import {useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {AlertCircle, ChevronUp, Download, FileText, Loader2, X} from 'lucide-react';
import {Document, Page, pdfjs} from 'react-pdf';
import type {PreviewMeta, TextPreview} from '../api/knowledgebase';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface FilePreviewModalProps {
  open: boolean;
  meta: PreviewMeta | null;
  text: TextPreview | null;
  loading: boolean;
  error: string | null;
  pdfError: string | null;
  numPages: number;
  onClose: () => void;
  onDownload: () => void;
  onReload: () => void;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: (error: string) => void;
}

function FileTypeBadge({ contentType }: { contentType: string }) {
  const isMd = contentType.includes('markdown') || contentType.includes('md');
  const isTxt = contentType.includes('text/plain');
  const isPdf = contentType.includes('pdf');

  let label = '文件';
  let color = 'bg-slate-100 text-slate-600';

  if (isMd) {
    label = 'Markdown';
    color = 'bg-emerald-50 text-emerald-600';
  } else if (isPdf) {
    label = 'PDF';
    color = 'bg-red-50 text-red-600';
  } else if (isTxt) {
    label = '文本';
    color = 'bg-amber-50 text-amber-600';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${color}`}>
      {isPdf && <FileText className="w-3 h-3" />}
      {label}
    </span>
  );
}

function PdfViewer({
  previewUrl,
  numPages,
  pdfError,
  onLoadSuccess,
  onLoadError,
}: {
  previewUrl: string | null;
  numPages: number;
  pdfError: string | null;
  onLoadSuccess: (numPages: number) => void;
  onLoadError: (error: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!previewUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <AlertCircle className="w-10 h-10 mb-3" />
        <p>预览地址无效</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="rounded-xl bg-slate-100 p-4 space-y-4">
      <Document
        file={previewUrl}
        loading={
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        }
        error={
          <div className="flex flex-col items-center justify-center py-16 text-red-500">
            <AlertCircle className="w-10 h-10 mb-3" />
            <p>{pdfError ?? 'PDF 加载失败'}</p>
          </div>
        }
        onLoadSuccess={({ numPages: total }) => onLoadSuccess(total)}
        onLoadError={(err) => onLoadError(err instanceof Error ? err.message : 'PDF 加载失败')}
      >
        {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
          <div key={pageNum} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <Page
              pageNumber={pageNum}
              width={Math.min(containerWidth - 2, 780)}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              }
            />
          </div>
        ))}
      </Document>
    </div>
  );
}

function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none
      prose-headings:font-semibold prose-headings:text-slate-800 dark:prose-headings:text-white
      prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
      prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed
      prose-a:text-primary-500 prose-a:no-underline hover:prose-a:underline
      prose-code:bg-slate-100 dark:prose-code:bg-slate-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
      prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:rounded-xl
      prose-blockquote:border-l-primary-500 prose-blockquote:text-slate-500 dark:prose-blockquote:text-slate-400
      prose-ul:text-slate-600 dark:prose-ul:text-slate-300
      prose-ol:text-slate-600 dark:prose-ol:text-slate-300
      prose-li:marker:text-slate-400
      prose-table:text-sm
      prose-th:bg-slate-50 dark:prose-th:bg-slate-800 prose-th:text-slate-700 dark:prose-th:text-slate-300
      prose-td:text-slate-600 dark:prose-td:text-slate-400
      prose-hr:border-slate-200 dark:prose-hr:border-slate-700
      prose-img:rounded-xl prose-img:shadow-sm
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function TextViewer({ content }: { content: string }) {
  return (
    <pre className="text-sm leading-6 text-slate-200 whitespace-pre-wrap break-words overflow-auto
      bg-slate-950 rounded-xl p-5 font-mono
      border border-slate-800
      shadow-inner
    ">
      {content}
    </pre>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
      <span className="text-base">预览加载中...</span>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">预览加载失败</p>
      <p className="text-sm text-slate-500 mb-4 max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-primary-500 hover:text-primary-600
          border border-primary-200 dark:border-primary-700 rounded-lg
          hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
      >
        重试
      </button>
    </div>
  );
}

function UnsupportedState({ message }: { message: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 mb-4">
        <FileText className="w-8 h-8 text-amber-500" />
      </div>
      <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">暂不支持在线预览</p>
      <p className="text-sm text-slate-500 max-w-xs">{message ?? '请下载文件后查看。'}</p>
    </div>
  );
}

const SCROLL_THRESHOLD = 200;

export default function FilePreviewModal({
  open,
  meta,
  text,
  loading,
  error,
  pdfError,
  numPages,
  onClose,
  onDownload,
  onReload,
  onLoadSuccess,
  onLoadError,
}: FilePreviewModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Determine content type for rendering
  const contentVariant = useMemo(() => {
    if (!meta) return 'none';
    if (meta.previewType === 'pdf') return 'pdf';
    if (meta.previewType === 'text') {
      const ct = meta.contentType.toLowerCase();
      if (ct.includes('markdown') || ct.includes('md')) return 'markdown';
      return 'text';
    }
    return 'unsupported';
  }, [meta]);

  const previewUrl = useMemo(() => {
    if (!meta?.previewUrl) return null;
    try {
      return new URL(meta.previewUrl, window.location.origin).toString();
    } catch {
      return meta.previewUrl;
    }
  }, [meta?.previewUrl]);

  // Keyboard close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const renderContent = () => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={onReload} />;
    if (!meta) return null;

    if (meta.previewType === 'unsupported') {
      return <UnsupportedState message={meta.message} />;
    }

    if (contentVariant === 'pdf') {
      return (
        <PdfViewer
          previewUrl={previewUrl}
          numPages={numPages}
          pdfError={pdfError}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
        />
      );
    }

    if (contentVariant === 'markdown' && text) {
      return <MarkdownViewer content={text.text} />;
    }

    if (contentVariant === 'text' && text) {
      return <TextViewer content={text.text} />;
    }

    return null;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800
                rounded-2xl shadow-2xl overflow-hidden flex flex-col
                border border-slate-200 dark:border-slate-700
                pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-4 px-6 py-4
                border-b border-slate-100 dark:border-slate-700
                bg-slate-50 dark:bg-slate-800
                shrink-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-white truncate">
                        {meta?.filename ?? '文件预览'}
                      </h2>
                      {meta && <FileTypeBadge contentType={meta.contentType} />}
                    </div>
                    {meta?.contentType && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {meta.contentType}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Refresh */}
                  <button
                    type="button"
                    onClick={onReload}
                    disabled={loading}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                      hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg
                      transition-colors disabled:opacity-50"
                    title="刷新"
                  >
                    <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>

                  {/* Download */}
                  <button
                    type="button"
                    onClick={onDownload}
                    disabled={!meta?.downloadUrl}
                    className="inline-flex items-center gap-2 px-4 py-2
                      bg-primary-500 hover:bg-primary-600
                      text-white text-sm font-medium rounded-lg
                      transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>

                  {/* Close */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                      hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg
                      transition-colors"
                    title="关闭"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div
                ref={contentRef}
                onScroll={e => setScrolled(e.currentTarget.scrollTop > SCROLL_THRESHOLD)}
                className="flex-1 overflow-y-auto p-6 scrollbar-thin relative"
              >
                {renderContent()}

                {/* Scroll to top button */}
                <AnimatePresence>
                  {scrolled && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="fixed bottom-8 right-8 z-10
                        flex items-center justify-center w-12 h-12 rounded-full
                        bg-primary-500 hover:bg-primary-600
                        text-white
                        transition-all active:scale-95"
                      title="回到顶部"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
