import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  reported_content_type: string;
  reported_content_id: string;
  created_at: string;
  resolved_at: string | null;
  reporter: {
    username: string;
    avatar_url: string | null;
  };
  resolver: {
    username: string;
    avatar_url: string | null;
  } | null;
}

export const ReportsManagementTab = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          id,
          reason,
          description,
          status,
          reported_content_type,
          reported_content_id,
          created_at,
          resolved_at,
          reporter_id,
          resolved_by
        `)
        .order("created_at", { ascending: false });

      // Get all profiles for reporters and resolvers
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url");

      if (error) throw error;

      const formattedReports = data?.map(report => {
        const reporter = profilesData?.find(p => p.id === report.reporter_id);
        const resolver = report.resolved_by ? profilesData?.find(p => p.id === report.resolved_by) : null;
        
        return {
          id: report.id,
          reason: report.reason,
          description: report.description,
          status: report.status,
          reported_content_type: report.reported_content_type,
          reported_content_id: report.reported_content_id,
          created_at: report.created_at,
          resolved_at: report.resolved_at,
          reporter: {
            username: reporter?.username || "Usuario eliminado",
            avatar_url: reporter?.avatar_url || null
          },
          resolver: resolver ? {
            username: resolver.username || "Admin",
            avatar_url: resolver.avatar_url || null
          } : null
        };
      }) || [];

      setReports(formattedReports);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los reportes",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const resolveReport = async (reportId: string, action: "resolved" | "dismissed") => {
    try {
      const currentUser = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("reports")
        .update({
          status: action,
          resolved_at: new Date().toISOString(),
          resolved_by: currentUser.data.user?.id
        })
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Reporte actualizado",
        description: `El reporte se marcó como ${action === "resolved" ? "resuelto" : "descartado"}`,
      });

      loadReports();
    } catch (error) {
      console.error("Error resolving report:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el reporte",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resuelto
          </Badge>
        );
      case "dismissed":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3 mr-1" />
            Descartado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "forum_thread":
        return "Hilo del foro";
      case "forum_reply":
        return "Respuesta del foro";
      case "photo":
        return "Foto";
      case "blog_post":
        return "Post del blog";
      case "comment":
        return "Comentario";
      default:
        return type;
    }
  };

  const filteredReports = reports.filter(report =>
    statusFilter === "all" || report.status === statusFilter
  );

  if (loading) {
    return <div className="text-center py-8">Cargando reportes...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gestión de Reportes ({filteredReports.length})</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="resolved">Resueltos</SelectItem>
                <SelectItem value="dismissed">Descartados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {statusFilter === "pending" 
                ? "¡Excelente! No hay reportes pendientes" 
                : "No hay reportes para mostrar"
              }
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reporte</TableHead>
                    <TableHead>Reportado por</TableHead>
                    <TableHead>Tipo de contenido</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Resuelto por</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.reason}</div>
                          {report.description && (
                            <div className="text-sm text-muted-foreground">
                              {report.description.substring(0, 100)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={report.reporter.avatar_url || undefined} />
                            <AvatarFallback>
                              {report.reporter.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{report.reporter.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getContentTypeLabel(report.reported_content_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(report.created_at).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            {new Date(report.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.resolver ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={report.resolver.avatar_url || undefined} />
                              <AvatarFallback>
                                {report.resolver.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{report.resolver.username}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {report.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => resolveReport(report.id, "resolved")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveReport(report.id, "dismissed")}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Descartar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">
                  {reports.filter(r => r.status === "pending").length}
                </div>
                <div className="text-sm text-muted-foreground">Pendientes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {reports.filter(r => r.status === "resolved").length}
                </div>
                <div className="text-sm text-muted-foreground">Resueltos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-8 w-8 text-gray-500" />
              <div>
                <div className="text-2xl font-bold">
                  {reports.filter(r => r.status === "dismissed").length}
                </div>
                <div className="text-sm text-muted-foreground">Descartados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{reports.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};