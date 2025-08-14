import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Plus, 
  User as UserIcon, 
  Pin, 
  Clock, 
  ChevronRight,
  Search,
  Filter,
  TrendingUp,
  Users,
  MessageCircle,
  Zap,
  Car,
  Trophy,
  Wrench,
  Star,
  Settings
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  pinned: boolean;
  category_id?: string;
  username?: string | null;
  reply_count?: number;
  forum_categories?: Omit<ForumCategory, 'description'> | null;
}

const Forum = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [newThreadCategory, setNewThreadCategory] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "");

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

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("forum_categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }

    setCategories(data || []);
  };

  const fetchThreads = async () => {
    let query = supabase
      .from("forum_threads")
      .select(`
        *,
        forum_categories (
          id,
          name,
          color,
          icon
        )
      `)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    // Apply category filter
    if (selectedCategory && selectedCategory !== "all") {
      query = query.eq("category_id", selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery.trim()}%,content.ilike.%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;

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

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      MessageCircle,
      Zap,
      Car,
      Trophy,
      Wrench,
      Star,
      Settings,
      MessageSquare
    };
    return icons[iconName] || MessageCircle;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCategories(), fetchThreads()]);
      setLoading(false);
    };

    loadData();
  }, [selectedCategory, searchQuery]);

  // Update URL when category changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== "all") {
      setSearchParams({ category: selectedCategory });
    } else {
      setSearchParams({});
    }
  }, [selectedCategory, setSearchParams]);

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
        category_id: newThreadCategory || null,
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
      setNewThreadCategory("");
      setShowModal(false);
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
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                AUTODEBATE Forum
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Connect with car enthusiasts, share experiences, and join the conversation about automotive culture
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">{threads.length}</div>
                  <div className="text-sm text-muted-foreground">Threads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">
                    {threads.reduce((sum, thread) => sum + (thread.reply_count || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Replies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">Global</div>
                  <div className="text-sm text-muted-foreground">Community</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10">
          {/* Forum Actions */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-foreground">Latest Discussions</h2>
                {threads.filter(t => t.pinned).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    <Pin className="w-3 h-3 mr-1" />
                    {threads.filter(t => t.pinned).length} pinned
                  </Badge>
                )}
              </div>
              
              {user ? (
                <Dialog open={showModal} onOpenChange={setShowModal}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      className="shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Thread
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create New Thread</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="thread-category">Category (Optional)</Label>
                        <Select value={newThreadCategory} onValueChange={setNewThreadCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => {
                              const IconComponent = getIconComponent(category.icon);
                              return (
                                <SelectItem key={category.id} value={category.id}>
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" style={{ color: category.color }} />
                                    {category.name}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
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
                          onClick={() => setShowModal(false)}
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
              ) : (
                <Button asChild variant="outline" size="lg">
                  <a href="/auth">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Join Discussion
                  </a>
                </Button>
              )}
            </div>

            {!user && (
              <Card className="mb-6 border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Join the Community</p>
                      <p className="text-sm text-muted-foreground">
                        <a href="/auth" className="text-primary hover:underline font-medium">
                          Sign in or create an account
                        </a>{" "}
                        to participate in discussions and connect with fellow car enthusiasts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Search and Filters */}
            <div className="mb-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search discussions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="sm:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => {
                      const IconComponent = getIconComponent(category.icon);
                      return (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" style={{ color: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={selectedCategory === "" || selectedCategory === "all" ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setSelectedCategory("all")}
                >
                  All
                </Badge>
                {categories.slice(0, 6).map((category) => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <Badge
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => setSelectedCategory(category.id)}
                      style={{
                        backgroundColor: selectedCategory === category.id ? category.color : undefined,
                        borderColor: category.color
                      }}
                    >
                      <IconComponent className="h-3 w-3 mr-1" />
                      {category.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Threads List */}
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                          <div className="h-4 bg-muted rounded w-full mb-2"></div>
                          <div className="h-4 bg-muted rounded w-2/3 mb-3"></div>
                          <div className="flex gap-4">
                            <div className="h-3 bg-muted rounded w-20"></div>
                            <div className="h-3 bg-muted rounded w-16"></div>
                            <div className="h-3 bg-muted rounded w-24"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Discussions Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to start a conversation in our community!
                  </p>
                  {user && (
                    <Button onClick={() => setShowModal(true)} size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Create First Thread
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {threads.map((thread) => (
                  <Card
                    key={thread.id}
                    className="cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-200 group"
                    onClick={() => navigate(`/forum/${thread.id}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-primary" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {thread.forum_categories && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs"
                                    style={{ 
                                      backgroundColor: `${thread.forum_categories.color}20`,
                                      borderColor: thread.forum_categories.color,
                                      color: thread.forum_categories.color 
                                    }}
                                  >
                                    {(() => {
                                      const IconComponent = getIconComponent(thread.forum_categories.icon);
                                      return <IconComponent className="h-3 w-3 mr-1" />;
                                    })()}
                                    {thread.forum_categories.name}
                                  </Badge>
                                )}
                                {thread.pinned && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Pin className="h-3 w-3 mr-1" />
                                    Pinned
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                <span className="line-clamp-2">{thread.title}</span>
                              </h3>
                              
                              <p className="text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                                {thread.content.length > 200
                                  ? `${thread.content.substring(0, 200)}...`
                                  : thread.content}
                              </p>
                              
                              {/* Thread Meta */}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <UserIcon className="h-4 w-4" />
                                  <span className="font-medium">{thread.username || 'Anonymous'}</span>
                                </div>
                                <span className="hidden sm:inline">•</span>
                                <time className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(thread.created_at).toLocaleDateString("es-ES", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                  })}
                                </time>
                                <span className="hidden sm:inline">•</span>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{thread.reply_count || 0} replies</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Arrow */}
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                          </div>
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
    </div>
  );
};

export default Forum;