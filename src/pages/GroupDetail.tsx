import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Send, Plus, Users, Calendar, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface Group {
  id: string;
  name: string;
  description?: string;
  theme: string;
  avatar_url?: string;
  member_count: number;
  is_private: boolean;
  created_by: string;
}

interface GroupMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    username?: string;
    avatar_url?: string;
  };
}

interface GroupPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  author?: {
    username?: string;
    avatar_url?: string;
  };
}

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    username?: string;
    avatar_url?: string;
  };
}

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId && user) {
      loadGroupData();
      setupRealtimeSubscription();
    }
  }, [groupId, user]);

  const loadGroupData = async () => {
    if (!groupId || !user) return;

    try {
      // Load group info
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Check user membership
      const { data: membershipData, error: membershipError } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        throw membershipError;
      }

      setUserRole(membershipData?.role || null);

      // Only proceed if user is a member
      if (membershipData) {
        await Promise.all([
          loadMessages(),
          loadPosts(),
          loadMembers()
        ]);
      }
    } catch (error) {
      console.error("Error loading group data:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del grupo",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const loadMessages = async () => {
    if (!groupId) return;

    try {
      const { data, error } = await supabase
        .from("group_messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) throw error;

      // Get sender profiles separately
      const messagesWithSenders = await Promise.all(
        data.map(async (msg) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", msg.sender_id)
            .single();

          return {
            ...msg,
            sender: profile
          };
        })
      );

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadPosts = async () => {
    if (!groupId) return;

    try {
      const { data, error } = await supabase
        .from("group_posts")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get author profiles separately
      const postsWithAuthors = await Promise.all(
        data.map(async (post) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", post.author_id)
            .single();

          return {
            ...post,
            author: profile
          };
        })
      );

      setPosts(postsWithAuthors);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  const loadMembers = async () => {
    if (!groupId) return;

    try {
      const { data, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .order("joined_at", { ascending: false });

      if (error) throw error;

      // Get member profiles separately
      const membersWithProfiles = await Promise.all(
        data.map(async (member) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", member.user_id)
            .single();

          return {
            ...member,
            profiles: profile
          };
        })
      );

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error loading members:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        () => {
          loadMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_posts',
          filter: `group_id=eq.${groupId}`
        },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !groupId || !user) return;

    try {
      const { error } = await supabase
        .from("group_messages")
        .insert({
          group_id: groupId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    }
  };

  const createPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim() || !groupId || !user) return;

    try {
      const { error } = await supabase
        .from("group_posts")
        .insert({
          group_id: groupId,
          author_id: user.id,
          title: newPost.title.trim(),
          content: newPost.content.trim()
        });

      if (error) throw error;

      setNewPost({ title: "", content: "" });
      setShowCreatePost(false);
      toast({
        title: "Éxito",
        description: "Post creado correctamente",
      });
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el post",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Grupo no encontrado</div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>No eres miembro de este grupo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Group Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={group.avatar_url} />
              <AvatarFallback>
                {group.name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{group.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{group.theme}</Badge>
                <Badge variant="outline">
                  <Users className="mr-1 h-3 w-3" />
                  {group.member_count} miembros
                </Badge>
                {userRole && (
                  <Badge variant="outline">{userRole}</Badge>
                )}
              </div>
              {group.description && (
                <p className="text-muted-foreground mt-2">{group.description}</p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Group Content */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="members">Miembros</TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat">
          <Card className="h-[600px] flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === user?.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="flex items-start gap-2 max-w-[70%]">
                    {message.sender_id !== user?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender?.avatar_url} />
                        <AvatarFallback>
                          {message.sender?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        message.sender_id === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.sender_id !== user?.id && (
                        <p className="text-xs font-medium mb-1">
                          {message.sender?.username || "Usuario"}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(message.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts">
          <div className="mb-4">
            <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Título del post"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Contenido del post"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={5}
                  />
                  <Button onClick={createPost} className="w-full">
                    Crear Post
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author?.avatar_url} />
                        <AvatarFallback>
                          {post.author?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Por {post.author?.username || "Usuario"} • {format(new Date(post.created_at), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span>{post.likes_count} likes</span>
                    <span>{post.comments_count} comentarios</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {posts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay posts en este grupo aún
              </div>
            )}
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.profiles?.avatar_url} />
                      <AvatarFallback>
                        {member.profiles?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.profiles?.username || "Usuario"}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(member.joined_at), "MMM yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupDetail;