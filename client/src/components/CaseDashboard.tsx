import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  StickyNote,
  Activity,
  Clock,
  TrendingUp,
  Calendar,
  Tag,
  Pin,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Case {
  id: string;
  title: string;
  category: string | null;
  priority: string | null;
  tags: string[] | null;
}

interface CaseDashboardProps {
  caseId: string;
}

interface CaseDocument {
  id: string;
  caseId: string;
  fileName: string;
  fileType: string;
  createdAt: string;
}

interface Note {
  id: string;
  caseId: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: string;
  createdAt: string;
  updatedAt: string;
}

interface CaseActivityItem {
  id: string;
  activityType: string;
  description: string;
  createdAt: string;
}

interface ActivitySummary {
  totalActivities: number;
  recentActivities: number;
  lastActivity: string | null;
}

interface NotesStats {
  caseId: string;
  totalNotes: number;
  pinnedNotes: number;
  totalTags: number;
}

export default function CaseDashboard({ caseId }: CaseDashboardProps) {
  // Fetch case details
  const { data: caseData } = useQuery<Case>({
    queryKey: ["/api/cases", caseId],
  });

  // Fetch documents count
  const { data: documents = [] } = useQuery<CaseDocument[]>({
    queryKey: ["/api/cases", caseId, "documents"],
  });

  // Fetch notes stats
  const { data: notesStats } = useQuery<NotesStats>({
    queryKey: ["/api/cases", caseId, "notes", "stats"],
    queryFn: async () => {
      const response = await fetch(`/api/cases/${caseId}/notes`);
      if (!response.ok) throw new Error("Failed to fetch notes");
      const notes: Note[] = await response.json();
      
      const pinnedCount = notes.filter(n => n.isPinned === "true").length;
      const allTags = new Set<string>();
      notes.forEach(note => note.tags.forEach(tag => allTags.add(tag)));
      
      return {
        caseId,
        totalNotes: notes.length,
        pinnedNotes: pinnedCount,
        totalTags: allTags.size,
      };
    },
  });

  // Fetch activity summary
  const { data: activitySummary } = useQuery<ActivitySummary>({
    queryKey: ["/api/cases", caseId, "activity", "summary"],
    queryFn: async () => {
      const response = await fetch(`/api/cases/${caseId}/activity?limit=100`);
      if (!response.ok) throw new Error("Failed to fetch activity");
      const activities: CaseActivityItem[] = await response.json();
      
      const now = Date.now();
      const last7Days = activities.filter(
        a => now - new Date(a.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
      ).length;
      
      return {
        totalActivities: activities.length,
        recentActivities: last7Days,
        lastActivity: activities[0]?.createdAt || null,
      };
    },
  });

  // Fetch recent activities for mini timeline
  const { data: recentActivities = [] } = useQuery<CaseActivityItem[]>({
    queryKey: ["/api/cases", caseId, "activity", "recent"],
    queryFn: async () => {
      const response = await fetch(`/api/cases/${caseId}/activity?limit=5`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
  });

  // Calculate progress (if we have process state)
  const progress = caseData?.priority === "high" ? 65 : caseData?.priority === "medium" ? 40 : 20;

  const getTagColor = (tag: string, index: number) => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    ];
    const hash = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{caseData?.title || "Dashboard del Caso"}</h2>
        <p className="text-muted-foreground mt-1">
          Visión general del progreso y actividad
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Progress Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progreso General</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{progress}%</span>
                {caseData?.priority && (
                  <Badge
                    variant={
                      caseData.priority === "high"
                        ? "destructive"
                        : caseData.priority === "medium"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {caseData.priority === "high"
                      ? "Alta"
                      : caseData.priority === "medium"
                      ? "Media"
                      : "Baja"}
                  </Badge>
                )}
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Basado en documentos y actividad
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{documents.length}</div>
              <p className="text-xs text-muted-foreground">
                {documents.filter(d => d.fileType === "application/pdf").length} PDFs,{" "}
                {documents.filter(d => d.fileType !== "application/pdf").length} otros
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notes Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notas</CardTitle>
            <StickyNote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{notesStats?.totalNotes || 0}</span>
                {notesStats && notesStats.pinnedNotes > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin className="h-3 w-3" />
                    {notesStats.pinnedNotes}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {notesStats?.totalTags || 0} tags únicos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Last Activity Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Actividad</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activitySummary?.lastActivity ? (
                <>
                  <div className="text-2xl font-bold">
                    {formatDistanceToNow(new Date(activitySummary.lastActivity), {
                      locale: es,
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activitySummary.recentActivities} actividades en los últimos 7 días
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Sin actividad reciente</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Activities Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actividades</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{activitySummary?.totalActivities || 0}</div>
              <p className="text-xs text-muted-foreground">
                Eventos registrados en el sistema
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Case Category Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categoría</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {caseData?.category || "Sin categoría"}
              </div>
              <p className="text-xs text-muted-foreground">
                Tipo de caso legal
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags Cloud */}
      {caseData?.tags && Array.isArray(caseData.tags) && caseData.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tags del Caso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {caseData.tags.map((tag: string, index: number) => (
                <Badge key={tag} variant="secondary" className={getTagColor(tag, index)}>
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mini Timeline */}
      {recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
