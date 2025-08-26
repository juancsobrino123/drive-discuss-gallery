import { Button } from "@/components/ui/button";
import { Play, Users, Calendar, Camera } from "lucide-react";
import heroImage from "@/assets/hero-cars.jpg";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

const HeroSection = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="AUTODEBATE - Automotive Content Creation" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <Link 
            to={user ? "/comunidad" : "/auth"}
            className="inline-flex items-center bg-primary-light border border-primary/20 rounded-full px-6 py-2 mb-8 animate-fade-in hover:bg-primary/10 transition-colors"
          >
            <Users className="w-4 h-4 text-primary mr-2" />
            <span className="text-primary font-medium">{t('hero.badge')}</span>
          </Link>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in font-brand">
            AUTO<span className="text-primary">DEBATE</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            {t('hero.tagline')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-scale-in">
            <Button variant="hero" size="lg" className="text-lg px-8 py-4">
              <Play className="w-5 h-5 mr-2" />
              {t('hero.watch')}
            </Button>
            <Button variant="platform" size="lg" className="text-lg px-8 py-4">
              <Camera className="w-5 h-5 mr-2" />
              {t('hero.browseGallery')}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center animate-fade-in">
            <div className="bg-card/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <div className="text-3xl font-bold text-white mb-2">50K+</div>
              <div className="text-gray-300">{t('hero.stats.yt')}</div>
            </div>
            <div className="bg-card/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <div className="text-3xl font-bold text-white mb-2">25K+</div>
              <div className="text-gray-300">{t('hero.stats.ig')}</div>
            </div>
            <div className="bg-card/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <div className="text-3xl font-bold text-white mb-2">100+</div>
              <div className="text-gray-300">{t('hero.stats.events')}</div>
            </div>
            <div className="bg-card/10 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <div className="text-3xl font-bold text-white mb-2">10K+</div>
              <div className="text-gray-300">{t('hero.stats.members')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;