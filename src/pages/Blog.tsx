import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Plus, User as UserIcon, Calendar, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import ShareButton from "@/components/ui/share-button";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author_id: string;
  created_at: string;
  published: boolean;
  featured_image?: string | null;
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
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostExcerpt, setNewPostExcerpt] = useState("");
  const [newPostPublished, setNewPostPublished] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    document.title = t('blog.pageTitle');
    setMeta(
      "description",
      t('blog.pageDescription')
    );
    const link: HTMLLinkElement =
      (document.querySelector('link[rel="canonical"]') as HTMLLinkElement) ||
      Object.assign(document.createElement("link"), { rel: "canonical" });
    link.href = window.location.origin + "/blog";
    if (!link.parentElement) document.head.appendChild(link);
  }, [t]);

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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleCreatePost = async () => {
    if (!user || !isAdmin) {
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
    
    let featuredImageUrl = null;
    if (selectedImage) {
      featuredImageUrl = await uploadImage(selectedImage);
      if (!featuredImageUrl) {
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive",
        });
        setCreateLoading(false);
        return;
      }
    }

    const { error } = await supabase
      .from("blog_posts")
      .insert({
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        excerpt: newPostExcerpt.trim(),
        published: newPostPublished,
        author_id: user.id,
        featured_image: featuredImageUrl,
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
      setSelectedImage(null);
      setImagePreview(null);
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
        <div className="container mx-auto px-4 py-12">
          <header className="text-center mb-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-6 font-brand">
                AUTODEBATE
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
                {t('blog.subheading')}
              </p>
              
              {isAdmin && (
                <div className="flex justify-center">
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      {t('blog.newPost')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t('blog.createPost')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="post-title">{t('blog.title')}</Label>
                        <Input
                          id="post-title"
                          placeholder={t('blog.titlePlaceholder')}
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="post-image">{t('blog.featuredImage')}</Label>
                        <div className="mt-2">
                          {imagePreview ? (
                            <div className="relative">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-48 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={handleRemoveImage}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">
                                    {t('blog.uploadText')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {t('blog.uploadFormats')}
                                  </p>
                                </div>
                              <Input
                                id="post-image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="post-excerpt">{t('blog.excerpt')}</Label>
                        <Textarea
                          id="post-excerpt"
                          placeholder={t('blog.excerptPlaceholder')}
                          value={newPostExcerpt}
                          onChange={(e) => setNewPostExcerpt(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="post-content">{t('blog.content')}</Label>
                        <Textarea
                          id="post-content"
                          placeholder={t('blog.contentPlaceholder')}
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
                        <Label htmlFor="post-published">{t('blog.publishImmediately')}</Label>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCreateDialogOpen(false);
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                        >
                          {t('blog.cancel')}
                        </Button>
                        <Button
                          onClick={handleCreatePost}
                          disabled={createLoading || !newPostTitle.trim() || !newPostContent.trim() || !newPostExcerpt.trim()}
                        >
                          {createLoading ? t('blog.creating') : t('blog.createPostButton')}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
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
                      {t('blog.noPosts')}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t('blog.noPostsDesc')}
                    </p>
                    {isAdmin && (
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        {t('blog.createFirstPost')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Card
                    key={post.id}
                    className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-gradient-to-br from-card/50 to-card hover:from-card to-card/80"
                    onClick={() => navigate(`/blog/${post.id}`)}
                  >
                    {post.featured_image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                    )}
                    <CardHeader className={post.featured_image ? "relative -mt-16 z-10" : ""}>
                      <CardTitle className={`line-clamp-2 transition-colors group-hover:text-primary ${
                        post.featured_image ? "text-white" : ""
                      }`}>
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                            <UserIcon className="h-3 w-3 text-primary" />
                          </div>
                          <span className="font-medium font-brand">AUTODEBATE</span>
                        </div>
                        <div className="flex items-center gap-4">
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
                          <ShareButton
                            url={`/blog/${post.id}`}
                            title={post.title}
                            description={post.excerpt}
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-primary"
                          />
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
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
};

export default Blog;
