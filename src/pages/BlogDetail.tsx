import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageCircle, User as UserIcon, Calendar, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

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

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles?: {
    username: string | null;
  } | null;
}

const BlogDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    document.title = "Post Details — AUTODEBATE";
  }, []);

  const fetchPost = async () => {
    if (!postId) return;
    
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error) {
      console.error("Error fetching post:", error);
      toast({
        title: "Error",
        description: "Failed to load blog post",
        variant: "destructive",
      });
      return;
    }

    setPost(data);
    document.title = `${data.title} — AUTODEBATE`;
  };

  const fetchComments = async () => {
    if (!postId) return;
    
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("blog_post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    setComments(data || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPost(), fetchComments()]);
      setLoading(false);
    };

    loadData();
  }, [postId]);

  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setCommentLoading(true);
    const { error } = await supabase
      .from("comments")
      .insert({
        blog_post_id: postId,
        content: newComment.trim(),
        author_id: user.id,
      });

    if (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      await fetchComments();
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    }
    setCommentLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-10">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/4"></div>
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/blog")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Post not found</h1>
              <p className="text-muted-foreground mt-2">
                The blog post you're looking for doesn't exist.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* Hero Section with Featured Image */}
        {post?.featured_image && (
          <div className="relative h-96 md:h-[500px] overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="container mx-auto max-w-4xl">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/blog")}
                  className="mb-6 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Blog
                </Button>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                  {post.title}
                </h1>
                <div className="flex items-center gap-6 text-white/80">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    <span className="font-medium">AUTODEBATE Team</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <time>
                      {new Date(post.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          {/* Back Button for posts without featured image */}
          {!post?.featured_image && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/blog")}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          )}

          <article className="max-w-4xl mx-auto">
            {/* Header for posts without featured image */}
            {!post?.featured_image && (
              <header className="mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {post?.title}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>AUTODEBATE Team</span>
                  </div>
                  <span>•</span>
                  <time>
                    {post && new Date(post.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
              </header>
            )}

            <div className="prose prose-lg max-w-none mb-12 text-foreground">
              <div className="whitespace-pre-wrap leading-relaxed text-lg">
                {post?.content}
              </div>
            </div>

            {/* Comments Section */}
            <section className="border-t border-border pt-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                Comments ({comments.length})
              </h2>

              {/* Add Comment Form */}
              {user ? (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-lg">Add a Comment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={4}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={commentLoading || !newComment.trim()}
                    >
                      {commentLoading ? "Posting..." : "Post Comment"}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="mb-8">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      <a href="/auth" className="text-primary hover:underline">
                        Log in
                      </a>{" "}
                      to join the discussion
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-foreground">
                                Anonymous
                              </span>
                              <span className="text-muted-foreground text-sm">
                                {new Date(comment.created_at).toLocaleDateString("es-ES")}
                              </span>
                            </div>
                            <p className="text-foreground leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogDetail;