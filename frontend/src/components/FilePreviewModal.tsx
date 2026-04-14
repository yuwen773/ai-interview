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
  let color = 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]';

  if (isMd) {
    label = 'Markdown';
    color = 'bg-[var(--color-success-subtle)] text-[var(--color-success)]';
  } else if (isPdf) {
    label = 'PDF';
    color = 'bg-[var(--color-error-subtle)] text-[var(--color-error)]';
  } else if (isTxt) {
    label = '文本';
    color = 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]';
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
      <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
        <AlertCircle className="w-10 h-10 mb-3" />
        <p>预览地址无效</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="rounded-xl bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] p-4 space-y-4">
      <Document
        file={previewUrl}
        loading={
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
          </div>
        }
        error={
          <div className="flex flex-col items-center justify-center py-16 text-[var(--color-error)]">
            <AlertCircle className="w-10 h-10 mb-3" />
            <p>{pdfError ?? 'PDF 加载失败'}</p>
          </div>
        }
        onLoadSuccess={({ numPages: total }) => onLoadSuccess(total)}
        onLoadError={(err) => onLoadError(err instanceof Error ? err.message : 'PDF 加载失败')}
      >
        {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
          <div key={pageNum} className="overflow-hidden rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] shadow-sm">
            <Page
              pageNumber={pageNum}
              width={Math.min(containerWidth - 2, 780)}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
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
      prose-headings:font-semibold prose-headings:text-[var(--color-text)] dark:prose-headings:text-[var(--color-text-dark)]
      prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
      prose-p:text-[var(--color-text-muted)] dark:prose-p:text-[var(--color-text-muted-dark)] prose-p:leading-relaxed
      prose-a:text-[var(--color-primary)] prose-a:no-underline hover:prose-a:underline
      prose-code:bg-[var(--color-surface-raised)] dark:prose-code:bg-[var(--color-surface-raised-dark)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
      prose-pre:bg-[var(--color-bg-dark)] dark:prose-pre:bg-[var(--color-bg-dark)] prose-pre:rounded-xl
      prose-blockquote:border-l-[var(--color-primary)] prose-blockquote:text-[var(--color-text-muted)] dark:prose-blockquote:text-[var(--color-text-muted-dark)]
      prose-ul:text-[var(--color-text-muted)] dark:prose-ul:text-[var(--color-text-muted-dark)]
      prose-ol:text-[var(--color-text-muted)] dark:prose-ol:text-[var(--color-text-muted-dark)]
      prose-li:marker:text-[var(--color-text-muted)]
      prose-table:text-sm
      prose-th:bg-[var(--color-surface-raised)] dark:prose-th:bg-[var(--color-surface-raised-dark)] prose-th:text-[var(--color-text-muted)] dark:prose-th:text-[var(--color-text-muted-dark)]
      prose-td:text-[var(--color-text-muted)] dark:prose-td:text-[var(--color-text-muted-dark)]
      prose-hr:border-[var(--color-border)] dark:prose-hr:border-[var(--color-border-dark)]
      prose-img:rounded-xl prose-img:shadow-sm
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function TextViewer({ content }: { content: string }) {
  return (
    <pre className="text-sm leading-6 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] whitespace-pre-wrap break-words overflow-auto
      bg-[var(--color-bg-dark)] rounded-xl p-5 font-mono
      border border-[var(--color-border-dark)]
      shadow-inner
    ">
      {content}
    </pre>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)]">
      <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] mb-4" />
      <span className="text-base">预览加载中...</span>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-error-subtle)] dark:bg-[var(--color-error-subtle-dark)] mb-4">
        <AlertCircle className="w-8 h-8 text-[var(--color-error)]" />
      </div>
      <p className="text-[var(--color-text)] dark:text-[var(--color-text-dark)] font-medium mb-1">预览加载失败</p>
      <p className="text-sm text-[var(--color-text-muted)] mb-4 max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]
          border border-[var(--color-primary)] dark:border-[var(--color-primary)] rounded-lg
          hover:bg-[var(--color-primary-subtle)] dark:hover:bg-[var(--color-primary-subtle-dark)] transition-colors"
      >
        重试
      </button>
    </div>
  );
}

function UnsupportedState({ message }: { message: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-warning)]/10 dark:bg-[var(--color-warning)]/10 mb-4">
        <FileText className="w-8 h-8 text-[var(--color-warning)]" />
      </div>
      <p className="text-[var(--color-text)] dark:text-[var(--color-text-dark)] font-medium mb-1">暂不支持在线预览</p>
      <p className="text-sm text-[var(--color-text-muted)] max-w-xs">{message ?? '请下载文件后查看。'}</p>
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
            className="fixed inset-0 bg-[var(--color-bg-dark)]/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]
                rounded-2xl shadow-2xl overflow-hidden flex flex-col
                border border-[var(--color-border)] dark:border-[var(--color-border-dark)]
                pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-4 px-6 py-4
                border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]
                bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-dark)]
                shrink-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] truncate">
                        {meta?.filename ?? '文件预览'}
                      </h2>
                      {meta && <FileTypeBadge contentType={meta.contentType} />}
                    </div>
                    {meta?.contentType && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
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
                    className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-muted-dark)]
                      hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] rounded-lg
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
                      bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]
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
                    className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-muted-dark)]
                      hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] rounded-lg
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
                        bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]
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
