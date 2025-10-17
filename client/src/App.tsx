import { useMemo, useCallback, type CSSProperties, useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppToaster } from "@/components/ui/sonner-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dashboard } from "@/components/Dashboard";
import { ClientProvider } from "@/contexts/ClientContext";
import {
  SearchFilters as SearchFiltersComponent,
  type SearchFilters as SearchFiltersValues,
} from "@/components/SearchFilters";
import { DocumentAnalysis } from "@/components/DocumentAnalysis";
import { ClientsPage } from "@/components/ClientsPage"; // Import ClientsPage
import { ProcesosPage } from "@/components/ProcesosPage";
import { ProcesoFasePage } from "@/components/ProcesoFasePage";
import { CasesPage } from "@/components/CasesPage";     // Import CasesPage
import { CaseDetailsPage } from "@/components/CaseDetailsPage";
import { DoctrinaPage } from "@/components/DoctrinaPage";
import { MetaBuscadorPage } from "@/components/MetaBuscadorPage";
import { TasksPage } from "@/components/TasksPage";
import { ProcessPage } from "@/components/ProcessPage";
import NotFound from "@/pages/not-found";
import { LoginForm } from "@/components/LoginForm";
import { useAuthQuery, useLogoutMutation } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useJurisprudenceSearch } from "@/hooks/useJurisprudence";

