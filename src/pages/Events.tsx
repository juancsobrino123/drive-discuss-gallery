import Navbar from "@/components/ui/navbar";
import EventsSection from "@/components/ui/events-section";
import { useEffect } from "react";

const setMeta = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const Events = () => {
  useEffect(() => {
    document.title = "Eventos — Coberturas y agenda | AUTODEBATE";
    setMeta(
      "description",
      "Descubre eventos automotrices: coberturas, transmisiones y encuentros. Agenda y recap en AUTODEBATE."
    );
    const link: HTMLLinkElement =
      (document.querySelector('link[rel="canonical"]') as HTMLLinkElement) ||
      Object.assign(document.createElement("link"), { rel: "canonical" });
    link.href = window.location.origin + "/eventos";
    if (!link.parentElement) document.head.appendChild(link);
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Eventos AUTODEBATE",
    url: typeof window !== "undefined" ? window.location.href : "",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <header className="container mx-auto px-4 py-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Eventos</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Coberturas, directos y encuentros de la comunidad.
          </p>
        </header>
        <EventsSection />
      </main>
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
};

export default Events;
