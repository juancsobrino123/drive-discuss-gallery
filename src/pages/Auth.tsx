import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Basic SEO tags
    const title = mode === "signin" ? t('auth.loginTitle') : t('auth.signupTitle');
    document.title = title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      mode === "signin" ? t('auth.loginDescription') : t('auth.signupDescription')
    );

    // Canonical
    const canonicalHref = `${window.location.origin}/auth`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);
  }, [mode, t]);

  useEffect(() => {
    // Redirect if already authenticated
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) {
        navigate("/", { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "We sent you a confirmation link." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "Successfully signed in." });
        setTimeout(() => navigate("/", { replace: true }), 300);
      }
    } catch (err: any) {
      toast({ title: "Authentication error", description: err.message ?? "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24">
      <header className="container mx-auto px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('auth.back')}
        </Button>
        <h1 className="sr-only font-brand">AUTODEBATE authentication</h1>
      </header>
      <main className="container mx-auto px-4">
        <section className="max-w-md mx-auto bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-1">
            {mode === "signin" ? t('auth.loginHeading') : t('auth.signupHeading')}
          </h2>
          <p className="text-muted-foreground mb-6">
            {mode === "signin" ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" variant="hero" disabled={loading}>
              {loading ? (mode === "signin" ? t('auth.signingIn') : t('auth.creatingAccount')) : mode === "signin" ? t('auth.signIn') : t('auth.signUp')}
            </Button>
          </form>

          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-muted-foreground">
              {mode === "signin" ? t('auth.noAccount') : t('auth.hasAccount')}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}> 
              {mode === "signin" ? t('auth.createOne') : t('auth.signIn')}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Auth;