function JurisprudencePage() {
  const [, navigate] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);
  const jurisprudenceSearch = useJurisprudenceSearch();

  const handleSearch = useCallback(
    (filters: SearchFiltersValues) => {
      const query = filters.query.trim();
      if (!query) {
        return;
      }

      setModalOpen(true);
      setFullscreenMode(false);
      setLastQuery(query);
      setLastAnswer(null);
      jurisprudenceSearch.mutate(
        { query },
        {
          onSuccess: (data) => {
            setLastAnswer(data.answer);
          },
          onError: (error) => {
            const message =
              error.message ||
              "No se pudo obtener una respuesta de la jurisprudencia. Verifica la configuración de Gemini.";
            setLastAnswer(message);
          },
        },
      );
    },
    [jurisprudenceSearch],
  );

  const handleReset = useCallback(() => {
    setLastQuery(null);
    setLastAnswer(null);
    setFullscreenMode(false);
    jurisprudenceSearch.reset();
    navigate("/jurisprudence");
  }, [jurisprudenceSearch, navigate]);

  const handleDoubleClick = useCallback(() => {
    setFullscreenMode(true);
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setFullscreenMode(false);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Biblioteca de Jurisprudencia</h1>
        <p className="text-muted-foreground">Búsqueda y análisis de precedentes legales peruanos.</p>
      </div>
      <SearchFiltersComponent onSearch={handleSearch} onReset={handleReset} />

      <Dialog open={modalOpen && !fullscreenMode} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Resultado de la búsqueda</DialogTitle>
            <DialogDescription>
              {jurisprudenceSearch.isPending
                ? "Consultando Gemini…"
                : lastQuery
                  ? `Consulta: ${lastQuery}`
                  : "Sin consulta"}
            </DialogDescription>
            {lastAnswer && (
              <p className="text-xs text-muted-foreground pt-2">
                💡 Haz doble clic en el texto para abrir en modo lectura completa
              </p>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {jurisprudenceSearch.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Procesando consulta…
              </div>
            )}
            {lastAnswer && (
              <div 
                onDoubleClick={handleDoubleClick}
                className="whitespace-pre-wrap rounded-md border border-border/60 bg-muted/30 p-4 text-sm text-foreground leading-relaxed cursor-pointer hover:border-primary/50 transition-colors"
              >
                {lastAnswer}
              </div>
            )}
            {!jurisprudenceSearch.isPending && !lastAnswer && (
              <p className="text-sm text-muted-foreground">Sin resultados por mostrar.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Reading Mode */}
      <Dialog open={fullscreenMode} onOpenChange={handleCloseFullscreen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl">Modo Lectura</DialogTitle>
            <DialogDescription>
              {lastQuery ? `Consulta: ${lastQuery}` : "Resultado de la búsqueda"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {lastAnswer && (
              <div className="max-w-4xl mx-auto">
                <div className="whitespace-pre-wrap text-base leading-loose text-foreground">
                  {lastAnswer}
                </div>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/30 flex justify-end">
            <Button onClick={handleCloseFullscreen} variant="outline">
              Cerrar modo lectura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clients" component={ClientsPage} />
  <Route path="/procesos" component={ProcesosPage} />
      <Route path="/proceso/:clientId/:fase" component={ProcesoFasePage} />
      <Route path="/cases" component={CasesPage} />
      <Route path="/cases/:id" component={CaseDetailsPage} />
      <Route path="/jurisprudence" component={JurisprudencePage} />
      <Route path="/document-analysis" component={DocumentAnalysis} />
      <Route path="/doctrine" component={DoctrinaPage} />
      <Route path="/metabuscador" component={MetaBuscadorPage} />
      <Route path="/process/:caseId?" component={ProcessPage} />
      <Route path="/search" component={() => 
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Búsqueda Avanzada</h1>
          <SearchFiltersComponent 
            onSearch={(filters) => console.log('Buscar:', filters)} 
            onReset={() => console.log('Limpiar')} 
          />
        </div>
      } />
      <Route path="/calendar" component={() => 
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Calendario Legal</h1>
          <p className="text-muted-foreground">Gestión de audiencias, plazos y fechas importantes.</p>
        </div>
      } />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/clients" component={ClientsPage} /> {/* Use ClientsPage */}
      <Route path="/billing" component={() => 
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Facturación</h1>
          <p className="text-muted-foreground">Control de honorarios y facturación de servicios.</p>
        </div>
      } />
      <Route path="/settings" component={() => 
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Configuración</h1>
          <p className="text-muted-foreground">Configuración del sistema, firmas digitales y roles de usuario.</p>
        </div>
      } />
      <Route path="/audit" component={() => 
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Auditoría</h1>
          <p className="text-muted-foreground">Registro de actividades y auditoría de acceso a datos.</p>
        </div>
      } />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedShell() {
  const { toast } = useToast();
  const { data: profile, isLoading, isError, error, refetch } = useAuthQuery();
  const logoutMutation = useLogoutMutation();

  const sidebarStyle = useMemo(() => ({
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  }), []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Verificando sesión…</span>
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    const authErrorMessage = error?.message ?? "";
    const isUnauthorized =
      (!profile && !error) ||
      /401|unauthorized|no autenticado/i.test(authErrorMessage);

    if (isUnauthorized) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-center">
              Ingresa tus credenciales para acceder a Dr. Juro.
            </p>
            <LoginForm onSuccess={() => refetch()} />
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-destructive text-center">
          No se pudo cargar la sesión: {authErrorMessage || "Error desconocido"}
        </p>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Sesión cerrada" });
        refetch();
      },
      onError: (logoutError) => {
        toast({
          title: "No se pudo cerrar sesión",
          description: logoutError.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <SidebarProvider style={sidebarStyle as CSSProperties}>
      <div className="flex min-h-svh w-full" data-testid="app-main">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-3 sm:gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="h-9 w-9" />
              <div className="flex flex-col">
                <h2 className="text-sm font-medium text-foreground sm:text-base">Dr. Juro</h2>
                <p className="text-xs text-muted-foreground sm:text-sm">Sesión iniciada como {profile.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.status === "pending"}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {logoutMutation.status === "pending" ? "Saliendo…" : "Cerrar sesión"}
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background px-4 py-6 sm:px-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClientProvider>
        <TooltipProvider>
          <AuthenticatedShell />
          <AppToaster />
        </TooltipProvider>
      </ClientProvider>
    </QueryClientProvider>
  );
}

export default App;
