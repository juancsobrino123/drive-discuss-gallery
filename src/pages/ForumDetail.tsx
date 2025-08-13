import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, User as UserIcon, Pin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  pinned: boolean;
  profiles?: {
    username: string | null;
  } | null;
}

interface ForumReply {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  profiles?: {
    username: string | null;
  } | null;
}

const ForumDetail = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    document.title = "Thread Details — AUTODEBATE";
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchThread = async () => {
    if (!threadId) return;
    
    const { data, error } = await supabase
      .from("forum_threads")
      .select("*")
      .eq("id", threadId)
      .single();

    if (error) {
      console.error("Error fetching thread:", error);
      toast({
        title: "Error",
        description: "Failed to load thread",
        variant: "destructive",
      });
      return;
    }

    setThread(data);
    document.title = `${data.title} — AUTODEBATE Forum`;
  };

  const fetchReplies = async () => {
    if (!threadId) return;
    
    const { data, error } = await supabase
      .from("forum_replies")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching replies:", error);
      return;
    }

    setReplies(data || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchThread(), fetchReplies()]);
      setLoading(false);
    };

    loadData();
  }, [threadId]);

  const handleAddReply = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to reply",
        variant: "destructive",
      });
      return;
    }

    if (!newReply.trim()) return;

    setReplyLoading(true);
    const { error } = await supabase
      .from("forum_replies")
      .insert({
        thread_id: threadId,
        content: newReply.trim(),
        author_id: user.id,
      });

    if (error) {
      console.error("Error adding reply:", error);
      toast({
        title: "Error",
        description: "Failed to add reply",
        variant: "destructive",
      });
    } else {
      setNewReply("");
      await fetchReplies();
      toast({
        title: "Success",
        description: "Reply added successfully",
      });
    }
    setReplyLoading(false);
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

  if (!thread) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <div className="container mx-auto px-4 py-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/forum")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forum
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Thread not found</h1>
              <p className="text-muted-foreground mt-2">
                The forum thread you're looking for doesn't exist.
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
        <div className="container mx-auto px-4 py-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/forum")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forum
          </Button>

          <article className="max-w-4xl mx-auto">
            <header className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 flex items-center gap-3">
                {thread.pinned && (
                  <Pin className="h-8 w-8 text-primary" />
                )}
                {thread.title}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>Anonymous</span>
                </div>
                <span>•</span>
                <time>
                  {new Date(thread.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
            </header>

            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {thread.content}
                </div>
              </CardContent>
            </Card>

            {/* Replies Section */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Replies ({replies.length})
              </h2>

              {/* Add Reply Form */}
              {user ? (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-lg">Reply to Thread</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      rows={4}
                    />
                    <Button
                      onClick={handleAddReply}
                      disabled={replyLoading || !newReply.trim()}
                    >
                      {replyLoading ? "Posting..." : "Post Reply"}
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

              {/* Replies List */}
              <div className="space-y-4">
                {replies.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No replies yet. Be the first to respond!
                  </p>
                ) : (
                  replies.map((reply) => (
                    <Card key={reply.id}>
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
                                {new Date(reply.created_at).toLocaleDateString("es-ES")}
                              </span>
                            </div>
                            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                              {reply.content}
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

export default ForumDetail;