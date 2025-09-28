import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dashboard } from "@/components/Dashboard";
import { SearchFilters } from "@/components/SearchFilters";
import NotFound from "@/pages/not-found";

// todo: remove mock functionality
function CasesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Expedientes</h1>
      <p className="text-muted-foreground">Vista completa de todos los expedientes legales.</p>
    </div>
  )
}

function JurisprudencePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Biblioteca de Jurisprudencia</h1>
        <p className="text-muted-foreground">Búsqueda y análisis de precedentes legales peruanos.</p>
      </div>
      <SearchFilters 
        onSearch={(filters) => console.log('Buscar:', filters)} 
        onReset={() => console.log('Limpiar')} 
      />
    </div>
  )
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/cases" component={CasesPage} />
      <Route path="/jurisprudence" component={JurisprudencePage} />
      <Route path="/doctrine" component={() => 
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Doctrina Legal</h1>
          <p className="text-muted-foreground">Biblioteca de doctrina, artículos académicos y tesis.</p>
        </div>
      } />
      <Route path="/search" component={() => 
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Búsqueda Avanzada</h1>
          <SearchFilters 
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
      <Route path="/tasks" component={() => 
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Gestión de Tareas</h1>
          <p className="text-muted-foreground">Seguimiento de tareas y actividades pendientes.</p>
        </div>
      } />
      <Route path="/clients" component={() => 
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Directorio y expedientes de clientes.</p>
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

function App() {
  // Custom sidebar width for legal application
  const style = {
    "--sidebar-width": "20rem",       // 320px for better content
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full" data-testid="app-main">
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <header className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="hidden sm:block">
                    <h2 className="text-sm font-medium text-muted-foreground">Dr. Juro - Asistente Legal</h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 overflow-auto p-6 bg-background">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
