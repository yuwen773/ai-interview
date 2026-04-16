import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FileText, Mic, BarChart3, Brain } from 'lucide-react';
import { CTA_LABEL, CTA_TITLE, CTA_SUBTITLE, CTA_BUTTON, CTA_NOTE } from './data';

const CTA_FEATURES = [
  { icon: FileText, text: 'AI 简历分析' },
  { icon: Mic, text: '真实面试模拟' },
  { icon: BarChart3, text: '详细评估报告' },
  { icon: Brain, text: '智能弱点追踪' },
];

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 lg:py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Gradient border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-br from-[var(--color-primary)]/30 via-transparent to-[var(--color-primary)]/20 rounded-3xl" />
          <div className="relative bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-3xl p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
              {/* Left content */}
              <div>
                <span className="inline-block text-xs font-medium uppercase tracking-widest text-[var(--color-primary)] mb-3">
                  {CTA_LABEL}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-4 leading-tight">
                  {CTA_TITLE}
                </h2>
                <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-8 text-sm sm:text-base leading-relaxed">
                  {CTA_SUBTITLE}
                </p>
                <button
                  onClick={() => navigate('/upload')}
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-base sm:text-lg shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-xl hover:shadow-[var(--color-primary)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <span>{CTA_BUTTON}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <p className="mt-3 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{CTA_NOTE}</p>
              </div>

              {/* Right feature pills */}
              <div className="hidden lg:flex flex-col gap-3">
                {CTA_FEATURES.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)]">
                    <Icon className="w-4 h-4 text-[var(--color-primary)]" />
                    <span className="text-sm font-medium text-[var(--color-primary)]">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
