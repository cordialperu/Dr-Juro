import { useState, useEffect, useCallback } from "react"
import { useLocation } from "wouter"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { 
  Users, 
  Folder, 
  Scale, 
  FileText, 
  Clock, 
  Search,
  Home,
  Brain,
  Calendar,
  TrendingUp,
  Settings,
  ClipboardList,
  FolderOpen,
  Command as CommandIcon,
} from "lucide-react"
import { useClientsQuery } from "@/hooks/useClients"
import { useCasesQuery } from "@/hooks/useCases"
import { useTasksQuery } from "@/hooks/useTasks"

type CommandItemType = {
  id: string
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  category: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [, navigate] = useLocation()

  const { data: clientsResponse = [] } = useClientsQuery()
  const clientsData = Array.isArray(clientsResponse) ? clientsResponse : []
  
  const { data: casesData = [] } = useCasesQuery()
  const { data: tasksData = [] } = useTasksQuery()

  // Keyboard shortcut handler (Cmd/Ctrl + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = useCallback((href: string) => {
    setOpen(false)
    navigate(href)
  }, [navigate])

  // Build navigation items
  const navigationItems: CommandItemType[] = [
    {
      id: "nav-dashboard",
      title: "Dashboard",
      description: "Panel principal de la aplicación",
      icon: Home,
      href: "/",
      category: "Navegación",
    },
    {
      id: "nav-clients",
      title: "Clientes",
      description: "Gestión de clientes",
      icon: Users,
      href: "/clients",
      category: "Navegación",
    },
    {
      id: "nav-cases",
      title: "Expedientes",
      description: "Gestión de expedientes",
      icon: Folder,
      href: "/expedientes",
      category: "Navegación",
    },
    {
      id: "nav-processes",
      title: "Procesos",
      description: "Gestión de procesos",
      icon: ClipboardList,
      href: "/procesos",
      category: "Navegación",
    },
    {
      id: "nav-tasks",
      title: "Tareas",
      description: "Gestión de tareas",
      icon: Clock,
      href: "/tasks",
      category: "Navegación",
    },
    {
      id: "nav-jurisprudence",
      title: "Jurisprudencia",
      description: "Búsqueda de jurisprudencia",
      icon: Scale,
      href: "/jurisprudencia",
      category: "Investigación",
    },
    {
      id: "nav-doctrine",
      title: "Doctrina",
      description: "Biblioteca de doctrina legal",
      icon: FolderOpen,
      href: "/doctrina",
      category: "Investigación",
    },
    {
      id: "nav-metasearch",
      title: "Meta Buscador",
      description: "Búsqueda inteligente con IA",
      icon: Search,
      href: "/metabuscador",
      category: "Investigación",
    },
    {
      id: "nav-documents",
      title: "Análisis de Documentos",
      description: "Análisis de documentos con IA",
      icon: Brain,
      href: "/documentos",
      category: "Herramientas",
    },
    {
      id: "nav-settings",
      title: "Configuración",
      description: "Configuración de la aplicación",
      icon: Settings,
      href: "/settings",
      category: "Sistema",
    },
  ]

  // Build client items
  const clientItems: CommandItemType[] = clientsData.slice(0, 10).map((client: any) => ({
    id: `client-${client.id}`,
    title: client.name,
    description: client.email || "Cliente",
    icon: Users,
    href: `/clients/${client.id}`,
    category: "Clientes",
  }))

  // Build case items
  const caseItems: CommandItemType[] = casesData.slice(0, 10).map((caseItem: any) => ({
    id: `case-${caseItem.id}`,
    title: caseItem.title,
    description: caseItem.description || "Expediente",
    icon: Folder,
    href: `/cases/${caseItem.id}`,
    category: "Expedientes",
  }))

  // Build task items
  const taskItems: CommandItemType[] = tasksData.slice(0, 10).map((task: any) => ({
    id: `task-${task.id}`,
    title: task.title,
    description: task.description || "Tarea",
    icon: Clock,
    href: `/tasks`,
    category: "Tareas",
  }))

  // Combine all items
  const allItems = [...navigationItems, ...clientItems, ...caseItems, ...taskItems]

  // Group items by category
  const categories = ["Navegación", "Investigación", "Herramientas", "Clientes", "Expedientes", "Tareas", "Sistema"]
  
  const groupedItems = categories.map(category => ({
    category,
    items: allItems.filter(item => item.category === category)
  })).filter(group => group.items.length > 0)

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas, clientes, expedientes... (Ctrl+K)" />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
        
        {groupedItems.map((group, index) => (
          <div key={group.category}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group.category}>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.description || ""}`}
                    onSelect={() => handleSelect(item.href)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
