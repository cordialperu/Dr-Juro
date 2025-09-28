import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Plus
} from "lucide-react"
import { CaseCard } from "./CaseCard"
import { PrecedentCard } from "./PrecedentCard"
import { AIAnalysisModal } from "./AIAnalysisModal"

// todo: remove mock functionality
const mockStats = {
  activeCases: 12,
  totalClients: 45,
  upcomingHearings: 3,
  precedentsLibrary: 2847
}

const mockRecentCases = [
  {
    id: "1",
    title: "Demanda por Daños y Perjuicios",
    client: "Constructora Lima SAC",
    status: "active" as const,
    priority: "high" as const,
    caseNumber: "EXP-2024-001234",
    court: "2º Juzgado Civil de Lima",
    nextHearing: "15 Oct 2024",
    lastActivity: "hace 2 horas",
    documentsCount: 23,
    precedentsFound: 8
  },
  {
    id: "2",
    title: "Proceso Laboral - Despido Arbitrario",
    client: "Carlos Mendoza",
    status: "pending" as const,
    priority: "medium" as const,
    caseNumber: "EXP-2024-005678",
    court: "5º Juzgado Laboral de Lima",
    lastActivity: "ayer",
    documentsCount: 15,
    precedentsFound: 12
  }
]

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
]

const mockUpcomingTasks = [
  {
    id: "1",
    title: "Presentar alegatos de apertura",
    case: "Constructora Lima SAC",
    dueDate: "Mañana",
    priority: "high" as const
  },
  {
    id: "2",
    title: "Revisar documentos pericia",
    case: "Carlos Mendoza",
    dueDate: "15 Oct",
    priority: "medium" as const
  },
  {
    id: "3",
    title: "Cita con cliente nuevo",
    case: "Consultoría inicial",
    dueDate: "16 Oct",
    priority: "low" as const
  }
]

export function Dashboard() {
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
                Insights de IA
              </Button>
            }
          />
          <Button data-testid="button-new-case">
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
            <div className="text-2xl font-bold text-primary">{mockStats.activeCases}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> desde la semana pasada
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-clients">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{mockStats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3</span> nuevos este mes
            </p>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-hearings">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Audiencias</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{mockStats.upcomingHearings}</div>
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
            <div className="text-2xl font-bold text-primary">{mockStats.precedentsLibrary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+45</span> actualizados hoy
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Expedientes Recientes</h2>
            <Button variant="outline" size="sm" data-testid="button-view-all-cases">
              Ver todos
            </Button>
          </div>
          <div className="space-y-3">
            {mockRecentCases.map((case_) => (
              <CaseCard key={case_.id} {...case_} />
            ))}
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
              {mockUpcomingTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-2 rounded-lg hover-elevate" data-testid={`task-${task.id}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    task.priority === 'high' ? 'bg-red-500' : 
                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground leading-tight">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.case}</p>
                    <p className="text-xs text-muted-foreground">{task.dueDate}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" data-testid="button-view-all-tasks">
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
              <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-quick-search">
                <Scale className="h-4 w-4 mr-2" />
                Buscar jurisprudencia
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-quick-new-client">
                <Users className="h-4 w-4 mr-2" />
                Registrar cliente
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-quick-calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Ver calendario
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-quick-reports">
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Precedents */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Jurisprudencia Reciente</h2>
          <Button variant="outline" size="sm" data-testid="button-view-all-precedents">
            Ver biblioteca completa
          </Button>
        </div>
        <div className="grid gap-4">
          {mockRecentPrecedents.map((precedent) => (
            <PrecedentCard key={precedent.id} {...precedent} />
          ))}
        </div>
      </div>
    </div>
  )
}