import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  CheckCircle,
  StickyNote,
  Search,
  Calendar,
  Upload,
  Activity,
  ChevronDown,
  Loader2,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CaseActivityItem {
  id: string;
  caseId: string;
  activityType: string;
  description: string;
  metadata: Record<string, unknown> | null;
  performedBy: string | null;
  createdAt: string;
}

interface CaseTimelineProps {
  caseId: string;
}

const ACTIVITY_ICONS: Record<string, typeof Activity> = {
  document_uploaded: Upload,
  phase_completed: CheckCircle,
  note_added: StickyNote,
  search_performed: Search,
  meeting_scheduled: Calendar,
  document_analyzed: FileText,
};

const ACTIVITY_LABELS: Record<string, string> = {
  document_uploaded: "Documento subido",
  phase_completed: "Fase completada",
  note_added: "Nota agregada",
  search_performed: "Búsqueda realizada",
  meeting_scheduled: "Reunión programada",
  document_analyzed: "Documento analizado",
};

const ACTIVITY_COLORS: Record<string, string> = {
  document_uploaded: "text-blue-600 dark:text-blue-400",
  phase_completed: "text-green-600 dark:text-green-400",
  note_added: "text-yellow-600 dark:text-yellow-400",
  search_performed: "text-purple-600 dark:text-purple-400",
  meeting_scheduled: "text-pink-600 dark:text-pink-400",
  document_analyzed: "text-indigo-600 dark:text-indigo-400",
};

export default function CaseTimeline({ caseId }: CaseTimelineProps) {
  const [limit, setLimit] = useState(20);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Fetch activity types for filter
  const { data: activityTypes = [] } = useQuery<string[]>({
    queryKey: ["/api/cases", caseId, "activity", "types"],
  });

  // Fetch timeline with filters
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: "0",
  });
  if (selectedTypes.length > 0) {
    queryParams.set("type", selectedTypes[0]); // API solo soporta un tipo a la vez
  }

  const {
    data: activities = [],
    isLoading,
    isError,
  } = useQuery<CaseActivityItem[]>({
    queryKey: ["/api/cases", caseId, "activity", { limit, types: selectedTypes }],
    queryFn: async () => {
      const response = await fetch(`/api/cases/${caseId}/activity?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
  });

  const toggleActivityType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getIcon = (type: string) => {
    const IconComponent = ACTIVITY_ICONS[type] || Activity;
    return IconComponent;
  };

  const getLabel = (type: string) => {
    return ACTIVITY_LABELS[type] || type.replace(/_/g, " ");
  };

  const getColor = (type: string) => {
    return ACTIVITY_COLORS[type] || "text-gray-600 dark:text-gray-400";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200 dark:border-red-900">
        <CardContent className="pt-6">
          <p className="text-sm text-red-600 dark:text-red-400">
            Error al cargar la actividad del caso
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Timeline de Actividad</h3>
        <div className="flex items-center gap-2">
          {selectedTypes.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar tipo
                {selectedTypes.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedTypes.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Tipos de actividad</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {activityTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => toggleActivityType(type)}
                >
                  {getLabel(type)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Timeline */}
      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {selectedTypes.length > 0
                ? "No se encontró actividad con estos filtros"
                : "No hay actividad registrada para este caso"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {/* Activity items */}
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const IconComponent = getIcon(activity.activityType);
              const isExpanded = expandedItems.has(activity.id);
              const hasMetadata = activity.metadata && Object.keys(activity.metadata).length > 0;

              return (
                <div key={activity.id} className="relative pl-12">
                  {/* Icon */}
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full bg-background border-2 flex items-center justify-center ${getColor(
                      activity.activityType
                    )}`}
                  >
                    <IconComponent className="h-4 w-4" />
                  </div>

                  {/* Content card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-medium">
                            {getLabel(activity.activityType)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>
                        </div>
                        {hasMetadata && (
                          <Collapsible open={isExpanded}>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(activity.id)}
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </Button>
                            </CollapsibleTrigger>
                          </Collapsible>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">{activity.description}</p>

                      {/* Expanded metadata */}
                      {hasMetadata && (
                        <Collapsible open={isExpanded}>
                          <CollapsibleContent className="space-y-2">
                            <div className="border-t pt-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Detalles adicionales:
                              </p>
                              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                                {JSON.stringify(activity.metadata, null, 2)}
                              </pre>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Load more button */}
          {activities.length >= limit && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => setLimit((prev) => prev + 20)}
              >
                Cargar más actividades
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
