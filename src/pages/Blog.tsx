import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import BlogSection from "@/components/ui/blog-section";
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

const Blog = () => {
  useEffect(() => {
    document.title = "Blog de AUTODEBATE — Noticias y artículos";
    setMeta(
      "description",
      "Lee artículos y noticias del mundo motor en AUTODEBATE. Opinión, reviews y cultura automotriz."
    );
    const link: HTMLLinkElement =
      (document.querySelector('link[rel="canonical"]') as HTMLLinkElement) ||
      Object.assign(document.createElement("link"), { rel: "canonical" });
    link.href = window.location.origin + "/blog";
    if (!link.parentElement) document.head.appendChild(link);
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "AUTODEBATE Blog",
    url: typeof window !== "undefined" ? window.location.href : "",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <header className="container mx-auto px-4 py-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Blog de AUTODEBATE</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Artículos, opiniones y tendencias del mundo automotriz.
          </p>
        </header>
        {/* Reutilizamos la sección para mantener diseño y contenido compartido */}
        <BlogSection />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
};

export default Blog;
