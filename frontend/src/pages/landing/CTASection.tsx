import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { CTA_LABEL, CTA_TITLE, CTA_SUBTITLE, CTA_BUTTON, CTA_NOTE } from './data';
import BorderGlow from '../../components/BorderGlow';
import { useTheme } from '../../hooks/useTheme';

const Lanyard = lazy(() => import('../../components/Lanyard'));

export default function CTASection() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <section className="py-20 lg:py-28 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* 左侧：CTA 文字 + 按钮 */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <BorderGlow
            backgroundColor={theme === 'dark' ? '#26282f' : '#ffffff'}
            borderRadius={24}
            glowColor="38 92 50"
            glowIntensity={1.0}
            glowRadius={50}
            colors={['#f59e0b', '#fbbf24', '#d97706']}
            fillOpacity={0.5}
            className="p-8 sm:p-12"
          >
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
              {CTA_BUTTON}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <p className="mt-3 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{CTA_NOTE}</p>
          </BorderGlow>
        </motion.div>

        {/* 右侧：Offer 吊牌 */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-[420px] sm:h-[480px] lg:h-[520px]"
        >
          <Suspense fallback={
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <Lanyard position={[0, 0, 30]} gravity={[0, -40, 0]} />
          </Suspense>
        </motion.div>
      </div>
    </section>
  );
}
