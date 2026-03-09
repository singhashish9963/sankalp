// import Navbar from "@/components/layout/Navbar";
// import Footer from "@/components/layout/Footer";

// New NavBar for Landing Page
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
    {/* <Navbar /> */}
    {/* <section className="space-y-8 py-16">
      <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
        Level up careers with AI
      </h2>
      <p className="text-xl text-gray-700 max-w-2xl leading-relaxed">
        Practice interviews, optimize resumes, and get job matches in one place.
      </p>
      <div className="flex gap-4 pt-4">
        <a href="/auth/signup" className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
          Get started
        </a>
        <a href="/dashboard" className="px-8 py-4 rounded-xl border-2 border-gray-300 font-semibold hover:border-purple-600 hover:text-purple-600 transition-all duration-200">
          View dashboard
        </a>
      </div>
    </section>
    <Footer /> */}
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