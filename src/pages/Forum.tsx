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
import { MessageSquare, Plus, User as UserIcon, Pin } from "lucide-react";
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
  reply_count?: number;
}

const Forum = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    document.title = "Forum — AUTODEBATE";
    
    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    setMeta(
      "description",
      "Únete a las discusiones del foro de AUTODEBATE. Comparte opiniones y participa en debates sobre el mundo automotriz."
    );

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

  const fetchThreads = async () => {
    const { data, error } = await supabase
      .from("forum_threads")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching threads:", error);
      toast({
        title: "Error",
        description: "Failed to load forum threads",
        variant: "destructive",
      });
      return;
    }

    // Get reply counts for each thread
    const threadsWithCounts = await Promise.all(
      (data || []).map(async (thread) => {
        const { count } = await supabase
          .from("forum_replies")
          .select("*", { count: "exact", head: true })
          .eq("thread_id", thread.id);
        
        return {
          ...thread,
          reply_count: count || 0,
        };
      })
    );

    setThreads(threadsWithCounts);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchThreads();
      setLoading(false);
    };

    loadData();
  }, []);

  const handleCreateThread = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a thread",
        variant: "destructive",
      });
      return;
    }

    if (!newThreadTitle.trim() || !newThreadContent.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in both title and content",
        variant: "destructive",
      });
      return;
    }

    setCreateLoading(true);
    const { data, error } = await supabase
      .from("forum_threads")
      .insert({
        title: newThreadTitle.trim(),
        content: newThreadContent.trim(),
        author_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating thread:", error);
      toast({
        title: "Error",
        description: "Failed to create thread",
        variant: "destructive",
      });
    } else {
      setNewThreadTitle("");
      setNewThreadContent("");
      setCreateDialogOpen(false);
      await fetchThreads();
      toast({
        title: "Success",
        description: "Thread created successfully",
      });
      navigate(`/forum/${data.id}`);
    }
    setCreateLoading(false);
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
                  Forum
                </h1>
                <p className="text-muted-foreground mt-3 max-w-2xl">
                  Join the discussion! Share your thoughts and engage with the AUTODEBATE community.
                </p>
              </div>
              
              {user && (
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New Thread
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create New Thread</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="thread-title">Title</Label>
                        <Input
                          id="thread-title"
                          placeholder="Enter thread title..."
                          value={newThreadTitle}
                          onChange={(e) => setNewThreadTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="thread-content">Content</Label>
                        <Textarea
                          id="thread-content"
                          placeholder="Share your thoughts..."
                          value={newThreadContent}
                          onChange={(e) => setNewThreadContent(e.target.value)}
                          rows={6}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateThread}
                          disabled={createLoading || !newThreadTitle.trim() || !newThreadContent.trim()}
                        >
                          {createLoading ? "Creating..." : "Create Thread"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </header>

          {!user && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Join the community to participate in discussions
                  </p>
                  <Button asChild>
                    <a href="/auth">Log In / Sign Up</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No threads yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to start a discussion!
                    </p>
                    {user && (
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        Create First Thread
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              threads.map((thread) => (
                <Card
                  key={thread.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/forum/${thread.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {thread.pinned && (
                        <Pin className="h-4 w-4 text-primary" />
                      )}
                      <span className="flex-1">{thread.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {thread.content}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          <span>Anonymous</span>
                        </div>
                        <span>•</span>
                        <time>
                          {new Date(thread.created_at).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{thread.reply_count} replies</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default Forum;