import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

export default function HeaderSection() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[var(--color-bg)]/90 dark:bg-[var(--color-bg-dark)]/90 backdrop-blur-xl border-b border-[var(--color-border)]/60 dark:border-[var(--color-border-dark)]/60 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold" style={{ fontFamily: "'Kaushan Script', cursive" }}>
            <span className="text-[var(--color-primary)]">AI</span>
            <span className="text-[var(--color-text)] dark:text-[var(--color-text-dark)]"> Interview</span>
          </span>
          <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hidden sm:inline">面试教练</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            className="w-9 h-9 rounded-xl bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex items-center justify-center hover:border-[var(--color-primary)]/50 transition-all"
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4 text-[var(--color-text)] dark:text-[var(--color-text-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-[var(--color-text)] dark:text-[var(--color-text-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* CTA */}
          <button
            onClick={() => navigate('/upload')}
            className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
          >
            免费体验
          </button>
        </div>
      </div>
    </header>
  );
}
