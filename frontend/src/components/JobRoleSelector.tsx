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
            aria-pressed={selected}
            className={`rounded-2xl border p-4 text-left transition-all ${
              selected
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-subtle)] dark:border-[var(--color-primary)] dark:bg-[var(--color-primary-subtle-dark)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface)] dark:border-[var(--color-border-dark)] dark:bg-[var(--color-surface-raised-dark)] dark:hover:border-[var(--color-border-dark)] dark:hover:bg-[var(--color-surface-dark)]'
            } disabled:cursor-not-allowed disabled:opacity-60`}
            whileHover={{ scale: disabled ? 1 : 1.01 }}
            whileTap={{ scale: disabled ? 1 : 0.99 }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{role.label}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{role.description}</p>
              </div>
              {selected && (
                <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-xs font-semibold text-white">
                  已选择
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {role.techKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)] dark:bg-[var(--color-surface-dark)] dark:text-[var(--color-text-muted-dark)] dark:ring-[var(--color-border-dark)]"
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
