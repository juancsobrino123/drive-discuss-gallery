import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut, loading, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const navItems = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.gallery'), href: '/galeria' },
    { label: t('nav.events'), href: '/eventos' },
    { label: t('nav.about'), href: '/about' },
  ];

  const toggleLanguage = () => {
    const next = i18n.language?.toLowerCase().startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(next);
    try { localStorage.setItem('lang', next); } catch {}
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ description: "Sesión cerrada correctamente" });
      window.location.href = "/";
    } catch (error) {
      console.error('Logout error:', error);
      toast({ description: "Error al cerrar sesión", variant: "destructive" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2" aria-label="AUTODEBATE home">
            <img
              src="/lovable-uploads/a15c83a4-03e8-47b9-b54f-b6bf762bd3fc.png"
              alt="AUTODEBATE logo"
              className="h-8 w-auto light:brightness-0 light:saturate-100 light:invert-[.35] light:sepia-[1] light:hue-rotate-[205deg] light:brightness-[.95] light:contrast-[1.15]"
              width={32}
              height={32}
            />
            <span className="text-xl font-bold text-foreground font-brand">AUTODEBATE</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="/"
              className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium"
            >
              {t('nav.home')}
            </a>
            
            {/* Debate Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors duration-300 font-medium">
                {t('nav.debate')} <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border border-border z-50">
                <DropdownMenuItem asChild>
                  <a href="/blog" className="cursor-pointer text-foreground hover:text-primary">
                    Blog
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/forum" className="cursor-pointer text-foreground hover:text-primary">
                    Forum
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Community Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors duration-300 font-medium">
                Comunidad <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border border-border z-50">
                <DropdownMenuItem asChild>
                  <a href="/comunidad" className="cursor-pointer text-foreground hover:text-primary">
                    Explorar
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/groups" className="cursor-pointer text-foreground hover:text-primary">
                    Grupos
                  </a>
                </DropdownMenuItem>
                {user && (
                  <DropdownMenuItem asChild>
                    <a href="/messages" className="cursor-pointer text-foreground hover:text-primary">
                      Mensajes
                    </a>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {navItems.slice(1).map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>

{/* CTA + User Info (Desktop) */}
<div className="hidden md:flex items-center gap-3">
  {user ? (
    <>
      {/* User Avatar and Name */}
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage 
            src={profile?.avatar_url || ''} 
            alt={profile?.username || user.email} 
          />
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {(profile?.username || user.email)?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-foreground">
          {(profile?.username && profile.username.trim() !== '') ? profile.username : (user.email?.split('@')[0] || user.email)}
        </span>
      </div>
      
      {/* Action Buttons */}
      <Button variant="secondary" size="sm" asChild>
        <a href="/profile">{t('nav.profile')}</a>
      </Button>
      {isAdmin && (
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin">Admin</Link>
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
      >
        {t('nav.logout')}
      </Button>
      
      {/* Language Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleLanguage}
        aria-label={t('nav.language')}
      >
        {i18n.language?.toLowerCase().startsWith('es') ? t('nav.en') : t('nav.es')}
      </Button>
    </>
  ) : (
    <>
      <Button variant="hero" size="sm" asChild>
        <a href="/auth?mode=signup">{t('nav.join')}</a>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        aria-label={t('nav.language')}
      >
        {i18n.language?.toLowerCase().startsWith('es') ? t('nav.en') : t('nav.es')}
      </Button>
    </>
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
      
      <a
        href="/comunidad"
        className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium py-2"
        onClick={() => setIsOpen(false)}
      >
        Comunidad
      </a>
      
      <a
        href="/groups"
        className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium py-2"
        onClick={() => setIsOpen(false)}
      >
        Grupos
      </a>
      
      {user && (
        <a
          href="/messages"
          className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium py-2"
          onClick={() => setIsOpen(false)}
        >
          Mensajes
        </a>
      )}
      
      {/* Mobile News Items */}
      <div className="border-t border-border pt-2 mt-2">
        <a
          href="/blog"
          className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium py-2 block"
          onClick={() => setIsOpen(false)}
        >
          Blog
        </a>
        <a
          href="/forum"
          className="text-muted-foreground hover:text-primary transition-colors duration-300 font-medium py-2 block"
          onClick={() => setIsOpen(false)}
        >
          Forum
        </a>
      </div>
      {/* Mobile User Section */}
      {user && (
        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={profile?.avatar_url || ''} 
                alt={profile?.username || user.email} 
              />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {(profile?.username || user.email)?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">
              {(profile?.username && profile.username.trim() !== '') ? profile.username : (user.email?.split('@')[0] || user.email)}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex flex-wrap items-center gap-2 mt-2">
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
             {isAdmin && (
               <Button variant="outline" size="sm" asChild>
                 <Link to="/admin" onClick={() => setIsOpen(false)}>Admin</Link>
               </Button>
             )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { handleSignOut(); setIsOpen(false); }}
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