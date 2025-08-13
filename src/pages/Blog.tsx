import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Plus, User as UserIcon, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author_id: string;
  created_at: string;
  published: boolean;
  profiles?: {
    username: string | null;
  } | null;
}

const setMeta = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const Blog = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostExcerpt, setNewPostExcerpt] = useState("");
  const [newPostPublished, setNewPostPublished] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    document.title = "Blog de AUTODEBATE — Noticias y artículos";
    setMeta(
      "description",
      "Lee artículos y noticias del mundo motor en AUTODEBATE. Opinión, reviews y cultura automotriz."
    );
    const link: HTMLLinkElement =
      (document.querySelector('link[rel="canonical"]') as HTMLLinkElement) ||
      Object.assign(document.createElement("link"), { rel: "canonical" });
    link.href = window.location.origin + "/blog";
    if (!link.parentElement) document.head.appendChild(link);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    setUserRole(data?.role || null);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive",
      });
      return;
    }

    setPosts(data || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchPosts();
      setLoading(false);
    };

    loadData();
  }, []);

  const handleCreatePost = async () => {
    if (!user || userRole !== "admin") {
      toast({
        title: "Access denied",
        description: "Only admins can create blog posts",
        variant: "destructive",
      });
      return;
    }

    if (!newPostTitle.trim() || !newPostContent.trim() || !newPostExcerpt.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setCreateLoading(true);
    const { error } = await supabase
      .from("blog_posts")
      .insert({
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        excerpt: newPostExcerpt.trim(),
        published: newPostPublished,
        author_id: user.id,
      });

    if (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create blog post",
        variant: "destructive",
      });
    } else {
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostExcerpt("");
      setNewPostPublished(false);
      setCreateDialogOpen(false);
      await fetchPosts();
      toast({
        title: "Success",
        description: "Blog post created successfully",
      });
    }
    setCreateLoading(false);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "AUTODEBATE Blog",
    url: typeof window !== "undefined" ? window.location.href : "",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-10">
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  Blog de AUTODEBATE
                </h1>
                <p className="text-muted-foreground mt-3 max-w-2xl">
                  Artículos, opiniones y tendencias del mundo automotriz.
                </p>
              </div>
              
              {userRole === "admin" && (
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create New Blog Post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="post-title">Title</Label>
                        <Input
                          id="post-title"
                          placeholder="Enter post title..."
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="post-excerpt">Excerpt</Label>
                        <Textarea
                          id="post-excerpt"
                          placeholder="Brief description of the post..."
                          value={newPostExcerpt}
                          onChange={(e) => setNewPostExcerpt(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="post-content">Content</Label>
                        <Textarea
                          id="post-content"
                          placeholder="Write your post content..."
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          rows={8}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="post-published"
                          checked={newPostPublished}
                          onCheckedChange={setNewPostPublished}
                        />
                        <Label htmlFor="post-published">Publish immediately</Label>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreatePost}
                          disabled={createLoading || !newPostTitle.trim() || !newPostContent.trim() || !newPostExcerpt.trim()}
                        >
                          {createLoading ? "Creating..." : "Create Post"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </header>

          <div className="grid gap-6 md:gap-8">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No blog posts yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Stay tuned for exciting automotive content!
                    </p>
                    {userRole === "admin" && (
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        Create First Post
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Card
                    key={post.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/blog/${post.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          <span>AUTODEBATE Team</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <time>
                            {new Date(post.created_at).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </time>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
};

export default Blog;
