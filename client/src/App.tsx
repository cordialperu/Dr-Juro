import { Route, Switch, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ClientProvider, useClient } from "@/contexts/ClientContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppToaster } from "@/components/ui/sonner-toaster";
import { ClientWorkspaceLayout } from "@/layouts/ClientWorkspaceLayout";
import { LoginForm } from "@/components/LoginForm";
import { FloatingChatBot } from "@/components/FloatingChatBot";
import { useAuthQuery, useLogoutMutation } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

// V4 Pages - Arquitectura Proceso-Céntrica
import { ClientSelector } from "@/pages/ClientSelector";
import { DashboardGlobal } from "@/pages/DashboardGlobal"; // Vista panorámica
import { LegalProcessV2 } from "@/components/LegalProcessV2"; // Proceso completo (7 etapas)
import { Tools } from "@/pages/Tools";
import NotFound from "@/pages/not-found";

/**
 * ClientWorkspace: Wrapper que asegura que hay un cliente seleccionado
 */
function ClientWorkspace({ children }: { children: React.ReactNode }) {
  const { client } = useClient();

  if (!client) {
    return <Redirect to="/" />;
  }

  return (
    <ClientWorkspaceLayout>
      {children}
    </ClientWorkspaceLayout>
  );
}

/**
 * AppRoutes: Sistema de rutas V4 - PROCESO LEGAL COMO COLUMNA VERTEBRAL
 * 
 * Filosofía V4:
 * 1. Cliente → DashboardGlobal (vista panorámica del caso)
 * 2. /proceso → LegalProcessV2 (7 etapas - COLUMNA VERTEBRAL)
 * 3. /tools → Herramientas de análisis contextuales
 */
function AppRoutes() {
  return (
    <Switch>
      {/* Root: Client Selector */}
      <Route path="/" component={ClientSelector} />

      {/* Dashboard Global - Vista panorámica del caso */}
      <Route path="/client/:clientId">
        {(params) => (
          <ClientWorkspace>
            <DashboardGlobal clientId={params.clientId} />
          </ClientWorkspace>
        )}
      </Route>

      {/* Proceso Legal - COLUMNA VERTEBRAL (7 etapas del proceso) */}
      <Route path="/client/:clientId/proceso">
        {(params) => (
          <ClientWorkspace>
            <LegalProcessV2 />
          </ClientWorkspace>
        )}
      </Route>

      {/* Herramientas de Análisis - Contextuales al proceso */}
      <Route path="/client/:clientId/tools">
        {(params) => (
          <ClientWorkspace>
            <Tools clientId={params.clientId} />
          </ClientWorkspace>
        )}
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * AuthenticatedApp: Verifica autenticación
 */
function AuthenticatedApp() {
  const { data: user, isLoading } = useAuthQuery();
  const logoutMutation = useLogoutMutation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="w-full max-w-md p-6">
          <LoginForm />
        </div>
      </div>
    );
  }

  return <AppRoutes />;
}

/**
 * App: Punto de entrada principal
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClientProvider>
        <TooltipProvider>
          <AuthenticatedApp />
          <FloatingChatBot />
          <AppToaster />
        </TooltipProvider>
      </ClientProvider>
    </QueryClientProvider>
  );
}

export default App;
