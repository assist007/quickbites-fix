import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MenuCategories from "@/components/MenuCategories";
import FeaturedDishes from "@/components/FeaturedDishes";
import HowItWorks from "@/components/HowItWorks";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <MenuCategories />
        <FeaturedDishes />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
