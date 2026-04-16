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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] relative overflow-x-hidden">
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
