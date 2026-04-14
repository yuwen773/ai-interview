import {ChangeEvent, DragEvent, useCallback, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {formatFileSize} from '../utils/date';
import {AlertCircle, FileText, Loader2, Upload, X} from 'lucide-react';

export interface FileUploadCardProps {
  /** 标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 接受的文件类型 */
  accept: string;
  /** 支持的格式说明 */
  formatHint: string;
  /** 最大文件大小说明 */
  maxSizeHint: string;
  /** 是否正在上传 */
  uploading?: boolean;
  /** 上传按钮文字 */
  uploadButtonText?: string;
  /** 选择按钮文字 */
  selectButtonText?: string;
  /** 是否显示名称输入框 */
  showNameInput?: boolean;
  /** 名称输入框占位符 */
  namePlaceholder?: string;
  /** 名称输入框标签 */
  nameLabel?: string;
  /** 错误信息 */
  error?: string;
  /** 文件选择回调 */
  onFileSelect?: (file: File) => void;
  /** 上传回调 */
  onUpload: (file: File, name?: string) => void;
  /** 返回回调 */
  onBack?: () => void;
}

export default function FileUploadCard({
  title,
  subtitle,
  accept,
  formatHint,
  maxSizeHint,
  uploading = false,
  uploadButtonText = '开始上传',
  selectButtonText = '选择文件',
  showNameInput = false,
  namePlaceholder = '留空则使用文件名',
  nameLabel = '名称（可选）',
  error,
  onFileSelect,
  onUpload,
  onBack,
}: FileUploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [name, setName] = useState('');

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
      onFileSelect?.(files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      onFileSelect?.(files[0]);
    }
  }, [onFileSelect]);

  const handleUpload = () => {
    if (!selectedFile) return;
    onUpload(selectedFile, name.trim() || undefined);
  };

  const handleDropZoneKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('file-upload-input')?.click();
    }
  }, []);

  return (
    <motion.div
      className="max-w-3xl mx-auto pt-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 标题 */}
      <div className="text-center mb-12">
        <motion.h1
            className="text-4xl md:text-5xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-4 tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {title}
        </motion.h1>
        <motion.p
            className="text-lg text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {subtitle}
        </motion.p>
      </div>

      {/* 上传区域 */}
      <motion.div
          className={`relative bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-12 cursor-pointer transition-all duration-300
          ${dragOver ? 'scale-[1.02] shadow-xl' : 'shadow-lg hover:shadow-xl dark:shadow-[var(--color-bg-dark)]/50'}`}
          role="button"
          tabIndex={0}
          aria-label="点击或拖拽文件至此处上传"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-input')?.click()}
          onKeyDown={handleDropZoneKeyDown}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* 简洁边框 */}
        <div
          className={`absolute inset-0 rounded-2xl border-2 -z-10 transition-colors duration-200
            ${dragOver ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/50 dark:bg-[var(--color-primary-subtle-dark)]/20' : 'border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]'}`}
        />

        <input
          type="file"
          id="file-upload-input"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          disabled={uploading}
          aria-label="选择简历文件"
        />

        <div className="text-center">
          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key="file-selected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4"
              >
                <div
                    className="w-20 h-20 mx-auto bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] rounded-full flex items-center justify-center">
                  <FileText className="w-10 h-10 text-[var(--color-primary-hover)] dark:text-[var(--color-primary)]"/>
                </div>
                <div
                    className="flex items-center justify-center gap-4 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] px-6 py-4 rounded-xl max-w-md mx-auto">
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] truncate">{selectedFile.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                      className="w-8 h-8 bg-[var(--color-error-subtle)] dark:bg-[var(--color-error-subtle-dark)] text-[var(--color-error)] dark:text-[var(--color-error)] rounded-lg hover:bg-[var(--color-error-subtle)] dark:hover:bg-[var(--color-error-subtle-dark)] transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[var(--color-error)] focus-visible:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    aria-label="移除已选择的文件"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="no-file"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <motion.div
                  className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center transition-colors
                    ${dragOver ? 'bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] text-[var(--color-primary-hover)] dark:text-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]'}`}
                  animate={{ y: dragOver ? -5 : 0 }}
                >
                  <Upload className="w-10 h-10" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">点击或拖拽文件至此处</h3>
                  <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-4">
                    {formatHint}（{maxSizeHint}）
                  </p>
                </div>
                <motion.button
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-8 py-3.5 rounded-xl font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('file-upload-input')?.click();
                  }}
                >
                  {selectButtonText}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 名称输入框 */}
      {showNameInput && selectedFile && (
        <motion.div
            className="mt-6 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label className="block text-sm font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-2">{nameLabel}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={namePlaceholder}
            className="w-full px-4 py-3 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] placeholder-[var(--color-text-placeholder)] dark:placeholder-[var(--color-text-placeholder-dark)]"
            disabled={uploading}
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 p-4 bg-[var(--color-error-subtle)] dark:bg-[var(--color-error-subtle-dark)] border border-[var(--color-error)] dark:border-[var(--color-error)] rounded-xl text-[var(--color-error)] dark:text-[var(--color-error)] text-center flex items-center justify-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 操作按钮 */}
      <div className="mt-8 flex gap-4 justify-center">
        {onBack && (
          <motion.button
            onClick={onBack}
            className="px-6 py-3 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] font-medium hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-all focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            返回
          </motion.button>
        )}
        {selectedFile && (
          <motion.button
            onClick={handleUpload}
            disabled={uploading}
            className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
            whileHover={{ scale: uploading ? 1 : 1.02 }}
            whileTap={{ scale: uploading ? 1 : 0.98 }}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                处理中...
              </>
            ) : (
              uploadButtonText
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
