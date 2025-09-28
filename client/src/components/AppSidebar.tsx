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
  Shield
} from "lucide-react"
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
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

const menuItems = [
  {
    title: "Panel Principal",
    url: "/",
    icon: Home,
  },
  {
    title: "Expedientes",
    url: "/cases",
    icon: Folder,
    badge: "12"
  },
  {
    title: "Jurisprudencia",
    url: "/jurisprudence",
    icon: Scale,
  },
  {
    title: "Doctrina",
    url: "/doctrine",
    icon: FileText,
  },
  {
    title: "Búsqueda Avanzada",
    url: "/search",
    icon: Search,
  },
  {
    title: "Calendario",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Tareas",
    url: "/tasks",
    icon: Clock,
    badge: "5"
  },
  {
    title: "Clientes",
    url: "/clients",
    icon: Users,
  },
  {
    title: "Facturación",
    url: "/billing",
    icon: CreditCard,
  },
  {
    title: "Configuración",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Auditoría",
    url: "/audit",
    icon: Shield,
  },
]

export function AppSidebar() {
  const [location] = useLocation()

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Gavel className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-sidebar-foreground">Dr. Juro</span>
            <span className="text-sm text-muted-foreground">Asistente Legal</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    data-active={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/ /g, '-')}`}
                  >
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}