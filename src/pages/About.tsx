import Navbar from "@/components/ui/navbar";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, Target, Award, Heart, Briefcase } from "lucide-react";

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
    document.title = "Nosotros — AUTODEBATE";
    setMeta(
      "description",
      "Conoce al equipo de AUTODEBATE: contenido honesto, comunidad y pasión por el motor. Únete a nosotros."
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
    name: "Nosotros — AUTODEBATE",
    url: typeof window !== "undefined" ? window.location.href : "",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/20 via-background to-accent/10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent"></div>
          <div className="container mx-auto px-4 py-20 relative">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-4 text-primary border-primary/50">
                <Users className="w-4 h-4 mr-2" />
                Equipo AUTODEBATE
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-6">
                Nosotros
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Somos un equipo apasionado por el mundo del motor, dedicado a crear contenido auténtico y construir la comunidad automotriz más grande del mundo hispano.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Values */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/40">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Nuestra Misión</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Informar, entretener y conectar a entusiastas del motor con coberturas exclusivas, debates profundos y recursos de calidad.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/40">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Nuestra Pasión</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Vivimos y respiramos motores. Cada contenido que creamos nace de nuestra genuina pasión por la cultura automotriz.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/40">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Nuestros Valores</h3>
                  <ul className="text-muted-foreground space-y-2 text-left">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      Transparencia editorial
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      Respeto por la comunidad
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      Calidad visual y técnica
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Lo que hacemos</h2>
              <p className="text-xl text-muted-foreground">
                Cubrimos el mundo automotriz desde todos los ángulos posibles
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                { title: "Eventos", desc: "Cobertura exclusiva de los mejores eventos automotrices" },
                { title: "Reviews", desc: "Análisis honestos de vehículos y productos" },
                { title: "Comunidad", desc: "Espacios para que los entusiastas se conecten" },
                { title: "Contenido", desc: "Videos, artículos y podcasts de calidad premium" }
              ].map((item, index) => (
                <div key={index} className="bg-gradient-to-br from-muted/50 to-muted/80 p-6 rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300">
                  <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Work With Us */}
        <section className="py-20 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <Briefcase className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-4xl font-bold mb-6">¿Quieres trabajar con nosotros?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Estamos siempre buscando talento apasionado por el mundo del motor. Si compartes nuestra visión y quieres formar parte del equipo AUTODEBATE, nos encantaría conocerte.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <Mail className="w-5 h-5 mr-2" />
                  Enviar CV
                </Button>
                <Button variant="outline" size="lg">
                  Ver oportunidades
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Escríbenos a: <span className="text-primary font-medium">trabajo@autodebate.com</span>
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="border-primary/20 bg-gradient-to-br from-card/80 to-muted/40">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold mb-4">Mantente en contacto</h3>
                  <p className="text-muted-foreground mb-6">
                    ¿Tienes alguna pregunta, sugerencia o simplemente quieres saludar? No dudes en escribirnos.
                  </p>
                  <Button variant="outline" size="lg" className="border-primary/50 hover:bg-primary/10">
                    <Mail className="w-5 h-5 mr-2" />
                    contacto@autodebate.com
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
};

export default About;
