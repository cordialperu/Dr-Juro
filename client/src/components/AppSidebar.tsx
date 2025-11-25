import { useState } from "react"
import { useLocation } from "wouter"
import {
  Calendar,
  FileText,
  Folder,
  Gavel,
  Home,
  Scale,
  Search,
  Settings,
  Users,
  Clock,
  CreditCard,
  Shield,
  Brain,
  ClipboardList,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { ClientSwitcher } from "./ClientSwitcher"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type MenuItem = {
  title: string;
  url: string;
  icon: any;
  active: boolean;
  disabled?: boolean;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
};

type MenuCategory = {
  label: string;
  items: MenuItem[];
};

const menuCategories: MenuCategory[] = [
  {
    label: "Gestión",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Home,
        active: true,
      },
      {
        title: "Clientes",
        url: "/clients",
        icon: Users,
        active: true,
      },
      {
        title: "Expedientes",
        url: "/expedientes",
        icon: Folder,
        active: true,
      },
      {
        title: "Procesos",
        url: "/procesos",
        icon: ClipboardList,
        active: true,
      },
      {
        title: "Tareas",
        url: "/tasks",
        icon: Clock,
        active: true,
      },
    ],
  },
  {
    label: "Investigación",
    items: [
      {
        title: "Jurisprudencia",
        url: "/jurisprudencia",
        icon: Scale,
        active: true,
      },
      {
        title: "Doctrina",
        url: "/doctrina",
        icon: FolderOpen,
        active: true,
      },
      {
        title: "Meta Buscador",
        url: "/metabuscador",
        icon: Search,
        active: true,
        badge: "IA",
        badgeVariant: "secondary",
      },
      {
        title: "Análisis de Documentos",
        url: "/documentos",
        icon: Brain,
        active: true,
        badge: "IA",
        badgeVariant: "secondary",
      },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["Gestión", "Investigación"]))

  const toggleCategory = (label: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  return (
    <Sidebar data-testid="sidebar-main" className="border-r">
      <SidebarHeader className="p-4 border-b space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Gavel className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">Dr. Juro</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Asistente Legal IA
            </span>
          </div>
        </div>
        
        {/* Client Switcher */}
        <div className="pt-2">
          <ClientSwitcher />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4">
        {menuCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.label)
          return (
            <SidebarGroup key={category.label} className="mb-4">
              <button
                onClick={() => toggleCategory(category.label)}
                className="flex items-center justify-between w-full px-3 py-2 hover:bg-accent rounded-md transition-colors"
              >
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.label}
                </SidebarGroupLabel>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              
              {isExpanded && (
                <SidebarGroupContent className="mt-2">
                  <SidebarMenu>
                    {category.items.map((item) => {
                      const isActive = location === item.url
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild={!item.disabled}
                            data-active={isActive}
                            data-testid={`nav-${item.title.toLowerCase().replace(/ /g, '-')}`}
                            disabled={item.disabled}
                            className={`
                              relative group
                              ${isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'}
                              ${item.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                              transition-all duration-200
                            `}
                          >
                            {item.disabled ? (
                              <span className="flex items-center gap-3 w-full py-2">
                                <item.icon className="h-4 w-4" />
                                <span className="flex-1">{item.title}</span>
                                {item.badge && (
                                  <Badge variant={item.badgeVariant || "secondary"} className="text-[10px] px-1.5 py-0">
                                    {item.badge}
                                  </Badge>
                                )}
                              </span>
                            ) : (
                              <a href={item.url} className="flex items-center gap-3 w-full py-2">
                                <item.icon className="h-4 w-4" />
                                <span className="flex-1">{item.title}</span>
                                {item.badge && (
                                  <Badge variant={item.badgeVariant || "secondary"} className="text-[10px] px-1.5 py-0">
                                    {item.badge}
                                  </Badge>
                                )}
                                {isActive && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r" />
                                )}
                              </a>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t">
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" className="w-full justify-start" asChild>
            <a href="/settings">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </a>
          </Button>
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Conectado</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}