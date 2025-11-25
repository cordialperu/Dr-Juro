import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  Clock,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScheduledReminder {
  id: string;
  caseId: string;
  clientId: string;
  templateId: string | null;
  reminderType: string;
  title: string;
  description: string | null;
  scheduledFor: string;
  channel: string;
  recurrence: string | null;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AlertsPanelProps {
  caseId: string;
  clientId: string;
}

const REMINDER_TYPES = [
  { value: "hearing", label: "Audiencia" },
  { value: "deadline", label: "Plazo" },
  { value: "meeting", label: "Reunión" },
  { value: "document_request", label: "Solicitud de documento" },
  { value: "follow_up", label: "Seguimiento" },
];

const CHANNELS = [
  { value: "email", label: "Email", icon: Mail },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "sms", label: "SMS", icon: Smartphone },
  { value: "all", label: "Todos", icon: Bell },
];

const RECURRENCES = [
  { value: "once", label: "Una vez" },
  { value: "daily", label: "Diario" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
];

export default function AlertsPanel({ caseId, clientId }: AlertsPanelProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    reminderType: "hearing",
    title: "",
    description: "",
    scheduledFor: "",
    channel: "whatsapp",
    recurrence: "once",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch upcoming reminders (next 7 days)
  const { data: upcomingReminders = [], isLoading } = useQuery<ScheduledReminder[]>({
    queryKey: ["/api/cases", caseId, "reminders", "upcoming"],
  });

  // Fetch reminder count for badge
  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/cases", caseId, "reminders", "count"],
  });

  // Create reminder mutation
  const createReminderMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/cases/${caseId}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          clientId,
        }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create reminder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "reminders"] });
      toast({
        title: "Recordatorio creado",
        description: "El recordatorio se ha programado correctamente.",
      });
      setCreateDialogOpen(false);
      setFormData({
        reminderType: "hearing",
        title: "",
        description: "",
        scheduledFor: "",
        channel: "whatsapp",
        recurrence: "once",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el recordatorio.",
        variant: "destructive",
      });
    },
  });

  // Snooze reminder mutation
  const snoozeMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      const response = await fetch(`/api/reminders/${reminderId}/snooze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 1 }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to snooze reminder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "reminders"] });
      toast({
        title: "Recordatorio pospuesto",
        description: "Se ha reprogramado para mañana.",
      });
    },
  });

  // Complete reminder mutation
  const completeMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      const response = await fetch(`/api/reminders/${reminderId}/complete`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to complete reminder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "reminders"] });
      toast({
        title: "Recordatorio completado",
        description: "Se ha marcado como enviado.",
      });
    },
  });

  // Cancel reminder mutation
  const cancelMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to cancel reminder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "reminders"] });
      toast({
        title: "Recordatorio cancelado",
        description: "Se ha cancelado correctamente.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.scheduledFor) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }
    createReminderMutation.mutate(formData);
  };

  const getChannelIcon = (channel: string) => {
    const channelData = CHANNELS.find((c) => c.value === channel);
    return channelData?.icon || Bell;
  };

  const getReminderTypeLabel = (type: string) => {
    return REMINDER_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getChannelLabel = (channel: string) => {
    return CHANNELS.find((c) => c.value === channel)?.label || channel;
  };

  const isUrgent = (scheduledFor: string) => {
    const now = Date.now();
    const scheduled = new Date(scheduledFor).getTime();
    const hoursUntil = (scheduled - now) / (1000 * 60 * 60);
    return hoursUntil < 24 && hoursUntil > 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with badge and create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Alertas y Recordatorios</h3>
          {countData && countData.count > 0 && (
            <Badge variant="default" className="bg-orange-500">
              {countData.count} próximos
            </Badge>
          )}
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo recordatorio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Recordatorio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reminderType">Tipo de recordatorio</Label>
                <Select
                  value={formData.reminderType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, reminderType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Audiencia en Sala Civil"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detalles adicionales..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledFor">Fecha y hora *</Label>
                <Input
                  id="scheduledFor"
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledFor: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel">Canal de notificación</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(value) => setFormData({ ...formData, channel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((channel) => (
                      <SelectItem key={channel.value} value={channel.value}>
                        {channel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurrence">Recurrencia</Label>
                <Select
                  value={formData.recurrence}
                  onValueChange={(value) =>
                    setFormData({ ...formData, recurrence: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCES.map((rec) => (
                      <SelectItem key={rec.value} value={rec.value}>
                        {rec.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createReminderMutation.isPending}>
                  {createReminderMutation.isPending ? "Creando..." : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reminders list */}
      {upcomingReminders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No hay recordatorios próximos</p>
            <p className="text-sm text-muted-foreground mt-2">
              Los recordatorios de los próximos 7 días aparecerán aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {upcomingReminders.map((reminder) => {
              const ChannelIcon = getChannelIcon(reminder.channel);
              const urgent = isUrgent(reminder.scheduledFor);

              return (
                <Card
                  key={reminder.id}
                  className={urgent ? "border-orange-500 dark:border-orange-700" : ""}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`p-2 rounded-lg ${
                            urgent
                              ? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"
                              : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                          }`}
                        >
                          <ChannelIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-medium flex items-center gap-2">
                            {reminder.title}
                            {urgent && (
                              <Badge variant="destructive" className="text-xs">
                                Urgente
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">
                              {getReminderTypeLabel(reminder.reminderType)}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(reminder.scheduledFor), "PPp", { locale: es })}
                            </span>
                            <span className="flex items-center gap-1">
                              <ChannelIcon className="h-3 w-3" />
                              {getChannelLabel(reminder.channel)}
                            </span>
                          </div>
                          {reminder.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {reminder.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => snoozeMutation.mutate(reminder.id)}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Posponer (1 día)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => completeMutation.mutate(reminder.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Marcar completado
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => cancelMutation.mutate(reminder.id)}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
