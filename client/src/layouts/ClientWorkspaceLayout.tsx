import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useClient } from '@/contexts/ClientContext';
import { useClientTheme } from '@/hooks/useClientTheme';
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  FileText, 
  Sparkles,
  ChevronDown,
  Bell,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { getClientColor } from '@/lib/clientColors';
import { ClientSwitcher } from '@/components/ClientSwitcher';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface ClientWorkspaceLayoutProps {
  children: ReactNode;
}

export function ClientWorkspaceLayout({ children }: ClientWorkspaceLayoutProps) {
  const { client, clearClient } = useClient();
  const [location] = useLocation();
  
  // Aplicar tema del cliente
  useClientTheme();

  if (!client) {
    return null;
  }

  // V4: Navegación simplificada - Dashboard Global + Proceso + Tools
  const tabs: Tab[] = [
    {
      id: 'dashboard',
      label: 'Vista Global',
      icon: LayoutDashboard,
      path: `/client/${client.id}`,
    },
    {
      id: 'proceso',
      label: 'Proceso Legal',
      icon: FolderOpen,
      path: `/client/${client.id}/proceso`,
    },
    {
      id: 'tools',
      label: 'Herramientas',
      icon: Sparkles,
      path: `/client/${client.id}/tools`,
    },
  ];

  const activeTab = tabs.find(tab => location === tab.path) || tabs[0];

  const handleLogout = () => {
    clearClient();
    window.location.href = '/';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const clientColor = getClientColor(client.id);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: clientColor.primary }}
                >
                  <span className="text-white font-bold text-sm">DJ</span>
                </div>
                <span className="font-semibold text-lg hidden sm:inline" style={{ color: clientColor.dark }}>Dr. Juro</span>
              </div>
            </Link>
          </div>

          {/* Client Dropdown */}
          <div className="w-56">
            <ClientSwitcher />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Herramientas Quick Access */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hidden sm:flex"
            >
              <Link href={`/client/${client.id}/tools`}>
                <Sparkles className="h-5 w-5" />
                <span className="sr-only">Herramientas de Análisis</span>
              </Link>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notificaciones</span>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <UserIcon className="h-5 w-5" />
                  <span className="sr-only">Usuario</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-t">
          <div className="container px-4">
            <nav className="flex items-center gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = location === tab.path;
                
                return (
                  <Link key={tab.id} href={tab.path}>
                    <button
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2",
                        isActive
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container px-4 py-6">
          {children}
        </div>
      </main>

      {/* Footer (optional) */}
      <footer className="border-t py-4">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Dr. Juro. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
