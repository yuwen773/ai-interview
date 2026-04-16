import { motion } from 'framer-motion';
import SectionHeading from './components/SectionHeading';
import { PAIN_LABEL, PAIN_TITLE, PAIN_SUBTITLE, PAIN_TRANSITION, PAIN_POINTS } from './data';

export default function PainPointSection() {
  return (
    <section className="py-20 lg:py-28 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <SectionHeading label={PAIN_LABEL} title={PAIN_TITLE} subtitle={PAIN_SUBTITLE} />

        <div className="space-y-4 mt-10 mb-10">
          {PAIN_POINTS.map((point, i) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-4 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl px-5 py-4 text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--color-error)]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4.5 h-4.5 text-[var(--color-error)]" />
                </div>
                <span className="text-[var(--color-text)] dark:text-[var(--color-text-dark)] text-sm sm:text-base">{point.text}</span>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-lg sm:text-xl font-semibold text-[var(--color-primary)]"
        >
          {PAIN_TRANSITION}
        </motion.p>
      </div>
    </section>
  );
}
