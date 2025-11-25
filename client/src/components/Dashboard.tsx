import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Folder,
  Scale,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  Clock,
  FileText,
  Brain,
  Plus,
  ArrowUpRight,
  Activity,
  Sparkles,
} from "lucide-react";
import { CaseCard, CaseCardProps } from "./CaseCard";
import { PrecedentCard } from "./PrecedentCard";
import { AIAnalysisModal } from "./AIAnalysisModal";
import { useClientsQuery } from "@/hooks/useClients";
import { useCasesQuery } from "@/hooks/useCases";
import { useTasksQuery } from "@/hooks/useTasks";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Breadcrumbs } from "./Breadcrumbs";

const formatTaskDueDate = (value: string | Date | null) => {
  if (!value) return "Sin fecha";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return format(date, "dd MMM");
};

const normalizeTaskPriority = (priority?: string | null): "low" | "medium" | "high" => {
  switch (priority) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    default:
      return "medium";
  }
};

const priorityIndicatorClass = (priority: "low" | "medium" | "high") => {
  switch (priority) {
    case "high":
      return "bg-red-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
    default:
      return "bg-green-500";
  }
};

export function Dashboard() {
  const [, navigate] = useLocation();
  const {
    data: clientsResponse = [],
    isLoading: isLoadingClients,
    error: clientsError,
  } = useClientsQuery();
  
  // Normalize clients data - handle both array and paginated response
  const clientsData = Array.isArray(clientsResponse) ? clientsResponse : [];

  const {
    data: casesData = [],
    isLoading: isLoadingCases,
    error: casesError,
  } = useCasesQuery();

  const {
    data: tasksData = [],
    isLoading: isLoadingTasks,
  } = useTasksQuery({ status: "pending" });

  const resolveClientName = (clientId?: string | null) =>
    clientsData.find((client: { id: string; name: string }) => client.id === clientId)?.name ?? "Desconocido";

  const normalizeStatus = (status: string | null | undefined): CaseCardProps["status"] => {
    switch (status) {
      case "active":
      case "pending":
      case "closed":
      case "review":
        return status;
      default:
        return "active";
    }
  };

  const caseCards: CaseCardProps[] = casesData.map((caseItem, index) => {
    const createdAt = caseItem.createdAt ? new Date(caseItem.createdAt) : new Date();
    const updatedAt = caseItem.updatedAt ? new Date(caseItem.updatedAt) : createdAt;

    const fallbackCaseNumber = `EXP-${createdAt.getFullYear()}-${String(index + 1).padStart(4, "0")}`;

    return {
      id: caseItem.id,
      title: caseItem.title,
      client: resolveClientName(caseItem.clientId ?? undefined),
      status: normalizeStatus(caseItem.status),
      priority: "medium",
      caseNumber: caseItem.id ?? fallbackCaseNumber,
      court: caseItem.description ? "Tribunal asignado" : "Por asignar",
      nextHearing: undefined,
      lastActivity: updatedAt.toLocaleDateString("es-PE", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      documentsCount: 0,
      precedentsFound: undefined,
    } satisfies CaseCardProps;
  });

  // Derived stats
  const activeCasesCount = caseCards.filter(c => c.status === 'active').length;
  const totalClientsCount = clientsData.length;

  // Mock precedents for now, will integrate real ones later
  const mockRecentPrecedents = [
    {
      id: "1",
      title: "Responsabilidad Civil por Daños en Obras de Construcción",
      court: "Corte Suprema de Justicia",
      chamber: "Sala Civil Transitoria",
      date: "15 Mar 2023",
      caseNumber: "CAS-2023-1845",
      bindingLevel: "ejecutoria_vinculante" as const,
      summary: "Se establece que el contratista es responsable por los daños causados por defectos en la construcción, incluso después de la entrega de la obra.",
      confidence: 92,
      articlesMatched: ["Art. 1969 CC", "Art. 1970 CC"],
      excerpt: "La responsabilidad del constructor no se extingue con la entrega de la obra."
    }
  ];

  if (isLoadingClients || isLoadingCases) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-6 space-y-8">
          {/* Breadcrumbs Skeleton */}
          <Skeleton className="h-5 w-32" />

          {/* Header Skeleton */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-8 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <Skeleton className="h-10 w-64 bg-primary-foreground/20" />
                <Skeleton className="h-6 w-96 bg-primary-foreground/20" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32 bg-primary-foreground/20" />
                <Skeleton className="h-10 w-40 bg-primary-foreground/20" />
              </div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32 mb-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-48" />
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (clientsError) return <div>Error al cargar clientes: {clientsError.message}</div>;
  if (casesError) return <div>Error al cargar casos: {casesError.message}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: "Dashboard" }]} />

        {/* Header with gradient accent */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-8 shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold text-primary-foreground tracking-tight">Panel Principal</h1>
                <Badge variant="secondary" className="gap-1 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                  <Activity className="h-3 w-3" />
                  En vivo
                </Badge>
              </div>
              <p className="text-primary-foreground/90 text-lg">Resumen de actividad legal y casos activos</p>
            </div>
            <div className="flex gap-3">
              <AIAnalysisModal 
                caseTitle="Análisis general de cartera" 
                triggerButton={
                  <Button variant="secondary" className="shadow-lg gap-2" data-testid="button-ai-insights">
                    <Sparkles className="h-4 w-4" />
                    Insights IA
                  </Button>
                }
              />
              <Button
                className="shadow-lg bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2"
                data-testid="button-new-case"
                onClick={() => navigate("/cases")}
              >
                <Plus className="h-4 w-4" />
                Nuevo expediente
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards with enhanced design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-l-4 border-l-primary hover:shadow-lg transition-shadow duration-200" data-testid="stat-active-cases">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expedientes Activos</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Folder className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activeCasesCount}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                Total: {casesData?.length || 0} casos
              </p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-200" data-testid="stat-clients">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Totales</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{totalClientsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Clientes registrados
              </p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow duration-200" data-testid="stat-hearings">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Próximas Audiencias</CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                En los próximos 7 días
              </p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow duration-200" data-testid="stat-precedents">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Biblioteca Jurisprudencial</CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Scale className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{mockRecentPrecedents.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Precedentes disponibles
              </p>
            </CardContent>
          </Card>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases - Redesigned */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <div className="h-8 w-1 bg-primary rounded-full" />
              Expedientes Recientes
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              data-testid="button-view-all-cases"
              onClick={() => navigate("/cases")}
            >
              Ver todos
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {caseCards.slice(0, 2).map((case_) => (
              <CaseCard key={case_.id} {...case_} />
            ))}
            {caseCards.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Folder className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No hay expedientes recientes.</p>
                  <Button onClick={() => navigate("/cases")} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer expediente
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar with Tasks and Actions - Enhanced */}
        <div className="space-y-6">
          {/* Upcoming Tasks */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Tareas Pendientes
              </CardTitle>
              <CardDescription>Próximas actividades a realizar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingTasks ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : tasksData.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No hay tareas pendientes.</p>
                </div>
              ) : (
                tasksData
                  .slice(0, 3)
                  .map((task) => {
                    const relatedCase = task.caseId
                      ? casesData.find((caseItem) => caseItem.id === task.caseId)?.title ?? "Sin expediente"
                      : "Sin expediente";
                    const normalizedPriority = normalizeTaskPriority(task.priority ?? null);
                    return (
                      <div
                        key={task.id}
                        className="group flex items-start gap-3 rounded-xl border border-border/50 p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-card"
                        data-testid={`task-${task.id}`}
                      >
                        <div
                          className={`mt-1 h-2.5 w-2.5 rounded-full ${priorityIndicatorClass(normalizedPriority)} shadow-sm`}
                        />
                        <div className="flex-1 min-w-0 space-y-2">
                          <p className="text-sm font-semibold leading-tight text-card-foreground group-hover:text-primary transition-colors">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="outline" className="font-normal">
                              {relatedCase}
                            </Badge>
                            <span className="text-muted-foreground">{formatTaskDueDate(task.dueDate ?? null)}</span>
                            <Badge 
                              variant={normalizedPriority === "high" ? "destructive" : "secondary"} 
                              className="capitalize text-[10px]"
                            >
                              {normalizedPriority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                data-testid="button-view-all-tasks"
                onClick={() => navigate("/tasks")}
              >
                Ver todas las tareas
                <ArrowUpRight className="h-3 w-3 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions - Enhanced */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-colors"
                data-testid="button-quick-search"
                onClick={() => navigate("/jurisprudence")}
              >
                <Scale className="h-4 w-4 mr-3" />
                Buscar jurisprudencia
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-colors"
                data-testid="button-quick-new-client"
                onClick={() => navigate("/clients")}
              >
                <Users className="h-4 w-4 mr-3" />
                Registrar cliente
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-colors"
                data-testid="button-quick-calendar"
                onClick={() => navigate("/calendar")}
              >
                <Calendar className="h-4 w-4 mr-3" />
                Ver calendario
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-colors"
                data-testid="button-quick-reports"
                onClick={() => navigate("/document-analysis")}
              >
                <TrendingUp className="h-4 w-4 mr-3" />
                Generar reportes
              </Button>
            </CardContent>
          </Card>

          {/* Recent Alerts - Enhanced */}
          <Card className="shadow-md border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Alertas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/50">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">Audiencia mañana</p>
                  <p className="text-yellow-800 dark:text-yellow-200">Constructora Lima SAC - 9:00 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">Nueva jurisprudencia</p>
                  <p className="text-blue-800 dark:text-blue-200">3 precedentes sobre responsabilidad civil</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Precedents - Enhanced */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <div className="h-8 w-1 bg-primary rounded-full" />
            Jurisprudencia Reciente
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            data-testid="button-view-all-precedents"
            onClick={() => navigate("/jurisprudence")}
          >
            Ver biblioteca completa
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-4">
          {mockRecentPrecedents.map((precedent) => (
            <PrecedentCard key={precedent.id} {...precedent} />
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}