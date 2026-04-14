import {motion} from 'framer-motion';
import {calculatePercentage} from '../utils/score';

interface ScoreProgressBarProps {
  label: string;
  score: number;
  maxScore: number;
  color?: string;
  delay?: number;
  className?: string;
}

/**
 * 分数进度条组件
 */
export default function ScoreProgressBar({
  label,
  score,
  maxScore,
  color = 'bg-[var(--color-primary)]',
  delay = 0,
  className = ''
}: ScoreProgressBarProps) {
  const percentage = calculatePercentage(score, maxScore);

  return (
      <div className={`bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-lg p-3 ${className}`}>
          <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-1">{label}</div>
      <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${color} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, delay }}
          />
        </div>
          <span className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-muted-dark)] w-8 text-right">
          {score}/{maxScore}
        </span>
      </div>
    </div>
  );
}
