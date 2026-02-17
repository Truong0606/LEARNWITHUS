import { Header, Footer } from "@/components/shared";
import {
  HeroSection,
  FeaturesSection,
  ProcessSection,
  TestimonialsSection,
  TeamSection,
  FAQSection,
  BlogSection,
  TrustSection,
  CTASection,
} from "@/components/home";

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
