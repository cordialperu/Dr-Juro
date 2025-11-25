import { useLocation } from "wouter"
import { Home, Users, Folder, Clock, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/clients", icon: Users, label: "Clientes" },
  { href: "/expedientes", icon: Folder, label: "Casos" },
  { href: "/tasks", icon: Clock, label: "Tareas" },
  { href: "/metabuscador", icon: Search, label: "Buscar" },
]

export function MobileBottomNav() {
  const [location] = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 border-t border-border backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location === item.href
          
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[64px]",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
