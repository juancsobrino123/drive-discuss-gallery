import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import GallerySection from "@/components/ui/gallery-section";

const Gallery = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const title = "Galería de Eventos | AUTODEBATE";
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
    name: "Galería de Eventos AUTODEBATE",
    description: t('gallery.subheading'),
    url: typeof window !== 'undefined' ? `${window.location.origin}/galeria` : '/galeria',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <header className="pt-28 pb-8 border-b border-border bg-gradient-to-b from-background/50 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground font-brand">
              Galería de Eventos <span className="text-primary">AUTODEBATE</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-3xl mx-auto">
              {t('gallery.subheading')}
            </p>
          </div>
        </header>

        {/* Structured data for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <section aria-labelledby="gallery-all" className="py-8">
          <div className="container mx-auto px-4">
            <h2 id="gallery-all" className="sr-only">Todas las galerías</h2>
            <GallerySection />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;