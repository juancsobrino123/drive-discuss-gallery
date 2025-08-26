import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GallerySection from "@/components/ui/gallery-section";
import ShowroomSection from "@/components/ui/showroom-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Gallery = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("events");

  useEffect(() => {
    const title = "Galería | AUTODEBATE";
    const description = t('gallery.subheading');
    const canonicalUrl = typeof window !== 'undefined' ? `${window.location.origin}/galeria` : '/galeria';

    document.title = title;

    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    setMeta('description', description);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);
  }, [t]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Galería AUTODEBATE",
    description: t('gallery.subheading'),
    url: typeof window !== 'undefined' ? `${window.location.origin}/galeria` : '/galeria',
  };

  return (
    <main>
      <header className="pt-28 pb-8 border-b border-border bg-gradient-to-b from-background/50 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground font-brand">
            Galería <span className="text-primary font-brand">AUTODEBATE</span>
          </h1>
        </div>
      </header>

      {/* Structured data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section aria-labelledby="gallery-content" className="py-8">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="events">Eventos</TabsTrigger>
              <TabsTrigger value="showroom">Showroom</TabsTrigger>
            </TabsList>
            
            <TabsContent value="events">
              <h2 id="gallery-events" className="sr-only">Galerías de eventos</h2>
              <GallerySection />
            </TabsContent>
            
            <TabsContent value="showroom">
              <h2 id="gallery-showroom" className="sr-only">Showroom de la comunidad</h2>
              <ShowroomSection />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  );
};

export default Gallery;