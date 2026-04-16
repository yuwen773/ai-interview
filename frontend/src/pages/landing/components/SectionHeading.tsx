import { motion } from 'framer-motion';

interface SectionHeadingProps {
  label?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function SectionHeading({ label, title, subtitle, className = '' }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`text-center mb-12 ${className}`}
    >
      {label && (
        <span className="inline-block text-xs font-medium uppercase tracking-widest text-[var(--color-primary)] dark:text-[var(--color-primary)] mb-3">
          {label}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] max-w-xl mx-auto text-sm">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
