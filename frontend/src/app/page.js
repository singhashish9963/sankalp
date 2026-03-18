import Comparison from "@/components/landing/Comparison";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/layout/Footer";
export default function Page() {
  return (
    <>
        <Navbar />
        <Hero />
        <Features />
        <HowItWorks />
        <Comparison />
        <CTA />
        <Footer />
    </>
  );
}