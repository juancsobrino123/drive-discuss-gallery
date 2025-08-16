import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/ui/navbar";
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
import { useAuth } from "@/hooks/use-auth";

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
  const { user, canCreateEvent, isAdmin } = useAuth();
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
  
  // New category creation states
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("MessageSquare");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");

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

  }, []);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from("forum_categories")
        .insert({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null,
          icon: newCategoryIcon,
          color: newCategoryColor,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh categories and select the new one
      await fetchCategories();
      setNewThreadCategory(data.id);
      setShowNewCategoryForm(false);
      setNewCategoryName("");
      setNewCategoryDescription("");
      setNewCategoryIcon("MessageSquare");
      setNewCategoryColor("#3b82f6");
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    } catch (error: any) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    }
  };

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

    // Get reply counts and user info for each thread
    const threadsWithCounts = await Promise.all(
      (data || []).map(async (thread) => {
        const { count } = await supabase
          .from("forum_replies")
          .select("*", { count: "exact", head: true })
          .eq("thread_id", thread.id);
        
        // Get user display info if authenticated
        let username = "Usuario Anónimo";
        if (user) {
          const { data: userInfo } = await supabase
            .rpc("get_user_display_info", { target_user_id: thread.author_id });
          
          if (userInfo && userInfo.length > 0) {
            username = userInfo[0].username || "Usuario Anónimo";
          }
        }
        
        return {
          ...thread,
          reply_count: count || 0,
          username,
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
      setShowNewCategoryForm(false);
      setNewCategoryName("");
      setNewCategoryDescription("");
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
    <main className="pt-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 font-brand">
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
                      <Select value={newThreadCategory} onValueChange={(value) => {
                        if (value === "create_new") {
                          setShowNewCategoryForm(true);
                          setNewThreadCategory("");
                        } else {
                          setNewThreadCategory(value);
                        }
                      }}>
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
                          {(canCreateEvent || isAdmin) && (
                            <SelectItem value="create_new">
                              <div className="flex items-center gap-2 text-primary">
                                <Plus className="h-4 w-4" />
                                Create New Category
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {showNewCategoryForm && (canCreateEvent || isAdmin) && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Create New Category</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowNewCategoryForm(false);
                              setNewCategoryName("");
                              setNewCategoryDescription("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                        <div>
                          <Label htmlFor="category-name">Category Name</Label>
                          <Input
                            id="category-name"
                            placeholder="Enter category name..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="category-description">Description (Optional)</Label>
                          <Input
                            id="category-description"
                            placeholder="Brief description..."
                            value={newCategoryDescription}
                            onChange={(e) => setNewCategoryDescription(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="category-icon">Icon</Label>
                            <Select value={newCategoryIcon} onValueChange={setNewCategoryIcon}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MessageSquare">💬 Chat</SelectItem>
                                <SelectItem value="Zap">⚡ Electric</SelectItem>
                                <SelectItem value="Car">🚗 Car</SelectItem>
                                <SelectItem value="Trophy">🏆 Racing</SelectItem>
                                <SelectItem value="Wrench">🔧 Tools</SelectItem>
                                <SelectItem value="Star">⭐ Premium</SelectItem>
                                <SelectItem value="Settings">⚙️ Tech</SelectItem>
                                <SelectItem value="Users">👥 Community</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="category-color">Color</Label>
                            <Input
                              id="category-color"
                              type="color"
                              value={newCategoryColor}
                              onChange={(e) => setNewCategoryColor(e.target.value)}
                              className="h-10"
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={handleCreateCategory}
                          disabled={!newCategoryName.trim()}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Category
                        </Button>
                      </div>
                    )}
                    
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
                        placeholder="What would you like to discuss?"
                        value={newThreadContent}
                        onChange={(e) => setNewThreadContent(e.target.value)}
                        rows={6}
                      />
                    </div>
                    <Button 
                      onClick={handleCreateThread}
                      disabled={createLoading || !newThreadTitle.trim() || !newThreadContent.trim()}
                      className="w-full"
                    >
                      {createLoading ? "Creating..." : "Create Thread"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button onClick={() => navigate("/auth")} size="lg">
                Join Discussion
              </Button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
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
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Categories</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {categories.map((category) => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex items-center gap-2 justify-start h-auto p-3"
                    >
                      <IconComponent className="h-4 w-4" style={{ color: selectedCategory === category.id ? 'white' : category.color }} />
                      <span className="truncate">{category.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Threads List */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : threads.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No threads found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "Be the first to start a conversation!"}
              </p>
              {user && (
                <Button onClick={() => setShowModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Thread
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {threads.map((thread) => {
                const IconComponent = getIconComponent(thread.forum_categories?.icon || 'MessageSquare');
                return (
                  <Card key={thread.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardContent className="p-0">
                      <div 
                        className="space-y-3"
                        onClick={() => {
                          if (user) {
                            navigate(`/forum/${thread.id}`);
                          } else {
                            toast({
                              title: "Authentication required",
                              description: "Please log in to view thread details",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {thread.pinned && (
                                <Pin className="w-4 h-4 text-primary" />
                              )}
                              {thread.forum_categories && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{ borderColor: thread.forum_categories.color }}
                                >
                                  <IconComponent 
                                    className="w-3 h-3 mr-1" 
                                    style={{ color: thread.forum_categories.color }} 
                                  />
                                  {thread.forum_categories.name}
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                              {thread.title}
                            </h3>
                            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                              {thread.content}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors ml-4 flex-shrink-0" />
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <UserIcon className="w-4 h-4" />
                              <span>{thread.username || "Usuario Anónimo"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{thread.reply_count || 0} replies</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Forum;