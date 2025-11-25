import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FileText,
  Search,
  StickyNote,
  Activity,
  Settings,
  ChevronLeft,
  Bell,
  Download,
  Clock,
  Loader2,
  FolderOpen,
  Scale,
  MessageSquare,
  Tag as TagIcon,
} from "lucide-react";
import { getClientColor, getClientColorStyles } from "@/lib/clientColors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Import all feature components
import CaseDashboard from "@/components/CaseDashboard";
import NotesPanel from "@/components/NotesPanel";
import CaseTimeline from "@/components/CaseTimeline";
import TagManager from "@/components/TagManager";
import ExportPdfButton from "@/components/ExportPdfButton";
import GlobalSearch from "@/components/GlobalSearch";
import AlertsPanel from "@/components/AlertsPanel";
import { DocumentAnalysis } from "@/components/DocumentAnalysis";
import { DoctrinaList } from "@/components/DoctrinaList";

interface CaseHubPageProps {
  params: {
    id: string;
  };
}

interface Case {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
  priority: string | null;
  tags: string[] | null;
  clientId: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  name: string;
}

type Section =
  | "dashboard"
  | "proceso"
  | "documentos"
  | "jurisprudencia"
  | "doctrina"
  | "metabuscador"
  | "comunicaciones"
  | "notas"
  | "timeline"
  | "tags"
  | "alertas";

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "proceso", label: "Proceso (5 Fases)", icon: Clock },
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "investigacion", label: "Investigación", icon: Search, isGroup: true },
  { id: "jurisprudencia", label: "Jurisprudencia", icon: Scale, indent: true },
  { id: "doctrina", label: "Doctrina", icon: FolderOpen, indent: true },
  { id: "metabuscador", label: "Meta Buscador", icon: Search, indent: true },
  { id: "comunicaciones", label: "Comunicaciones", icon: MessageSquare },
  { id: "notas", label: "Notas", icon: StickyNote },
  { id: "timeline", label: "Timeline", icon: Activity },
  { id: "tags", label: "Tags", icon: TagIcon },
  { id: "alertas", label: "Alertas", icon: Bell },
];

export default function CaseHubPage({ params }: CaseHubPageProps) {
  const { id: caseId } = params;
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<Section>("dashboard");

  // Fetch case data
  const { data: caseData, isLoading: isLoadingCase } = useQuery<Case>({
    queryKey: ["/api/cases", caseId],
  });

  // Fetch client data
  const { data: clientData } = useQuery<Client>({
    queryKey: ["/api/clients", caseData?.clientId],
    enabled: !!caseData?.clientId,
  });

  // Fetch reminder count for badge
  const { data: reminderCount } = useQuery<{ count: number }>({
    queryKey: ["/api/cases", caseId, "reminders", "count"],
  });

  // Colores del cliente actual
  const clientColor = useMemo(() => {
    if (!caseData?.clientId) return null;
    return getClientColor(caseData.clientId);
  }, [caseData?.clientId]);

  const getSectionLabel = (section: Section) => {
    return SECTIONS.find((s) => s.id === section)?.label || section;
  };

  const renderContent = () => {
    if (!caseData) return null;

    switch (activeSection) {
      case "dashboard":
        return <CaseDashboard caseId={caseId} />;

      case "notas":
        return <NotesPanel caseId={caseId} />;

      case "timeline":
        return <CaseTimeline caseId={caseId} />;

      case "tags":
        return (
          <TagManager
            caseId={caseId}
            currentTags={(caseData.tags as string[]) || []}
          />
        );

      case "alertas":
        return (
          <AlertsPanel caseId={caseId} clientId={caseData.clientId || ""} />
        );

      case "documentos":
        return <DocumentAnalysis caseId={caseId} />;

      case "doctrina":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Doctrina Legal</h2>
            <Card>
              <CardContent className="py-12 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Doctrina legal relacionada (próximamente)
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "proceso":
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Vista de proceso con 5 fases (próximamente)
              </p>
            </CardContent>
          </Card>
        );

      case "jurisprudencia":
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Búsqueda de jurisprudencia (próximamente)
              </p>
            </CardContent>
          </Card>
        );

      case "metabuscador":
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Meta buscador legal (próximamente)
              </p>
            </CardContent>
          </Card>
        );

      case "comunicaciones":
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Centro de comunicaciones (próximamente)
              </p>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Sección no encontrada</p>
            </CardContent>
          </Card>
        );
    }
  };

  if (isLoadingCase) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Cargando caso...</span>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Caso no encontrado</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/casos")}>
              Volver a casos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={clientColor ? getClientColorStyles(caseData.clientId || '') : {}}>
      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col" style={clientColor ? { backgroundColor: clientColor.light + '20', borderRightColor: clientColor.primary + '40' } : { backgroundColor: 'hsl(var(--muted)/0.3)' }}>
        {/* Sidebar Header */}
        <div className="p-4 border-b" style={clientColor ? { borderBottomColor: clientColor.primary + '40' } : {}}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start mb-3"
            onClick={() => navigate("/casos")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Volver a casos
          </Button>
          <div className="space-y-1">
            <h2 className="font-semibold text-sm truncate">{caseData.title}</h2>
            {clientData && (
              <p className="text-xs text-muted-foreground truncate">
                Cliente: {clientData.name}
              </p>
            )}
            {caseData.priority && (
              <Badge
                variant="outline"
                className="text-xs"
                style={clientColor ? {
                  backgroundColor: clientColor.light,
                  color: clientColor.dark,
                  borderColor: clientColor.primary
                } : {}}
              >
                {caseData.priority === "high"
                  ? "Prioridad Alta"
                  : caseData.priority === "medium"
                  ? "Prioridad Media"
                  : "Prioridad Baja"}
              </Badge>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-2">
          <nav className="space-y-1">
            {SECTIONS.map((section) => {
              if (section.isGroup) {
                return (
                  <div key={section.id} className="pt-2 pb-1">
                    <p className="px-3 text-xs font-semibold text-muted-foreground uppercase">
                      {section.label}
                    </p>
                  </div>
                );
              }

              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <Button
                  key={section.id}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={`w-full justify-start ${section.indent ? "pl-8" : ""}`}
                  onClick={() => setActiveSection(section.id as Section)}
                  style={isActive && clientColor ? {
                    backgroundColor: clientColor.light,
                    color: clientColor.dark,
                    borderColor: clientColor.primary
                  } : {}}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {section.label}
                  {section.id === "alertas" &&
                    reminderCount &&
                    reminderCount.count > 0 && (
                      <Badge
                        variant="outline"
                        className="ml-auto text-xs px-1.5 py-0"
                        style={clientColor ? {
                          backgroundColor: clientColor.primary,
                          color: 'white',
                          borderColor: clientColor.dark
                        } : {}}
                      >
                        {reminderCount.count}
                      </Badge>
                    )}
                </Button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-3 border-t space-y-2">
          <ExportPdfButton
            caseId={caseId}
            caseTitle={caseData.title}
            variant="outline"
            size="sm"
          />
          <GlobalSearch caseId={caseId} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header with breadcrumbs */}
        <header className="border-b p-4 bg-background">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate("/")}>Inicio</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate("/casos")}>Casos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate(`/clientes/${caseData.clientId}`)}>
                  {clientData?.name || "Cliente"}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{caseData.title}</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{getSectionLabel(activeSection)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-6">{renderContent()}</ScrollArea>
      </main>
    </div>
  );
}
