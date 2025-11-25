import { useMemo, type CSSProperties } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppToaster } from "@/components/ui/sonner-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WorkflowToggle } from "@/components/WorkflowToggle";
import { Dashboard } from "@/components/Dashboard";
import { WorkflowModeProvider, useWorkflowMode } from "@/contexts/WorkflowModeContext";
import { ClientProvider, useClient } from "@/contexts/ClientContext";
import { ClientSelector } from "@/components/ClientSelector";
import { ClientWorkspaceLayout } from "@/components/ClientWorkspaceLayout";
import { ClientWorkspaceDashboard } from "@/pages/ClientWorkspaceDashboard";
import { DocumentAnalysis } from "@/components/DocumentAnalysis";
import { SearchFilters as SearchFiltersComponent } from "@/components/SearchFilters";
import type { SearchFilters as SearchFiltersType } from "@/components/SearchFilters";
import { ClientsPage } from "@/components/ClientsPage";
import { ProcesosPage } from "@/components/ProcesosPage";
import { ProcesoFasePage } from "@/components/ProcesoFasePage";
import { CasesPage } from "@/components/CasesPage";
import { CaseDetailsPage } from "@/components/CaseDetailsPage";
import CaseHubPage from "@/components/CaseHubPage";
import { DoctrinaPage } from "@/components/DoctrinaPage";
import { MetaBuscadorPage } from "@/components/MetaBuscadorPage";
import { TasksPage } from "@/components/TasksPage";
import { ProcessPage } from "@/components/ProcessPage";
import { LegalProcessV2 } from "@/components/LegalProcessV2";
import { ExpedientesPage } from "@/components/ExpedientesPage";
import { JurisprudenciaPage } from "@/components/JurisprudenciaPage";
import { DocumentosPage } from "@/components/DocumentosPage";
import { CommandPalette } from "@/components/CommandPalette";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import NotFound from "@/pages/not-found";
import { LoginForm } from "@/components/LoginForm";
import { useAuthQuery, useLogoutMutation } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Command } from "lucide-react";
import { useEffect, useState } from "react";

