import { motion } from 'framer-motion';
import type { JobRole, JobRoleDTO } from '../types/interview';

interface JobRoleSelectorProps {
  roles: JobRoleDTO[];
  selectedRole: JobRole | null;
  onSelect: (role: JobRole) => void;
  disabled?: boolean;
}

export default function JobRoleSelector({
  roles,
  selectedRole,
  onSelect,
  disabled = false,
}: JobRoleSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {roles.map((role) => {
        const selected = role.code === selectedRole;

        return (
          <motion.button
            key={role.code}
            type="button"
            onClick={() => onSelect(role.code)}
            disabled={disabled}
            className={`rounded-2xl border p-4 text-left transition-all ${
              selected
                ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10 dark:border-primary-400 dark:bg-primary-900/20'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-slate-600 dark:hover:bg-slate-800'
            } disabled:cursor-not-allowed disabled:opacity-60`}
            whileHover={{ scale: disabled ? 1 : 1.01 }}
            whileTap={{ scale: disabled ? 1 : 0.99 }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{role.label}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{role.description}</p>
              </div>
              {selected && (
                <span className="rounded-full bg-primary-500 px-2.5 py-1 text-xs font-semibold text-white">
                  已选择
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {role.techKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
