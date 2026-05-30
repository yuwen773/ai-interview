import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface InterviewPageHeaderProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
}

export default function InterviewPageHeader({
  title,
  subtitle,
  icon,
}: InterviewPageHeaderProps) {
  return (
    <motion.div
      className="text-center mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-3xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2 flex items-center justify-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] rounded-xl flex items-center justify-center">
          {icon}
        </div>
        {title}
      </h1>
      <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{subtitle}</p>
    </motion.div>
  );
}