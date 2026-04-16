import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import SectionHeading from './components/SectionHeading';
import { TESTIMONIALS_LABEL, TESTIMONIALS_TITLE, TESTIMONIALS_SUBTITLE, TESTIMONIALS, type Testimonial } from './data';

// ============================================================================
// TestimonialCard
// ============================================================================

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl p-6 relative hover:border-[var(--color-primary)]/30 transition-all duration-300"
    >
      <Quote className="w-5 h-5 text-[var(--color-primary)] opacity-30 absolute top-5 right-5" />
      <p className="text-[var(--color-text)] dark:text-[var(--color-text-dark)] italic leading-relaxed text-sm mb-5 pr-6">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] flex items-center justify-center flex-shrink-0">
          <span className="text-[var(--color-primary)] font-semibold text-sm">{testimonial.author[0]}</span>
        </div>
        <div>
          <div className="font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)] text-sm">{testimonial.author}</div>
          <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{testimonial.detail}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Testimonials Section
// ============================================================================

export default function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeading label={TESTIMONIALS_LABEL} title={TESTIMONIALS_TITLE} subtitle={TESTIMONIALS_SUBTITLE} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((testimonial, i) => (
            <TestimonialCard key={testimonial.author} testimonial={testimonial} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