// CLASSIC WORKFLOW ROUTER: Vista global de todos los datos
function ClassicRouter() {
  const { client } = useClient();

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clients" component={ClientsPage} />
      
      {/* Rutas unificadas de cliente */}
      <Route path="/client/:id" component={ClientWorkspaceDashboard} />
      <Route path="/client/:id/process" component={() => (
        <div className="p-6">
          <LegalProcessV2 />
        </div>
      )} />
      <Route path="/client/:id/cases" component={() => (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            Expedientes {client ? `de ${client.name}` : ''}
          </h2>
          <CasesPage />
        </div>
      )} />
      <Route path="/client/:id/tasks" component={() => (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            Tareas {client ? `de ${client.name}` : ''}
          </h2>
          <TasksPage />
        </div>
      )} />
      <Route path="/client/:id/documents" component={() => (
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            Documentos {client ? `de ${client.name}` : ''}
          </h2>
          <DocumentosPage />
        </div>
      )} />
      
      {/* Rutas globales */}
      <Route path="/cases" component={CasesPage} />
      <Route path="/cases/:id" component={CaseHubPage} />
      <Route path="/cases/:id/legacy" component={CaseDetailsPage} />
      <Route path="/expedientes" component={ExpedientesPage} />
      <Route path="/jurisprudencia" component={JurisprudenciaPage} />
      <Route path="/jurisprudence" component={JurisprudenciaPage} />
      <Route path="/documentos" component={DocumentosPage} />
      <Route path="/document-analysis" component={() => <DocumentAnalysis />} />
      <Route path="/doctrina" component={DoctrinaPage} />
      <Route path="/doctrine" component={DoctrinaPage} />
      <Route path="/metabuscador" component={MetaBuscadorPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/process/:caseId?" component={ProcessPage} />
      <Route path="/search" component={() => 
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Búsqueda Avanzada</h1>
          <SearchFiltersComponent 
            onSearch={(filters: SearchFiltersType) => console.log('Buscar:', filters)} 
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

// CLIENT-CENTRIC WORKFLOW ROUTER: Enfoque en un cliente a la vez
function ClientCentricRouter() {
  const { client } = useClient();
  const [showClientSelector, setShowClientSelector] = useState(!client);
  const [, navigate] = useLocation();

  // Si no hay cliente activo, mostrar selector
  useEffect(() => {
    if (!client) {
      setShowClientSelector(true);
    }
  }, [client]);

  // Si no hay cliente y el selector se cerró sin seleccionar, volver a classic
  const handleClientSelectorClose = () => {
    if (!client) {
      setShowClientSelector(false);
    }
  };

  if (showClientSelector && !client) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ClientSelector 
          open={showClientSelector}
          onOpenChange={(open) => {
            setShowClientSelector(open);
            if (!open && !client) {
              handleClientSelectorClose();
            }
          }}
        />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">No hay cliente seleccionado</p>
        <Button onClick={() => setShowClientSelector(true)}>
          Seleccionar Cliente
        </Button>
      </div>
    );
  }

  return (
    <ClientWorkspaceLayout>
      <Switch>
        <Route path="/" component={ClientWorkspaceDashboard} />
        <Route path="/client/:clientId" component={ClientWorkspaceDashboard} />
        <Route path="/client/:clientId/process" component={() => (
          <div className="p-6">
            <LegalProcessV2 />
          </div>
        )} />
        <Route path="/client/:clientId/cases" component={() => (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Expedientes de {client.name}</h2>
            <CasesPage />
          </div>
        )} />
        <Route path="/client/:clientId/tasks" component={() => (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Tareas de {client.name}</h2>
            <TasksPage />
          </div>
        )} />
        <Route path="/client/:clientId/documents" component={() => (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Documentos de {client.name}</h2>
            <DocumentosPage />
          </div>
        )} />
        <Route component={ClientWorkspaceDashboard} />
      </Switch>
    </ClientWorkspaceLayout>
  );
}

// MAIN ROUTER: Conmuta entre workflows según el modo seleccionado
function MainRouter() {
  const { mode } = useWorkflowMode();
  
  if (mode === 'client-centric') {
    return <ClientCentricRouter />;
  }
  
  return <ClassicRouter />;
}

function AuthenticatedShell() {
  const { toast } = useToast();
  const { mode } = useWorkflowMode();
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

  // En modo client-centric, no mostramos el sidebar tradicional
  const showClassicSidebar = mode === 'classic';

  return (
    <SidebarProvider style={sidebarStyle as CSSProperties}>
      <CommandPalette />
      <div className="flex min-h-svh w-full" data-testid="app-main">
        {showClassicSidebar && <AppSidebar />}
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex items-center gap-3 sm:gap-4">
              {showClassicSidebar && (
                <SidebarTrigger data-testid="button-sidebar-toggle" className="h-9 w-9" />
              )}
              <div className="flex flex-col">
                <h2 className="text-sm font-medium text-foreground sm:text-base">Dr. Juro</h2>
                <p className="text-xs text-muted-foreground sm:text-sm hidden sm:block">
                  {mode === 'client-centric' ? 'Modo Client-Centric' : `Sesión iniciada como ${profile.username}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex gap-2"
                onClick={() => {
                  const event = new KeyboardEvent("keydown", {
                    key: "k",
                    code: "KeyK",
                    metaKey: true,
                    ctrlKey: true,
                    bubbles: true,
                  });
                  document.dispatchEvent(event);
                }}
              >
                <Command className="h-4 w-4" />
                Buscar...
              </Button>
              <WorkflowToggle />
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.status === "pending"}
                className="hidden sm:flex"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {logoutMutation.status === "pending" ? "Saliendo…" : "Cerrar sesión"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.status === "pending"}
                className="sm:hidden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background px-2 py-4 sm:px-6 sm:py-6 pb-20 md:pb-6">
            <MainRouter />
          </main>
          {showClassicSidebar && <MobileBottomNav />}
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
