import Navbar from "@/components/ui/navbar";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, Target, Award, Heart, Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = t('about.pageTitle');
    setMeta(
      "description",
      t('about.pageDescription')
    );
    const link: HTMLLinkElement =
      (document.querySelector('link[rel="canonical"]') as HTMLLinkElement) ||
      Object.assign(document.createElement("link"), { rel: "canonical" });
    link.href = window.location.origin + "/about";
    if (!link.parentElement) document.head.appendChild(link);
  }, [t]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: t('about.pageTitle'),
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
                {t('about.teamBadge')}
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-6">
                {t('about.title')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t('about.subtitle')}
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
                  <h3 className="text-2xl font-bold mb-4">{t('about.missionTitle')}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('about.missionDesc')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/40">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{t('about.passionTitle')}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('about.passionDesc')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/40">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{t('about.valuesTitle')}</h3>
                  <ul className="text-muted-foreground space-y-2 text-left">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      {t('about.value1')}
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      {t('about.value2')}
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      {t('about.value3')}
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
              <h2 className="text-4xl font-bold mb-6">{t('about.whatWeDoTitle')}</h2>
              <p className="text-xl text-muted-foreground">
                {t('about.whatWeDoDesc')}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                { title: t('about.eventsTitle'), desc: t('about.eventsDesc') },
                { title: t('about.reviewsTitle'), desc: t('about.reviewsDesc') },
                { title: t('about.communityTitle'), desc: t('about.communityDesc') },
                { title: t('about.contentTitle'), desc: t('about.contentDesc') }
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
              <h2 className="text-4xl font-bold mb-6">{t('about.workWithUsTitle')}</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                {t('about.workWithUsDesc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <Mail className="w-5 h-5 mr-2" />
                  {t('about.sendCV')}
                </Button>
                <Button variant="outline" size="lg">
                  {t('about.viewOpportunities')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                {t('about.contactEmail')} <span className="text-primary font-medium">autodebate@gmail.com</span>
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
                  <h3 className="text-2xl font-bold mb-4">{t('about.stayInTouchTitle')}</h3>
                  <p className="text-muted-foreground mb-6">
                    {t('about.stayInTouchDesc')}
                  </p>
                  <Button variant="outline" size="lg" className="border-primary/50 hover:bg-primary/10">
                    <Mail className="w-5 h-5 mr-2" />
                    autodebate@gmail.com
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
