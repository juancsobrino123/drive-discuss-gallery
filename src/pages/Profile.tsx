import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

// Simple SEO helpers without extra deps
function setMeta(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // SEO
  useEffect(() => {
    document.title = "Profile | AUTODEBATE";
    setMeta("description", "Manage your AUTODEBATE profile: update username and avatar.");
    setCanonical(`${window.location.origin}/profile`);
  }, []);

  // Auth and profile loading
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        // Defer to avoid deadlocks
        setTimeout(() => loadProfile(uid), 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) loadProfile(uid);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid: string) => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", uid)
      .maybeSingle();

    if (error) {
      toast.error("Failed to load profile");
    }

    if (!data) {
      // Ensure profile exists
      try {
        await (supabase as any).from("profiles").insert({ id: uid });
      } catch {}
      setUsername("");
      setAvatarUrl(null);
    } else {
      setUsername(data.username ?? "");
      setAvatarUrl(data.avatar_url ?? null);
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!userId) return;
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ username })
      .eq("id", userId);
    if (error) return toast.error("Could not save username");
    toast.success("Profile updated");
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const path = `${userId}/avatar-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) return toast.error("Upload failed");

    const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = publicUrl?.publicUrl ?? null;

    const { error: updateError } = await (supabase as any)
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", userId);
    if (updateError) return toast.error("Could not save avatar");

    setAvatarUrl(url);
    toast.success("Avatar updated");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    window.location.href = "/";
  };

  if (!userId && !loading) {
    // Not logged in
    window.location.href = "/auth";
    return null;
  }

  return (
    <main className="min-h-screen bg-background pt-20">
      <section className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

        <article className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="Profile avatar" />
              ) : (
                <AvatarFallback>U</AvatarFallback>
              )}
            </Avatar>
            <div>
              <label className="block text-sm text-muted-foreground mb-2" htmlFor="avatar">Avatar</label>
              <Input id="avatar" type="file" accept="image/*" onChange={onFileChange} />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm text-muted-foreground mb-2" htmlFor="username">Username</label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" />
            <div className="mt-4 flex gap-3">
              <Button onClick={saveProfile} disabled={loading}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={signOut}>Log out</Button>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
};

export default Profile;
