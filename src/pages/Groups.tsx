import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, MessageCircle, Search, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

interface Group {
  id: string;
  name: string;
  description?: string;
  theme: string;
  avatar_url?: string;
  member_count: number;
  is_private: boolean;
  created_by: string;
  created_at: string;
  is_member?: boolean;
  user_role?: string;
}

const Groups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    theme: "",
    is_private: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, [user]);

  const loadGroups = async () => {
    try {
      // Get all groups with membership info
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .order("member_count", { ascending: false });

      if (groupsError) throw groupsError;

      // Get user's memberships if authenticated
      let membershipData = [];
      if (user) {
        const { data, error } = await supabase
          .from("group_members")
          .select("group_id, role")
          .eq("user_id", user.id);

        if (error) throw error;
        membershipData = data;
      }

      // Combine data
      const groupsWithMembership = groupsData.map(group => ({
        ...group,
        is_member: membershipData.some(m => m.group_id === group.id),
        user_role: membershipData.find(m => m.group_id === group.id)?.role
      }));

      setGroups(groupsWithMembership);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los grupos",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const createGroup = async () => {
    if (!user || !newGroup.name.trim() || !newGroup.theme.trim()) return;

    try {
      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: newGroup.name.trim(),
          description: newGroup.description.trim(),
          theme: newGroup.theme.trim(),
          is_private: newGroup.is_private,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: "admin"
        });

      if (memberError) throw memberError;

      toast({
        title: "Éxito",
        description: "Grupo creado correctamente",
      });

      setShowCreateDialog(false);
      setNewGroup({ name: "", description: "", theme: "", is_private: false });
      loadGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el grupo",
        variant: "destructive",
      });
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: "member"
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Te has unido al grupo",
      });

      loadGroups();
    } catch (error) {
      console.error("Error joining group:", error);
      toast({
        title: "Error",
        description: "No se pudo unir al grupo",
        variant: "destructive",
      });
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Has salido del grupo",
      });

      loadGroups();
    } catch (error) {
      console.error("Error leaving group:", error);
      toast({
        title: "Error",
        description: "No se pudo salir del grupo",
        variant: "destructive",
      });
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.theme.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Grupos</h1>
            <p className="text-muted-foreground">
              Únete a grupos temáticos y conecta con entusiastas como tú
            </p>
          </div>
          {user && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Grupo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Grupo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Nombre del grupo"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Tema (ej: Honda Lovers, Track Day)"
                      value={newGroup.theme}
                      onChange={(e) => setNewGroup({ ...newGroup, theme: e.target.value })}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Descripción (opcional)"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Button onClick={createGroup} className="ml-auto">
                      Crear Grupo
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupos por nombre o tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando grupos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron grupos</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={group.avatar_url} />
                        <AvatarFallback>
                          {group.name[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {group.theme}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {group.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {group.member_count} miembro{group.member_count !== 1 ? 's' : ''}
                    </div>
                    {group.is_private && (
                      <Badge variant="outline">Privado</Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {user ? (
                      group.is_member ? (
                        <>
                          <Link to={`/groups/${group.id}`} className="flex-1">
                            <Button variant="default" className="w-full">
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Entrar
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => leaveGroup(group.id)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => joinGroup(group.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Unirse
                        </Button>
                      )
                    ) : (
                      <Link to="/auth" className="w-full">
                        <Button variant="outline" className="w-full">
                          Iniciar sesión para unirse
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Groups;