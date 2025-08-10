import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, Calendar } from "lucide-react";
import { SiYoutube, SiInstagram, SiTiktok, SiKick, SiFacebook, SiX } from "react-icons/si";
import { useTranslation } from "react-i18next";

const PlatformSection = () => {
  const { t } = useTranslation();
  const platforms = [
    {
      name: "YouTube",
      username: "@autodebate",
      description: "Latest automotive content, motorsports, reviews and debates",
      stats: "50K+ subscribers",
      icon: SiYoutube,
      url: "https://youtube.com/@autodebate",
      color: "from-red-500 to-red-600",
      featured: true
    },
    {
      name: "Instagram",
      username: "@autodebate",
      description: "Daily automotive video, photography and stories",
      stats: "25K+ followers",
      icon: SiInstagram,
      url: "https://instagram.com/autodebate",
      color: "from-pink-500 to-purple-600"
    },
    {
      name: "TikTok",
      username: "@autodebate",
      description: "Quick automotive insights and trends",
      stats: "15K+ followers",
      icon: SiTiktok,
      url: "https://tiktok.com/@autodebate",
      color: "from-black to-gray-800"
    },
    {
      name: "Kick",
      username: "@autodebate",
      description: "Live automotive discussions and streams",
      stats: "5K+ followers",
      icon: SiKick,
      url: "https://kick.com/autodebate",
      color: "from-green-500 to-green-600"
    },
    {
      name: "Facebook",
      username: "@autodebate",
      description: "Community discussions and event updates",
      stats: "20K+ likes",
      icon: SiFacebook,
      url: "https://facebook.com/autodebate",
      color: "from-blue-600 to-blue-700"
    },
    {
      name: "X (Twitter)",
      username: "@autodebate",
      description: "Real-time automotive news and updates",
      stats: "12K+ followers",
      icon: SiX,
      url: "https://x.com/autodebate",
      color: "from-gray-900 to-black"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t('platform.heading')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('platform.subheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform, index) => (
            <Card 
              key={platform.name} 
              className={`p-6 hover:shadow-royal transition-all duration-300 transform hover:-translate-y-2 bg-gradient-card border-border/50 ${
                platform.featured ? 'md:col-span-2 lg:col-span-1 ring-2 ring-primary/20' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                  <platform.icon className="text-white" size={24} />
                </div>
                {platform.featured && (
                  <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {t('platform.primary')}
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">{platform.name}</h3>
              <p className="text-muted-foreground text-sm mb-1">{platform.username}</p>
              <p className="text-muted-foreground mb-4">{platform.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-primary font-semibold">{platform.stats}</span>
                <Button 
                  variant="platform" 
                  size="sm"
                  asChild
                  className="group"
                >
                  <a href={platform.url} target="_blank" rel="noopener noreferrer">
                    {t('platform.follow')}
                    <ExternalLink className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto p-8 bg-gradient-card" aria-labelledby="newsletter-title">
            <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {t('platform.newsletterHeading')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('platform.newsletterDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder={t('platform.emailPlaceholder')}
                className="flex-1 px-4 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <Button variant="hero">
                {t('platform.subscribe')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PlatformSection;