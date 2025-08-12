import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { t, i18n } = useTranslation();

  const navItems = [
    { label: t('nav.home'), href: '#home' },
    { label: t('nav.gallery'), href: '/galeria' },
    { label: t('nav.blog'), href: '#blog' },
    { label: t('nav.events'), href: '#events' },
    { label: t('nav.about'), href: '#about' },
  ];

  const toggleLanguage = () => {
    const next = i18n.language?.toLowerCase().startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(next);
    try { localStorage.setItem('lang', next); } catch {}
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2" aria-label="AUTODEBATE home">
            <img
              src="/lovable-uploads/c2057dc6-874e-4d9d-b882-64f80e36c03c.png"
              alt="AUTODEBATE logo"
              className="h-8 w-auto"
              width={32}
              height={32}
            />
            <span className="text-xl font-bold text-foreground font-brand">AUTODEBATE</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>

{/* CTA + Language (Desktop) */}
<div className="hidden md:flex items-center gap-2">
  <Button
    variant="ghost"
    size="sm"
    onClick={toggleLanguage}
    aria-label={t('nav.language')}
  >
    {i18n.language?.toLowerCase().startsWith('es') ? t('nav.en') : t('nav.es')}
  </Button>
  {user ? (
    <>
      <Button variant="secondary" size="sm" asChild>
        <a href="/profile">{t('nav.profile')}</a>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => { await supabase.auth.signOut(); }}
      >
        {t('nav.logout')}
      </Button>
    </>
  ) : (
    <Button variant="hero" size="sm" asChild>
      <a href="/auth?mode=signup">{t('nav.join')}</a>
    </Button>
  )}
</div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

{/* Mobile Menu */}
{isOpen && (
  <div className="md:hidden py-4 border-t border-border">
    <div className="flex flex-col space-y-4">
      {navItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium py-2"
          onClick={() => setIsOpen(false)}
        >
          {item.label}
        </a>
      ))}
      <div className="flex items-center gap-3 mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { toggleLanguage(); setIsOpen(false); }}
          aria-label={t('nav.language')}
        >
          {i18n.language?.toLowerCase().startsWith('es') ? t('nav.en') : t('nav.es')}
        </Button>
        {user ? (
          <>
            <Button variant="secondary" size="sm" asChild>
              <a href="/profile" onClick={() => setIsOpen(false)}>{t('nav.profile')}</a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => { await supabase.auth.signOut(); setIsOpen(false); }}
            >
              {t('nav.logout')}
            </Button>
          </>
        ) : (
          <Button variant="hero" size="sm" asChild>
            <a href="/auth?mode=signup" onClick={() => setIsOpen(false)}>{t('nav.join')}</a>
          </Button>
        )}
      </div>
    </div>
  </div>
)}
      </div>
    </nav>
  );
};

export default Navbar;