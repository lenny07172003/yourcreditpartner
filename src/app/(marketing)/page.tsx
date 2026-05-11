import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { PartnerTypeGrid } from "@/components/marketing/PartnerTypeGrid";
import { EarningsCalculator } from "@/components/marketing/EarningsCalculator";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Founder } from "@/components/marketing/Founder";
import { FAQ } from "@/components/marketing/FAQ";
import { FooterCTA } from "@/components/marketing/FooterCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <PartnerTypeGrid />
      <EarningsCalculator />
      <Testimonials />
      <Founder />
      <FAQ />
      <FooterCTA />
    </>
  );
}
