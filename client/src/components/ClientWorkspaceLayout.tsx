import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  User,
  Briefcase,
  FileText,
  CheckSquare,
  LayoutDashboard,
  ChevronRight
} from 'lucide-react';
import { useClient } from '@/contexts/ClientContext';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalysisToolbar } from './AnalysisToolbar';
import { getClientColor } from '@/lib/clientColors';

interface ClientWorkspaceLayoutProps {
  children: ReactNode;
}

export function ClientWorkspaceLayout({ children }: ClientWorkspaceLayoutProps) {
  const { client, clearClient, workspace, isLoadingWorkspace } = useClient();
  const [location, navigate] = useLocation();

  if (!client) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (path: string) => location.includes(path);

  const navItems = [
    {
      path: `/client/${client.id}`,
      label: 'Vista General',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      path: `/client/${client.id}/cases`,
      label: 'Expedientes',
      icon: Briefcase,
      count: workspace?.casesCount,
    },
    {
      path: `/client/${client.id}/tasks`,
      label: 'Tareas',
      icon: CheckSquare,
      count: workspace?.tasksCount,
    },
    {
      path: `/client/${client.id}/documents`,
      label: 'Documentos',
      icon: FileText,
      count: workspace?.documentsCount,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header del Cliente */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Info del Cliente */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearClient}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Cambiar Cliente</span>
              </Button>

              <div className="h-8 w-px bg-border" />

              {(() => {
                const clientColor = getClientColor(client.id);
                return (
                  <>
                    <Avatar className="h-12 w-12 border-2" style={{ borderColor: clientColor.primary }}>
                      <AvatarFallback className="font-bold text-lg" style={{ backgroundColor: clientColor.light, color: clientColor.dark }}>
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold">{client.name}</h1>
                        <Badge variant="secondary" className="hidden sm:flex" style={{ backgroundColor: clientColor.light, color: clientColor.dark, borderColor: clientColor.primary }}>
                          <User className="h-3 w-3 mr-1" />
                          Cliente Activo
                        </Badge>
                      </div>
                      {client.email && (
                        <p className="text-sm text-muted-foreground hidden md:block">
                          {client.email}
                        </p>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Stats Rápidos */}
            {!isLoadingWorkspace && workspace && (
              <div className="hidden lg:flex items-center gap-4">
                <div className="text-center px-4 py-2 rounded-lg bg-primary/10">
                  <div className="text-2xl font-bold text-primary">
                    {workspace.casesCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Expedientes</div>
                </div>
                <div className="text-center px-4 py-2 rounded-lg bg-blue-500/10">
                  <div className="text-2xl font-bold text-blue-600">
                    {workspace.tasksCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Tareas</div>
                </div>
              </div>
            )}
          </div>

          {/* Navegación del Workspace */}
          <nav className="flex gap-1 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.exact 
                ? location === item.path
                : isActive(item.path);

              return (
                <Button
                  key={item.path}
                  variant={active ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className="gap-2 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.count !== undefined && item.count > 0 && (
                    <Badge variant={active ? "secondary" : "outline"} className="ml-1">
                      {item.count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Contenido */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Toolbar flotante de Análisis */}
      <AnalysisToolbar />
    </div>
  );
}
