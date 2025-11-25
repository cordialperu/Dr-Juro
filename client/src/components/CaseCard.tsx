import { useLocation } from "wouter"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, User, Clock, MoreHorizontal } from "lucide-react"
import { getClientColor } from "@/lib/clientColors"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface CaseCardProps {
  id: string
  title: string
  client: string
  clientId?: string
  status: "active" | "pending" | "closed" | "review"
  priority: "high" | "medium" | "low"
  caseNumber: string
  court: string
  nextHearing?: string
  lastActivity: string
  documentsCount: number
  precedentsFound?: number
}

const statusLabels = {
  active: "Activo",
  pending: "Pendiente",
  closed: "Cerrado",
  review: "En Revisión"
}

const statusColors = {
  active: "bg-green-500",
  pending: "bg-yellow-500",
  closed: "bg-gray-500",
  review: "bg-blue-500"
}

const priorityLabels = {
  high: "Alta",
  medium: "Media",
  low: "Baja"
}

export function CaseCard({
  id,
  title,
  client,
  clientId,
  status,
  priority,
  caseNumber,
  court,
  nextHearing,
  lastActivity,
  documentsCount,
  precedentsFound
}: CaseCardProps) {
  const [, navigate] = useLocation();
  const handleOpen = () => navigate(`/cases/${id}`);
  const clientColor = clientId ? getClientColor(clientId) : null;

  return (
    <Card
      className="hover-elevate cursor-pointer"
      data-testid={`case-card-${id}`}
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          handleOpen()
        }
      }}
      style={clientColor ? {
        borderLeftWidth: '4px',
        borderLeftColor: clientColor.primary,
        borderLeftStyle: 'solid'
      } : {}}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-card-foreground leading-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">{caseNumber}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid={`case-menu-${id}`}
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                data-testid={`case-view-${id}`}
                onSelect={(event) => {
                  event.preventDefault();
                  handleOpen();
                }}
              >
                Ver expediente
              </DropdownMenuItem>
              <DropdownMenuItem data-testid={`case-edit-${id}`}>Editar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid={`case-archive-${id}`}>Archivar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
            <span className="text-sm text-muted-foreground">{statusLabels[status]}</span>
          </div>
          <Badge 
            variant="outline"
            className="text-xs"
            style={clientColor ? {
              backgroundColor: clientColor.light,
              color: clientColor.dark,
              borderColor: clientColor.primary
            } : {}}
          >
            {priorityLabels[priority]}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Cliente:</span>
            <span className="text-card-foreground">{client}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Tribunal:</span>
            <span className="text-card-foreground">{court}</span>
          </div>
          
          {nextHearing && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Próxima audiencia:</span>
              <span className="text-card-foreground">{nextHearing}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Última actividad:</span>
            <span className="text-card-foreground">{lastActivity}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{documentsCount} documentos</span>
            {precedentsFound && <span>{precedentsFound} precedentes</span>}
          </div>
          <Button
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              handleOpen();
            }}
            style={clientColor ? {
              backgroundColor: clientColor.primary,
              color: 'white'
            } : {}}
          >
            Abrir Expediente
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}