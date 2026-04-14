import {AnimatePresence, motion} from 'framer-motion';
import JobRoleSelector from './JobRoleSelector';
import type {InterviewPackageOption, InterviewSession, JobRole, JobRoleDTO} from '../types/interview';

interface InterviewConfigPanelProps {
  roles: JobRoleDTO[];
  selectedJobRole: JobRole | null;
  onJobRoleChange: (role: JobRole) => void;
  jobDistributionText: string;
  packages: InterviewPackageOption[];
  selectedPackageId: InterviewPackageOption['id'];
  onPackageChange: (packageId: InterviewPackageOption['id']) => void;
  onStart: () => void;
  isCreating: boolean;
  loadingRoles: boolean;
  checkingUnfinished: boolean;
  unfinishedSession: InterviewSession | null;
  onContinueUnfinished: () => void;
  onStartNew: () => void;
  resumeText: string;
  onBack: () => void;
  error?: string;
  configStep: 1 | 2;
  onStepChange: (step: 1 | 2) => void;
}

export default function InterviewConfigPanel({
  roles,
  selectedJobRole,
  onJobRoleChange,
  jobDistributionText,
  packages,
  selectedPackageId,
  onPackageChange,
  onStart,
  isCreating,
  loadingRoles,
  checkingUnfinished,
  unfinishedSession,
  onContinueUnfinished,
  onStartNew,
  resumeText,
  onBack,
  error,
  configStep,
  onStepChange
}: InterviewConfigPanelProps) {
  const canStart = !isCreating && !loadingRoles && !!selectedJobRole;
  const selectedPackage = packages.find((item) => item.id === selectedPackageId) ?? packages[0];
  const canProceedToStep2 = !!selectedJobRole && !loadingRoles;

  return (
    <motion.div
      className="mx-auto max-w-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-8">
        <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)]">
            <svg className="h-5 w-5 text-[var(--color-primary-hover)] dark:text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
            </svg>
          </div>
          面试配置
        </h2>

        <AnimatePresence>
          {checkingUnfinished && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            >
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                正在检查是否有未完成的面试...
              </div>
            </motion.div>
          )}

          {unfinishedSession && !checkingUnfinished && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-[var(--color-surface-dark)]"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                  <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-amber-900 dark:text-amber-300">检测到未完成的模拟面试</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    当前简历已有未完成面试，只能继续该岗位或强制开始新面试。当前岗位为"{unfinishedSession.jobLabel}"，
                    已完成 {unfinishedSession.currentQuestionIndex} / {unfinishedSession.totalQuestions} 题。
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  onClick={onContinueUnfinished}
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-white transition-colors hover:bg-amber-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  继续完成
                </motion.button>
                <motion.button
                  onClick={onStartNew}
                  className="flex-1 rounded-lg border border-amber-300 bg-white px-4 py-2.5 font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-700 dark:bg-[var(--color-surface-dark)] dark:text-amber-400 dark:hover:bg-amber-900/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  开始新的
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          {/* Step indicator */}
          {configStep === 1 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--color-primary-hover)] dark:text-[var(--color-primary)]">步骤 1 / 2</span>
                <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">选择目标岗位</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]">
                <motion.div
                  className="h-full rounded-full bg-[var(--color-primary)]"
                  initial={{ width: '0%' }}
                  animate={{ width: '50%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {configStep === 2 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--color-primary-hover)] dark:text-[var(--color-primary)]">步骤 2 / 2</span>
                <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">选择面试套餐</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]">
                <motion.div
                  className="h-full rounded-full bg-[var(--color-primary)]"
                  initial={{ width: '50%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Step 1: Job Role Selection */}
          {configStep === 1 && (
            <div>
              <label className="mb-3 block text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                目标岗位
              </label>
              {loadingRoles ? (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] dark:border-[var(--color-border-dark)] dark:bg-[var(--color-surface-raised-dark)] p-4 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                  正在加载岗位列表...
                </div>
              ) : (
                <JobRoleSelector
                  roles={roles}
                  selectedRole={selectedJobRole}
                  onSelect={onJobRoleChange}
                />
              )}
            </div>
          )}

          {/* Step 2: Package Selection */}
          {configStep === 2 && (
            <div>
              <label className="mb-3 block text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                面试套餐
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {packages.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => onPackageChange(item.id)}
                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                      selectedPackageId === item.id
                        ? 'border-[var(--color-primary-hover)] bg-[var(--color-primary-hover)] text-white'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text)] dark:border-[var(--color-border-dark)] dark:bg-[var(--color-surface-dark)] dark:text-[var(--color-text-dark)] hover:border-[var(--color-border-dark)] hover:bg-[var(--color-surface-raised-dark)] dark:hover:border-[var(--color-border)] dark:hover:bg-[var(--color-surface-raised-dark)]'
                    }`}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-base font-semibold">{item.name}</div>
                          {item.id === 'standard' && (
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              selectedPackageId === item.id
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}>
                              推荐
                            </span>
                          )}
                        </div>
                        <div className={`text-sm ${selectedPackageId === item.id ? 'text-white/80' : 'text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]'}`}>
                          共 {item.totalQuestions} 题（含追问）
                        </div>
                        <div className={`text-xs mt-1 ${selectedPackageId === item.id ? 'text-white/60' : 'text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]'}`}>
                          {item.id === 'warmup' && '首次体验 / 时间紧张'}
                          {item.id === 'standard' && '日常练习'}
                          {item.id === 'deep' && '查漏补缺'}
                          {item.id === 'challenge' && '面试前压测'}
                        </div>
                      </div>
                      <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        selectedPackageId === item.id
                          ? 'bg-white/15 text-white'
                          : 'bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]'
                      }`}>
                        {item.estimatedDuration}
                      </div>
                    </div>
                    <div className={`text-sm leading-6 ${selectedPackageId === item.id ? 'text-white/90' : 'text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]'}`}>
                      {item.description}
                    </div>
                  </motion.button>
                ))}
              </div>
              {selectedPackage && (
                <p className="mt-3 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                  当前套餐包含 {selectedPackage.mainQuestionCount} 道主问题，每道主问题带 1 道追问，预计完成 {selectedPackage.estimatedDuration}。
                </p>
              )}
            </div>
          )}

          <div className="mb-6">
            <label className="mb-3 block text-sm font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
              简历摘要（用于生成面试题）
            </label>
            <textarea
              value={resumeText.substring(0, 500) + (resumeText.length > 500 ? '\n\n[...其余内容已截断]' : '')}
              readOnly
              className="h-32 w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-sm text-[var(--color-text-muted)] dark:border-[var(--color-border-dark)] dark:bg-[var(--color-surface-raised-dark)] dark:text-[var(--color-text-muted-dark)]"
            />
            {resumeText.length > 500 && (
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                共 {resumeText.length} 字，此处展示前 500 字作为摘要
              </p>
            )}
          </div>

          <p className="mb-6 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
            {jobDistributionText}
          </p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center gap-4">
            {configStep === 2 && (
              <motion.button
                onClick={() => onStepChange(1)}
                className="rounded-xl border border-[var(--color-border)] px-6 py-3 font-medium text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-raised)] dark:border-[var(--color-border-dark)] dark:text-[var(--color-text-muted-dark)] dark:hover:bg-[var(--color-surface-raised-dark)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                返回
              </motion.button>
            )}
            {configStep === 1 && (
              <>
                <motion.button
                  onClick={onBack}
                  className="rounded-xl border border-[var(--color-border)] px-6 py-3 font-medium text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-surface-raised)] dark:border-[var(--color-border-dark)] dark:text-[var(--color-text-muted-dark)] dark:hover:bg-[var(--color-surface-raised-dark)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  返回
                </motion.button>
                <motion.button
                  onClick={() => onStepChange(2)}
                  disabled={!canProceedToStep2}
                  className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-8 py-3 font-semibold text-white transition-all hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  whileHover={{ scale: canProceedToStep2 ? 1.02 : 1, y: canProceedToStep2 ? -1 : 0 }}
                  whileTap={{ scale: canProceedToStep2 ? 0.98 : 1 }}
                >
                  下一步
                </motion.button>
              </>
            )}
            {configStep === 2 && (
              <motion.button
                onClick={onStart}
                disabled={!canStart}
                className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-8 py-3 font-semibold text-white transition-all hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                whileHover={{ scale: canStart ? 1.02 : 1, y: canStart ? -1 : 0 }}
                whileTap={{ scale: canStart ? 0.98 : 1 }}
              >
                {isCreating ? (
                  <>
                    <motion.span
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    正在生成题目...
                  </>
                ) : (
                  <>开始面试</>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
