import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("mode");
    return m === "signup" ? "signup" : "signin";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Basic SEO tags
    const title = mode === "signin" ? "Login | AUTODEBATE" : "Sign up | AUTODEBATE";
    document.title = title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      mode === "signin"
        ? "Log in to your AUTODEBATE account to access the community and events."
        : "Create your AUTODEBATE account to join the community and events."
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
  }, [mode]);

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
        <h1 className="sr-only">AUTODEBATE authentication</h1>
      </header>
      <main className="container mx-auto px-4">
        <section className="max-w-md mx-auto bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-1">
            {mode === "signin" ? "Log in to AUTODEBATE" : "Create your AUTODEBATE account"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {mode === "signin" ? "Enter your credentials to continue." : "Sign up with your email and a password."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
              />
            </div>

            <Button type="submit" className="w-full" variant="hero" disabled={loading}>
              {loading ? (mode === "signin" ? "Signing in..." : "Creating account...") : mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
          </form>

          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-muted-foreground">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}> 
              {mode === "signin" ? "Create one" : "Sign in"}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Auth;
