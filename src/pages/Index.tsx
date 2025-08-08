import Navbar from "@/components/ui/navbar";
import HeroSection from "@/components/ui/hero-section";
import PlatformSection from "@/components/ui/platform-section";
import GallerySection from "@/components/ui/gallery-section";
import BlogSection from "@/components/ui/blog-section";
import EventsSection from "@/components/ui/events-section";
import Footer from "@/components/ui/footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <PlatformSection />
      <GallerySection />
      <BlogSection />
      <EventsSection />
      <Footer />
    </div>
  );
};

export default Index;
