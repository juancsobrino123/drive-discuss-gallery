import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Eye, Calendar, MapPin } from "lucide-react";
import galleryPreview from "@/assets/gallery-preview.jpg";
import { useTranslation } from "react-i18next";

const GallerySection = () => {
  const { t } = useTranslation();
  const events = [
    {
      title: "Tokyo Auto Salon 2024",
      date: "January 12-14, 2024",
      location: "Makuhari Messe, Tokyo",
      photos: 156,
      featured: true
    },
    {
      title: "SEMA Show Las Vegas",
      date: "October 31 - Nov 3, 2023",
      location: "Las Vegas Convention Center",
      photos: 243
    },
    {
      title: "Goodwood Festival",
      date: "July 13-16, 2023",
      location: "Goodwood, UK",
      photos: 189
    },
    {
      title: "Formula Drift Championship",
      date: "August 25-26, 2023",
      location: "Long Beach, CA",
      photos: 201
    }
  ];

  return (
    <section id="gallery" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t('gallery.heading')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('gallery.subheading')}
          </p>
        </div>

        {/* Featured Gallery Preview */}
        <div className="mb-16">
          <Card className="overflow-hidden bg-gradient-card shadow-elegant">
            <div className="relative">
              <img 
                src={galleryPreview} 
                alt="Event photography gallery preview"
                className="w-full h-64 md:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center text-white/90 text-sm mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('gallery.latestEvent')}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Tokyo Auto Salon 2024 - Complete Collection
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="hero" size="lg">
                    <Eye className="w-5 h-5 mr-2" />
                    {t('gallery.viewGallery')}
                  </Button>
                  <Button variant="platform" size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    {t('gallery.downloadAll', { count: 156 })}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Event Galleries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {events.map((event, index) => (
            <Card 
              key={event.title}
              className={`p-6 hover:shadow-royal transition-all duration-300 transform hover:-translate-y-2 bg-gradient-card ${
                event.featured ? 'ring-2 ring-primary/20' : ''
              }`}
            >
              {event.featured && (
                <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full mb-4 w-fit">
                  {t('gallery.latest')}
                </div>
              )}

              <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2">
                {event.title}
              </h3>
              
              <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {event.date}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.location}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-primary font-semibold">
                  {event.photos} {t('gallery.photos')}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Gallery Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto">
              <Download className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">{t('gallery.features.freeTitle')}</h3>
            <p className="text-muted-foreground">
              {t('gallery.features.freeDesc')}
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto">
              <Eye className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">{t('gallery.features.qualityTitle')}</h3>
            <p className="text-muted-foreground">
              {t('gallery.features.qualityDesc')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">{t('gallery.features.updatesTitle')}</h3>
            <p className="text-muted-foreground">
              {t('gallery.features.updatesDesc')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GallerySection;