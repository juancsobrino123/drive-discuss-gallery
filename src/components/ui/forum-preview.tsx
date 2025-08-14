import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Heart, Pin, TrendingUp, Users, MessageCircle } from "lucide-react";

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  pinned: boolean;
  category_id?: string;
  forum_categories?: {
    name: string;
    color: string;
    icon: string;
  } | null;
}

interface ForumStats {
  totalThreads: number;
  activeMembers: number;
  todayPosts: number;
}

const ForumPreview = () => {
  const [latestThreads, setLatestThreads] = useState<ForumThread[]>([]);
  const [stats, setStats] = useState<ForumStats>({ totalThreads: 0, activeMembers: 0, todayPosts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestThreads();
    fetchStats();
  }, []);

  const fetchLatestThreads = async () => {
    const { data, error } = await supabase
      .from("forum_threads")
      .select(`
        *,
        forum_categories (
          name,
          color,
          icon
        )
      `)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("Error fetching threads:", error);
      return;
    }

    setLatestThreads(data || []);
  };

  const fetchStats = async () => {
    try {
      // Get total threads
      const { count: threadsCount } = await supabase
        .from("forum_threads")
        .select("*", { count: "exact", head: true });

      // Get active members (users who have posted in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: activeUsers } = await supabase
        .from("forum_threads")
        .select("author_id")
        .gte("created_at", thirtyDaysAgo.toISOString());

      const uniqueActiveMembers = new Set(activeUsers?.map(u => u.author_id) || []).size;

      // Get today's posts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayCount } = await supabase
        .from("forum_threads")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      setStats({
        totalThreads: threadsCount || 0,
        activeMembers: uniqueActiveMembers,
        todayPosts: todayCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Hace menos de 1 hora";
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    if (diffInHours < 48) return "Hace 1 día";
    return `Hace ${Math.floor(diffInHours / 24)} días`;
  };

  const truncateContent = (content: string, maxLength = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Últimas Discusiones
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Únete a nuestra comunidad de entusiastas automotrices y participa en las conversaciones más interesantes
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm border rounded-full px-6 py-3">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">{stats.totalThreads}</span>
              <span className="text-muted-foreground">Discusiones</span>
            </div>
            <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm border rounded-full px-6 py-3">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">{stats.activeMembers}</span>
              <span className="text-muted-foreground">Miembros activos</span>
            </div>
            <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm border rounded-full px-6 py-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">{stats.todayPosts}</span>
              <span className="text-muted-foreground">Posts hoy</span>
            </div>
          </div>
        </div>

        {/* Latest Threads */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {latestThreads.map((thread) => (
            <Card 
              key={thread.id} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-background/80 backdrop-blur-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {thread.pinned && (
                      <div className="flex items-center gap-1 mb-2">
                        <Pin className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-primary">Fijado</span>
                      </div>
                    )}
                    
                    {thread.forum_categories && (
                      <Badge 
                        variant="outline" 
                        className="mb-3 border-0"
                        style={{ 
                          backgroundColor: `${thread.forum_categories.color}20`,
                          color: thread.forum_categories.color 
                        }}
                      >
                        {thread.forum_categories.name}
                      </Badge>
                    )}
                    
                    <Link to={`/forum/${thread.id}`}>
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                        {thread.title}
                      </h3>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                  {truncateContent(thread.content)}
                </p>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {formatTimeAgo(thread.created_at)}
                  </span>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">
                    Por Anónimo
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {latestThreads.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No hay discusiones aún</h3>
            <p className="text-muted-foreground mb-6">¡Sé el primero en iniciar una conversación!</p>
            <Button asChild>
              <Link to="/forum">Crear Discusión</Link>
            </Button>
          </div>
        )}

        {/* Call to Action */}
        {latestThreads.length > 0 && (
          <div className="text-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Link to="/forum">
                <MessageSquare className="h-5 w-5 mr-2" />
                Ver Todas las Discusiones
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ForumPreview;