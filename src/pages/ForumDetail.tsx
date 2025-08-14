import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MessageSquare, User as UserIcon, Pin, Heart, Reply, Car, Zap, Trophy, Wrench, Star, Settings, Users, Tag } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  pinned: boolean;
  category_id?: string | null;
  profiles?: {
    username: string | null;
  } | null;
  forum_categories?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    description?: string;
  } | null;
}

interface ForumReply {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  parent_reply_id?: string | null;
  likes_count: number;
  profiles?: {
    username: string | null;
  } | null;
}

interface ReplyLike {
  id: string;
  reply_id: string;
  user_id: string;
}

const ForumDetail = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [newReply, setNewReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyLoading, setReplyLoading] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [parentReplyId, setParentReplyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "likes">("newest");

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
      .select(`
        *,
        forum_categories (
          id,
          name,
          icon,
          color,
          description
        )
      `)
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
    
    let orderBy = "created_at";
    let ascending = sortBy === "newest" ? false : true;
    
    if (sortBy === "likes") {
      orderBy = "likes_count";
      ascending = false;
    }
    
    const { data, error } = await supabase
      .from("forum_replies")
      .select("*")
      .eq("thread_id", threadId)
      .order(orderBy, { ascending });

    if (error) {
      console.error("Error fetching replies:", error);
      return;
    }

    setReplies(data || []);
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("forum_reply_likes")
      .select("reply_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching user likes:", error);
      return;
    }

    setUserLikes(new Set(data.map(like => like.reply_id)));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchThread(), fetchReplies(), fetchUserLikes()]);
      setLoading(false);
    };

    loadData();
  }, [threadId, sortBy]);

  useEffect(() => {
    if (user) {
      fetchUserLikes();
    }
  }, [user]);

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
        parent_reply_id: parentReplyId,
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
      setActiveReplyId(null);
      setParentReplyId(null);
      await fetchReplies();
      toast({
        title: "Success",
        description: "Reply added successfully",
      });
    }
    setReplyLoading(false);
  };

  const handleReplyClick = (replyId: string, parentId?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to reply",
        variant: "destructive",
      });
      return;
    }
    setActiveReplyId(replyId === activeReplyId ? null : replyId);
    setParentReplyId(parentId || null);
    setNewReply("");
  };

  const handleLike = async (replyId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like",
        variant: "destructive",
      });
      return;
    }

    const isLiked = userLikes.has(replyId);
    
    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from("forum_reply_likes")
        .delete()
        .eq("reply_id", replyId)
        .eq("user_id", user.id);

      if (!error) {
        setUserLikes(prev => {
          const newLikes = new Set(prev);
          newLikes.delete(replyId);
          return newLikes;
        });
        await fetchReplies();
      }
    } else {
      // Like
      const { error } = await supabase
        .from("forum_reply_likes")
        .insert({
          reply_id: replyId,
          user_id: user.id,
        });

      if (!error) {
        setUserLikes(prev => new Set([...prev, replyId]));
        await fetchReplies();
      }
    }
  };

  const getParentReply = (parentId: string | null) => {
    if (!parentId) return null;
    return replies.find(r => r.id === parentId);
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      MessageSquare,
      Car,
      Zap,
      Trophy,
      Wrench,
      Star,
      Settings,
      Users,
    };
    return icons[iconName] || MessageSquare;
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
        {/* Breadcrumb Navigation */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/forum")}
                className="p-0 h-auto font-normal hover:text-primary"
              >
                Forum
              </Button>
              <span>/</span>
              <span className="text-foreground font-medium truncate">{thread.title}</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/forum")}
              className="mb-6 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forum
            </Button>

            {/* Thread Header */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 mb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 flex items-start gap-3">
                  {thread.pinned && (
                    <Pin className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                  )}
                  <span className="leading-tight">{thread.title}</span>
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  {thread.forum_categories && (
                    <div className="flex items-center gap-2 bg-background/50 rounded-full px-3 py-1">
                      {(() => {
                        const IconComponent = getIconComponent(thread.forum_categories.icon);
                        return <IconComponent className="h-4 w-4" style={{ color: thread.forum_categories.color }} />;
                      })()}
                      <span className="font-medium" style={{ color: thread.forum_categories.color }}>
                        {thread.forum_categories.name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-background/50 rounded-full px-3 py-1">
                    <UserIcon className="h-4 w-4" />
                    <span className="font-medium">Anonymous</span>
                  </div>
                  <div className="flex items-center gap-2 bg-background/50 rounded-full px-3 py-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{replies.length} replies</span>
                  </div>
                  <time className="flex items-center gap-2 bg-background/50 rounded-full px-3 py-1">
                    {new Date(thread.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Original Post */}
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-semibold text-foreground">Anonymous</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">OP</span>
                        </div>
                        <div className="prose prose-neutral dark:prose-invert max-w-none mb-4">
                          <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                            {thread.content}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pt-3 border-t border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReplyClick("thread")}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Reply
                          </Button>
                        </div>
                        {activeReplyId === "thread" && (
                          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                            <Textarea
                              placeholder="Write your reply..."
                              value={newReply}
                              onChange={(e) => setNewReply(e.target.value)}
                              rows={3}
                              className="resize-none mb-3"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setActiveReplyId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleAddReply}
                                disabled={replyLoading || !newReply.trim()}
                                size="sm"
                              >
                                {replyLoading ? "Posting..." : "Post Reply"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Replies Header with Sort */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    Replies ({replies.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                    <Select value={sortBy} onValueChange={(value: "newest" | "oldest" | "likes") => setSortBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="likes">Most Liked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>


                {/* Replies List */}
                <div className="space-y-4">
                  {replies.length === 0 ? (
                    <Card className="text-center py-12">
                      <CardContent>
                        <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Replies Yet</h3>
                        <p className="text-muted-foreground">
                          Be the first to respond to this thread!
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    replies.map((reply, index) => (
                      <Card key={reply.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="font-medium text-foreground">Anonymous</span>
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                                  #{index + 1}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(reply.created_at).toLocaleDateString("es-ES", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </span>
                              </div>
                              {reply.parent_reply_id && (
                                <div className="mb-3 p-3 bg-muted/20 border-l-2 border-primary/30 rounded-r-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Reply className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Replying to:</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground italic truncate">
                                    {getParentReply(reply.parent_reply_id)?.content || "Original thread"}
                                  </p>
                                </div>
                              )}
                              <div className="prose prose-neutral dark:prose-invert max-w-none mb-4">
                                <p className="text-foreground leading-relaxed whitespace-pre-wrap m-0">
                                  {reply.content}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 pt-3 border-t border-border">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleLike(reply.id)}
                                  className={`text-muted-foreground hover:text-primary ${
                                    userLikes.has(reply.id) ? "text-primary" : ""
                                  }`}
                                >
                                  <Heart 
                                    className={`h-4 w-4 mr-1 ${
                                      userLikes.has(reply.id) ? "fill-current" : ""
                                    }`} 
                                  />
                                  {reply.likes_count || 0}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReplyClick(reply.id, reply.id)}
                                  className="text-muted-foreground hover:text-primary"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Reply
                                </Button>
                              </div>
                              {activeReplyId === reply.id && (
                                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                                  <Textarea
                                    placeholder="Write your reply..."
                                    value={newReply}
                                    onChange={(e) => setNewReply(e.target.value)}
                                    rows={3}
                                    className="resize-none mb-3"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setActiveReplyId(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleAddReply}
                                      disabled={replyLoading || !newReply.trim()}
                                      size="sm"
                                    >
                                      {replyLoading ? "Posting..." : "Post Reply"}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  {/* Thread Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Thread Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Started</span>
                        <span className="font-medium">
                          {new Date(thread.created_at).toLocaleDateString("es-ES", {
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Replies</span>
                        <span className="font-medium">{replies.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Views</span>
                        <span className="font-medium">—</span>
                      </div>
                      {thread.pinned && (
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <Pin className="h-4 w-4" />
                          <span>Pinned Thread</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => navigate("/forum")}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Forum
                      </Button>
                      {user && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            const replyForm = document.querySelector('textarea');
                            replyForm?.focus();
                            replyForm?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Quick Reply
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForumDetail;