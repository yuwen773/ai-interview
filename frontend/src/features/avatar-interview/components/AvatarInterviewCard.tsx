export interface AvatarInterviewCardProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Card component that displays a VRM avatar with a title and subtitle.
 */
export function AvatarInterviewCard({
  title = 'AI Avatar Interview',
  subtitle,
  className = '',
}: AvatarInterviewCardProps) {
  return (
    <div className={`flex flex-col items-center gap-4 p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}>
      {title && (
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}