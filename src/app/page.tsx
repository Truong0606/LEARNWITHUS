import dynamic from 'next/dynamic';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import ProcessSection from '@/components/home/ProcessSection';

const TestimonialsSection = dynamic(() => import('@/components/home/TestimonialsSection'), { ssr: true });
const TeamSection = dynamic(() => import('@/components/home/TeamSection'), { ssr: true });
const FAQSection = dynamic(() => import('@/components/home/FAQSection'), { ssr: true });
const BlogSection = dynamic(() => import('@/components/home/BlogSection'), { ssr: true });
const TrustSection = dynamic(() => import('@/components/home/TrustSection'), { ssr: true });
const CTASection = dynamic(() => import('@/components/home/CTASection'), { ssr: true });

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ProcessSection />
        <TestimonialsSection />
        <TeamSection />
        <FAQSection />
        <BlogSection />
        <TrustSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
