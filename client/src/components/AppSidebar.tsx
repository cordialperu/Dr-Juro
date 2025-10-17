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
  ClipboardList
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
  // ACTIVOS - Funcionalidad principal
  {
    title: "Clientes",
    url: "/clients",
    icon: Users,
    active: true,
  },
  {
    title: "Procesos",
    url: "/procesos",
    icon: ClipboardList,
    active: true,
  },
  {
    title: "Meta Buscador",
    url: "/metabuscador",
    icon: Search,
    active: true,
  },
  
  // DESHABILITADOS - En desarrollo
  {
    title: "Panel Principal",
    url: "#",
    icon: Home,
    disabled: true,
  },
  {
    title: "Expedientes",
    url: "#",
    icon: Folder,
    disabled: true,
  },
  {
    title: "Jurisprudencia",
    url: "#",
    icon: Scale,
    disabled: true,
  },
  {
    title: "Análisis de Documentos",
    url: "#",
    icon: Brain,
    disabled: true,
  },
  {
    title: "Doctrina",
    url: "#",
    icon: FileText,
    disabled: true,
  },
  {
    title: "Tareas",
    url: "#",
    icon: Clock,
    disabled: true,
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
                    asChild={!item.disabled}
                    data-active={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/ /g, '-')}`}
                    disabled={item.disabled}
                    className={item.disabled ? "opacity-40 cursor-not-allowed" : ""}
                  >
                    {item.disabled ? (
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                    ) : (
                      <a href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    )}
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