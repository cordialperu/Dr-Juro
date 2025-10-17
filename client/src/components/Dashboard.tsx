import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { CaseCard, CaseCardProps } from "./CaseCard";
import { PrecedentCard } from "./PrecedentCard";
import { AIAnalysisModal } from "./AIAnalysisModal";
import { useClientsQuery } from "@/hooks/useClients";
import { useCasesQuery } from "@/hooks/useCases";
import { useTasksQuery } from "@/hooks/useTasks";
import { useLocation } from "wouter";
import { format } from "date-fns";

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
    data: clientsData = [],
    isLoading: isLoadingClients,
    error: clientsError,
  } = useClientsQuery();

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
    clientsData.find((client) => client.id === clientId)?.name ?? "Desconocido";

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

  if (isLoadingClients || isLoadingCases) return <div>Cargando...</div>;
  if (clientsError) return <div>Error al cargar clientes: {clientsError.message}</div>;
  if (casesError) return <div>Error al cargar casos: {casesError.message}</div>;

  return (
    <div className="space-y-6" data-testid="dashboard-main">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel Principal</h1>
          <p className="text-muted-foreground">Resumen de actividad legal y casos activos</p>
        </div>
        <div className="flex gap-3">
          <AIAnalysisModal 
            caseTitle="Análisis general de cartera" 
            triggerButton={
              <Button variant="outline" data-testid="button-ai-insights">
                <Brain className="h-4 w-4 mr-2" />
                Insights
              </Button>
            }
          />
          <Button
            data-testid="button-new-case"
            onClick={() => navigate("/cases")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo expediente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="stat-active-cases">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expedientes Activos</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeCasesCount}</div>
            <p className="text-xs text-muted-foreground">
              {/* <span className="text-green-600">+2</span> desde la semana pasada */}
              Total de casos: {casesData?.length || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-clients">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalClientsCount}</div>
            <p className="text-xs text-muted-foreground">
              {/* <span className="text-green-600">+3</span> nuevos este mes */}
              Clientes registrados
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-hearings">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Audiencias</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">0</div> {/* Placeholder for now */}
            <p className="text-xs text-muted-foreground">
              En los próximos 7 días
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-precedents">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Biblioteca Jurisprudencial</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{mockRecentPrecedents.length}</div> {/* Still mock for now */}
            <p className="text-xs text-muted-foreground">
              {/* <span className="text-green-600">+45</span> actualizados hoy */}
              Precedentes disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Expedientes Recientes</h2>
            <Button
              variant="outline"
              size="sm"
              data-testid="button-view-all-cases"
              onClick={() => navigate("/cases")}
            >
              Ver todos
            </Button>
          </div>
          <div className="space-y-3">
            {caseCards.slice(0, 2).map((case_) => (
              <CaseCard key={case_.id} {...case_} />
            ))}
            {caseCards.length === 0 && <p className="text-muted-foreground">No hay expedientes recientes.</p>}
          </div>
        </div>

        {/* Sidebar with Tasks and Recent Precedents */}
        <div className="space-y-6">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tareas Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingTasks ? (
                <p className="text-sm text-muted-foreground">Cargando tareas…</p>
              ) : tasksData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay tareas pendientes.</p>
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
                        className="flex items-start gap-3 rounded-lg border border-border/40 p-3"
                        data-testid={`task-${task.id}`}
                      >
                        <div
                          className={`mt-2 h-2 w-2 rounded-full ${priorityIndicatorClass(normalizedPriority)}`}
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-medium leading-tight text-card-foreground">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{relatedCase}</span>
                            <span>•</span>
                            <span>{formatTaskDueDate(task.dueDate ?? null)}</span>
                            <Badge variant="secondary" className="capitalize">
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
                className="w-full"
                data-testid="button-view-all-tasks"
                onClick={() => navigate("/tasks")}
              >
                Ver todas las tareas
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                data-testid="button-quick-search"
                onClick={() => navigate("/jurisprudence")}
              >
                <Scale className="h-4 w-4 mr-2" />
                Buscar jurisprudencia
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                data-testid="button-quick-new-client"
                onClick={() => navigate("/clients")}
              >
                <Users className="h-4 w-4 mr-2" />
                Registrar cliente
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                data-testid="button-quick-calendar"
                onClick={() => navigate("/calendar")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Ver calendario
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                data-testid="button-quick-reports"
                onClick={() => navigate("/document-analysis")}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Generar reportes
              </Button>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Alertas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Audiencia mañana</p>
                  <p className="text-yellow-700 dark:text-yellow-300">Constructora Lima SAC - 9:00 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Nueva jurisprudencia</p>
                  <p className="text-blue-700 dark:text-blue-300">3 precedentes sobre responsabilidad civil</p>
                </div >
              </div >
            </CardContent>
          </Card>
        </div >
      </div >

      {/* Recent Precedents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Jurisprudencia Reciente</h2>
          <Button
            variant="outline"
            size="sm"
            data-testid="button-view-all-precedents"
            onClick={() => navigate("/jurisprudence")}
          >
            Ver biblioteca completa
          </Button>
        </div >
        <div className="grid gap-4">
          {mockRecentPrecedents.map((precedent) => (
            <PrecedentCard key={precedent.id} {...precedent} />
          ))}
        </div >
      </div >
    </div >
  )
}