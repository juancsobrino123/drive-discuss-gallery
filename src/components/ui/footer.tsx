import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Mail,
  MapPin,
  Calendar
} from "lucide-react";
import { SiYoutube, SiInstagram, SiTiktok, SiKick, SiFacebook, SiX } from "react-icons/si";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const socialLinks = [
    { icon: SiYoutube, label: "YouTube", url: "https://youtube.com/@autodebate", color: "hover:text-red-500" },
    { icon: SiInstagram, label: "Instagram", url: "https://instagram.com/autodebate", color: "hover:text-pink-500" },
    { icon: SiTiktok, label: "TikTok", url: "https://tiktok.com/@autodebate", color: "hover:text-gray-800" },
    { icon: SiKick, label: "Kick", url: "https://kick.com/autodebate", color: "hover:text-green-500" },
    { icon: SiFacebook, label: "Facebook", url: "https://facebook.com/autodebate", color: "hover:text-blue-600" },
    { icon: SiX, label: "X", url: "https://x.com/autodebate", color: "hover:text-gray-900" }
  ];

  const quickLinks = [
    { key: "home", href: "/" },
    { key: "gallery", href: "/galeria" },
    { key: "blog", href: "/blog" },
    { key: "events", href: "/eventos" },
    { key: "forum", href: "/forum" },
    { key: "about", href: "/about" }
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "DMCA", href: "#" }
  ];

  return (
    <footer className="bg-secondary-dark text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center space-x-3 mb-6" aria-label="AUTODEBATE home">
              <img
                src="/lovable-uploads/a15c83a4-03e8-47b9-b54f-b6bf762bd3fc.png"
                alt="AUTODEBATE logo"
                className="h-12 w-auto"
                width={48}
                height={48}
                loading="lazy"
              />
              <span className="text-2xl font-bold font-brand">AUTODEBATE</span>
            </a>
            <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
              The premier destination for automotive content, community discussions, and event coverage. 
              Join thousands of car enthusiasts across all our platforms.
            </p>
            
            {/* Newsletter Signup */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="font-semibold mb-3">{t('footer.stayInLoop')}</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email"
                  placeholder={t('footer.enterEmail')}
                  className="flex-1 px-3 py-2 rounded-md bg-white/10 border border-white/20 placeholder-white/60 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <Button variant="hero" size="sm">
                  {t('footer.subscribe')}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">{t('footer.quickLinks')}</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.key}>
                  <Link 
                    to={link.href}
                    className="text-gray-300 hover:text-primary transition-colors duration-300"
                  >
                    {t(`nav.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Info */}
          <div>
            <h4 className="font-bold text-lg mb-6">{t('footer.connect')}</h4>
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-gray-300">
                <Mail className="w-4 h-4 mr-3 text-primary" />
                <span className="text-sm">contact@autodebate.com</span>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPin className="w-4 h-4 mr-3 text-primary" />
                <span className="text-sm">Global Coverage</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Calendar className="w-4 h-4 mr-3 text-primary" />
                <span className="text-sm">24/7 Content</span>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h5 className="font-semibold mb-3">{t('footer.followUs')}</h5>
              <div className="grid grid-cols-3 gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 bg-white/10 rounded-lg text-gray-300 transition-all duration-300 ${social.color} hover:bg-white/20 hover:transform hover:-translate-y-0.5`}
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © 2024 AUTODEBATE. {t('footer.rights')}
            </div>
            
            <div className="flex flex-wrap gap-6">
              {legalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-gray-400 hover:text-primary text-sm transition-colors duration-300"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;