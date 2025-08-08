import { Button } from "@/components/ui/button";
import { 
  Youtube, 
  Instagram, 
  Facebook, 
  Twitter, 
  Play,
  MessageSquare,
  Mail,
  MapPin,
  Calendar
} from "lucide-react";

const Footer = () => {
  const socialLinks = [
    { icon: Youtube, label: "YouTube", url: "https://youtube.com/@autodebate", color: "hover:text-red-500" },
    { icon: Instagram, label: "Instagram", url: "https://instagram.com/autodebate", color: "hover:text-pink-500" },
    { icon: Play, label: "TikTok", url: "https://tiktok.com/@autodebate", color: "hover:text-gray-800" },
    { icon: MessageSquare, label: "Kick", url: "https://kick.com/autodebate", color: "hover:text-green-500" },
    { icon: Facebook, label: "Facebook", url: "https://facebook.com/autodebate", color: "hover:text-blue-600" },
    { icon: Twitter, label: "X", url: "https://x.com/autodebate", color: "hover:text-gray-900" }
  ];

  const quickLinks = [
    { label: "Gallery", href: "#gallery" },
    { label: "Blog", href: "#blog" },
    { label: "Events", href: "#events" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" }
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
                src="/lovable-uploads/c2057dc6-874e-4d9d-b882-64f80e36c03c.png"
                alt="AUTODEBATE logo"
                className="h-12 w-auto"
                width={48}
                height={48}
                loading="lazy"
              />
              <span className="text-2xl font-bold">AUTODEBATE</span>
            </a>
            <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
              The premier destination for automotive content, community discussions, and event coverage. 
              Join thousands of car enthusiasts across all our platforms.
            </p>
            
            {/* Newsletter Signup */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="font-semibold mb-3">Stay in the Loop</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 rounded-md bg-white/10 border border-white/20 placeholder-white/60 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <Button variant="hero" size="sm">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-gray-300 hover:text-primary transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Info */}
          <div>
            <h4 className="font-bold text-lg mb-6">Connect</h4>
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
              <h5 className="font-semibold mb-3">Follow Us</h5>
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
              © 2024 AUTODEBATE. All rights reserved.
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