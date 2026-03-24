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
  error
}: InterviewConfigPanelProps) {
  const canStart = !isCreating && !loadingRoles && !!selectedJobRole;
  const selectedPackage = packages.find((item) => item.id === selectedPackageId) ?? packages[0];

  return (
    <motion.div
      className="mx-auto max-w-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50">
        <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/50">
            <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" viewBox="0 0 24 24" fill="none">
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
              className="mb-6 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 dark:border-amber-800 dark:from-amber-900/30 dark:to-orange-900/30"
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
                    当前简历已有未完成面试，只能继续该岗位或强制开始新面试。当前岗位为“{unfinishedSession.jobLabel}”，
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
                  className="flex-1 rounded-lg border border-amber-300 bg-white px-4 py-2.5 font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-700 dark:bg-slate-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
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
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              目标岗位
            </label>
            {loadingRoles ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
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

          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              面试套餐
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {packages.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => onPackageChange(item.id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                    selectedPackageId === item.id
                      ? 'border-primary-500 bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700'
                  }`}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{item.name}</div>
                      <div className={`text-sm ${selectedPackageId === item.id ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                        共 {item.totalQuestions} 题（含追问）
                      </div>
                    </div>
                    <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      selectedPackageId === item.id
                        ? 'bg-white/15 text-white'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {item.estimatedDuration}
                    </div>
                  </div>
                  <div className={`text-sm leading-6 ${selectedPackageId === item.id ? 'text-white/90' : 'text-slate-600 dark:text-slate-300'}`}>
                    {item.description}
                  </div>
                </motion.button>
              ))}
            </div>
            {selectedPackage && (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                当前套餐包含 {selectedPackage.mainQuestionCount} 道主问题，每道主问题带 1 道追问，预计完成 {selectedPackage.estimatedDuration}。
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="mb-3 block text-sm font-semibold text-slate-600 dark:text-slate-400">
              简历预览（前 500 字）
            </label>
            <textarea
              value={resumeText.substring(0, 500) + (resumeText.length > 500 ? '...' : '')}
              readOnly
              className="h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400"
            />
          </div>

          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
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
            <motion.button
              onClick={onBack}
              className="rounded-xl border border-slate-200 px-6 py-3 font-medium text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              返回
            </motion.button>
            <motion.button
              onClick={onStart}
              disabled={!canStart}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-3 font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
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
                <>{selectedJobRole ? '开始面试' : '请选择岗位'}</>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
