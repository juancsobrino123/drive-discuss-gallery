import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, MessageSquare, Pin, PinOff, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ForumThread {
  id: string;
  title: string;
  content: string;
  created_at: string;
  pinned: boolean;
  author: {
    username: string;
    avatar_url: string | null;
  };
  category: {
    name: string;
    color: string;
  } | null;
  replies_count: number;
}

interface ForumReply {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  thread: {
    title: string;
  };
  author: {
    username: string;
    avatar_url: string | null;
  };
}

interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  threads_count: number;
}

export const ForumManagementTab = () => {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadForumData();
  }, []);

  const loadForumData = async () => {
    try {
      // Load threads with author and category info
      const { data: threadsData, error: threadsError } = await supabase
        .from("forum_threads")
        .select(`
          id,
          title,
          content,
          created_at,
          pinned,
          author_id,
          category_id
        `)
        .order("created_at", { ascending: false });

      // Get authors separately
      const { data: authorsData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url");

      // Get categories separately  
      const { data: categoriesData } = await supabase
        .from("forum_categories")
        .select("id, name, color");

      if (threadsError) throw threadsError;

      // Transform threads data
      const formattedThreads = threadsData?.map(thread => {
        const author = authorsData?.find(a => a.id === thread.author_id);
        const category = categoriesData?.find(c => c.id === thread.category_id);
        
        return {
          id: thread.id,
          title: thread.title,
          content: thread.content,
          created_at: thread.created_at,
          pinned: thread.pinned,
          author: {
            username: author?.username || "Usuario",
            avatar_url: author?.avatar_url || null
          },
          category: category ? {
            name: category.name,
            color: category.color
          } : null,
          replies_count: 0 // We'll calculate this separately if needed
        };
      }) || [];

      // Load replies with author info
      const { data: repliesData, error: repliesError } = await supabase
        .from("forum_replies")
        .select(`
          id,
          content,
          created_at,
          likes_count,
          thread_id,
          author_id
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      // Get threads for replies
      const { data: threadsForRepliesData } = await supabase
        .from("forum_threads")
        .select("id, title");

      if (repliesError) throw repliesError;

      const formattedReplies = repliesData?.map(reply => {
        const author = authorsData?.find(a => a.id === reply.author_id);
        const thread = threadsForRepliesData?.find(t => t.id === reply.thread_id);
        
        return {
          id: reply.id,
          content: reply.content,
          created_at: reply.created_at,
          likes_count: reply.likes_count,
          thread: {
            title: thread?.title || "Hilo eliminado"
          },
          author: {
            username: author?.username || "Usuario",
            avatar_url: author?.avatar_url || null
          }
        };
      }) || [];

      // Load all categories
      const { data: allCategoriesData, error: categoriesError } = await supabase
        .from("forum_categories")
        .select("*")
        .order("name");

      if (categoriesError) throw categoriesError;

      const formattedCategories = allCategoriesData?.map(category => ({
        ...category,
        threads_count: 0 // We'll calculate this if needed
      })) || [];

      setThreads(formattedThreads);
      setReplies(formattedReplies);
      setCategories(formattedCategories);
    } catch (error) {
      console.error("Error loading forum data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del foro",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const deleteThread = async (threadId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este hilo? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("forum_threads")
        .delete()
        .eq("id", threadId);

      if (error) throw error;

      toast({
        title: "Hilo eliminado",
        description: "El hilo se eliminó correctamente",
      });

      loadForumData();
    } catch (error) {
      console.error("Error deleting thread:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el hilo",
        variant: "destructive",
      });
    }
  };

  const deleteReply = async (replyId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta respuesta?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("forum_replies")
        .delete()
        .eq("id", replyId);

      if (error) throw error;

      toast({
        title: "Respuesta eliminada",
        description: "La respuesta se eliminó correctamente",
      });

      loadForumData();
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la respuesta",
        variant: "destructive",
      });
    }
  };

  const togglePin = async (threadId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("forum_threads")
        .update({ pinned: !currentPinned })
        .eq("id", threadId);

      if (error) throw error;

      toast({
        title: currentPinned ? "Hilo despinneado" : "Hilo pinneado",
        description: `El hilo se ${currentPinned ? 'despinneó' : 'pinneó'} correctamente`,
      });

      loadForumData();
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del pin",
        variant: "destructive",
      });
    }
  };

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.author.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReplies = replies.filter(reply =>
    reply.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reply.author.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reply.thread.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Cargando datos del foro...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Buscar en el foro..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      <Tabs defaultValue="threads" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="threads">Hilos ({filteredThreads.length})</TabsTrigger>
          <TabsTrigger value="replies">Respuestas ({filteredReplies.length})</TabsTrigger>
          <TabsTrigger value="categories">Categorías ({categories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="threads">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Hilos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hilo</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredThreads.map((thread) => (
                      <TableRow key={thread.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {thread.pinned && <Pin className="h-4 w-4 text-yellow-500" />}
                              {thread.title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {thread.content.substring(0, 100)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={thread.author.avatar_url || undefined} />
                              <AvatarFallback>
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{thread.author.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {thread.category ? (
                            <Badge 
                              style={{ backgroundColor: thread.category.color }}
                              className="text-white"
                            >
                              {thread.category.name}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Sin categoría</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(thread.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={thread.pinned ? "default" : "secondary"}>
                            {thread.pinned ? "Pinneado" : "Normal"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePin(thread.id, thread.pinned)}
                            >
                              {thread.pinned ? (
                                <PinOff className="h-4 w-4" />
                              ) : (
                                <Pin className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteThread(thread.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replies">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Respuestas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Respuesta</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Hilo</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReplies.map((reply) => (
                      <TableRow key={reply.id}>
                        <TableCell>
                          <div className="text-sm">
                            {reply.content.substring(0, 150)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={reply.author.avatar_url || undefined} />
                              <AvatarFallback>
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{reply.author.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {reply.thread.title.substring(0, 50)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {reply.likes_count} likes
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(reply.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteReply(reply.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categorías del Foro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Creado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {category.description || "Sin descripción"}
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {category.color}
                          </code>
                        </TableCell>
                        <TableCell>
                          {new Date(category.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};