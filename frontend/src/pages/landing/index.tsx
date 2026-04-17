import HeaderSection from './HeaderSection';
import HeroSection from './HeroSection';
import PainPointSection from './PainPointSection';
import FeaturesSection from './FeaturesSection';
import HowItWorksSection from './HowItWorksSection';
import DemoPreviewSection from './DemoPreviewSection';
import TestimonialsSection from './TestimonialsSection';
import FAQSection from './FAQSection';
import CTASection from './CTASection';
import FooterSection from './FooterSection';
import SplashCursor from '../../components/SplashCursor';
import { useTheme } from '../../hooks/useTheme';

export default function LandingPage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] relative overflow-x-hidden">
      <SplashCursor
        RAINBOW_MODE={false}
        COLOR={theme === 'dark' ? '#f59e0b' : '#d97706'}
        theme={theme}
      />
      <HeaderSection />
      <HeroSection />
      <PainPointSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoPreviewSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
