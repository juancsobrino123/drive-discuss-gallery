import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
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

const About = () => {
  useEffect(() => {
    document.title = "Sobre AUTODEBATE — Nuestra misión";
    setMeta(
      "description",
      "Conoce la misión y el equipo de AUTODEBATE: contenido honesto, comunidad y pasión por el motor."
    );
    const link: HTMLLinkElement =
      (document.querySelector('link[rel="canonical"]') as HTMLLinkElement) ||
      Object.assign(document.createElement("link"), { rel: "canonical" });
    link.href = window.location.origin + "/about";
    if (!link.parentElement) document.head.appendChild(link);
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Sobre AUTODEBATE",
    url: typeof window !== "undefined" ? window.location.href : "",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <header className="container mx-auto px-4 py-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Sobre AUTODEBATE</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Creamos contenido y conversaciones honestas sobre el mundo del motor, impulsando una comunidad global.
          </p>
        </header>
        <section className="container mx-auto px-4 pb-16 grid gap-8 md:grid-cols-2">
          <article className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-semibold">Nuestra misión</h2>
            <p>
              Informar, entretener y conectar a entusiastas del motor con coberturas, debates y recursos abiertos.
            </p>
            <h2 className="text-2xl font-semibold mt-8">Valores</h2>
            <ul className="list-disc pl-6">
              <li>Transparencia editorial</li>
              <li>Respeto por la comunidad</li>
              <li>Calidad visual y técnica</li>
            </ul>
          </article>
          <aside className="rounded-lg border border-border p-6 bg-muted/20">
            <h3 className="text-xl font-semibold mb-2">Contacto</h3>
            <p className="text-muted-foreground">Escríbenos a contacto@autodebate.com</p>
          </aside>
        </section>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
};

export default About;
