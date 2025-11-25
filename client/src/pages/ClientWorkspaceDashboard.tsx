import { useQuery } from '@tanstack/react-query';
import { useClient } from '@/contexts/ClientContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Briefcase, 
  CheckSquare, 
  FileText, 
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Plus
} from 'lucide-react';
import { useLocation } from 'wouter';

export function ClientWorkspaceDashboard() {
  const { client } = useClient();
  const [, navigate] = useLocation();

  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['client-cases', client?.id],
    queryFn: async () => {
      if (!client) return [];
      const res = await fetch(`/api/clients/${client.id}/cases`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!client,
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['client-tasks', client?.id],
    queryFn: async () => {
      if (!client) return [];
      const res = await fetch(`/api/clients/${client.id}/tasks`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!client,
  });

  if (!client) return null;

  const activeCases = cases.filter((c: any) => c.status === 'active');
  const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
  const urgentTasks = tasks.filter((t: any) => t.priority === 'high' && t.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border">
        <h2 className="text-2xl font-bold mb-2">
          👋 Workspace de {client.name}
        </h2>
        <p className="text-muted-foreground">
          Gestiona todos los expedientes, tareas y documentos de este cliente en un solo lugar.
          Usa las herramientas de análisis flotantes para investigación avanzada.
        </p>
      </div>

      {/* DESTACADO: Gestión del Proceso Legal */}
      <Card className="border-l-4 border-l-primary shadow-lg bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Gestión del Proceso Legal
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Sigue el caso de principio a fin: carga documentos, análisis IA, estrategia y seguimiento
              </CardDescription>
            </div>
            <Button 
              size="lg"
              onClick={() => navigate(`/client/${client.id}/process`)}
              className="gap-2"
            >
              Ir al Proceso
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Documentos</p>
                <p className="text-xs text-muted-foreground">Carga y transcribe</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200">
              <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Análisis IA</p>
                <p className="text-xs text-muted-foreground">Estrategia legal</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200">
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Seguimiento</p>
                <p className="text-xs text-muted-foreground">Citas y avances</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-4">
            💡 Proceso guiado paso a paso desde el registro hasta el cierre del caso
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expedientes Activos
              </CardTitle>
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingCases ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-primary">
                  {activeCases.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  de {cases.length}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tareas Pendientes
              </CardTitle>
              <CheckSquare className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-blue-600">
                  {pendingTasks.length}
                </div>
                {urgentTasks.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {urgentTasks.length} urgentes
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Documentos
              </CardTitle>
              <FileText className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-amber-600">0</div>
              <div className="text-sm text-muted-foreground">archivos</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Acciones Rápidas
          </CardTitle>
          <CardDescription>
            Accede rápidamente a las funciones más utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => navigate(`/client/${client.id}/cases`)}
              variant="outline"
              className="h-auto py-4 justify-start"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Nuevo Expediente</div>
                  <div className="text-xs text-muted-foreground">
                    Crear expediente para este cliente
                  </div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => navigate(`/client/${client.id}/tasks`)}
              variant="outline"
              className="h-auto py-4 justify-start"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <CheckSquare className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Nueva Tarea</div>
                  <div className="text-xs text-muted-foreground">
                    Agregar tarea al cliente
                  </div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => navigate(`/client/${client.id}/documents`)}
              variant="outline"
              className="h-auto py-4 justify-start"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Subir Documento</div>
                  <div className="text-xs text-muted-foreground">
                    Agregar archivos al expediente
                  </div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => navigate(`/client/${client.id}/ai-analysis`)}
              variant="outline"
              className="h-auto py-4 justify-start"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Análisis IA</div>
                  <div className="text-xs text-muted-foreground">
                    Analizar documentos con IA
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tareas Urgentes */}
      {urgentTasks.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Tareas Urgentes
            </CardTitle>
            <CardDescription>
              Requieren atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentTasks.slice(0, 3).map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <div>
                      <div className="font-medium">{task.title}</div>
                      {task.dueDate && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString('es-PE')}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="destructive">Urgente</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expedientes Recientes */}
      {activeCases.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Expedientes Activos
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/client/${client.id}/cases`)}
              >
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeCases.slice(0, 3).map((case_: any) => (
                <div
                  key={case_.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => navigate(`/client/${client.id}/cases/${case_.id}`)}
                >
                  <div>
                    <div className="font-medium">{case_.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {case_.caseNumber}
                    </div>
                  </div>
                  <Badge variant="outline">{case_.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
