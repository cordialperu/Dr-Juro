import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useTasksQuery, useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation, type TaskPayload, type TaskStatus, type TaskPriority } from "@/hooks/useTasks";
import { useCasesQuery } from "@/hooks/useCases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Pencil, Trash2 } from "lucide-react";
import type { Task } from "@shared/schema";

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En progreso" },
  { value: "completed", label: "Completada" },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
];

const CASE_NONE_VALUE = "__none__";

type BadgeVariant = "default" | "destructive" | "outline" | "secondary";

const statusBadgeVariant: Record<TaskStatus, BadgeVariant> = {
  pending: "secondary",
  in_progress: "outline",
  completed: "default",
};

const priorityBadgeVariant: Record<TaskPriority, BadgeVariant> = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
};

const toDateInputValue = (value: Date | string | null | undefined) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd");
};

const formatRelativeDate = (value: string | Date | null) => {
  if (!value) return "Sin fecha";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return format(date, "dd/MM/yyyy");
};

type TaskDialogState = {
  open: boolean;
  mode: "create" | "edit";
  task?: Task;
};

export function TasksPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [caseFilter, setCaseFilter] = useState<string | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogState, setDialogState] = useState<TaskDialogState>({ open: false, mode: "create" });

  const queryParams = useMemo(() => {
    return {
      status: statusFilter === "all" ? undefined : statusFilter,
      caseId: caseFilter === "all" ? undefined : caseFilter,
      search: searchTerm.trim() || undefined,
    };
  }, [statusFilter, caseFilter, searchTerm]);

  const { data: tasks = [], isLoading: isLoadingTasks, error: tasksError } = useTasksQuery(queryParams);
  const { data: cases = [] } = useCasesQuery();

  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  const handleOpenCreate = () => {
    setDialogState({ open: true, mode: "create" });
  };

  const handleOpenEdit = (task: Task) => {
    setDialogState({ open: true, mode: "edit", task });
  };

  const handleCloseDialog = () => {
    setDialogState({ open: false, mode: "create", task: undefined });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawCaseId = formData.get("caseId");
    const normalizedCaseId = typeof rawCaseId === "string" && rawCaseId !== CASE_NONE_VALUE ? rawCaseId : null;

    const payload: TaskPayload = {
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      status: (formData.get("status") as TaskStatus) ?? undefined,
      priority: (formData.get("priority") as TaskPriority) ?? undefined,
      dueDate: formData.get("dueDate") ? String(formData.get("dueDate")) : null,
      caseId: normalizedCaseId,
      assignedTo: null,
    };

    try {
      if (!payload.title) {
        toast({ description: "El título es obligatorio.", variant: "destructive" });
        return;
      }

      if (dialogState.mode === "create") {
        await createTaskMutation.mutateAsync(payload);
        toast({ description: "Tarea creada." });
      } else if (dialogState.task) {
        await updateTaskMutation.mutateAsync({ id: dialogState.task.id, data: payload });
        toast({ description: "Tarea actualizada." });
      }

      handleCloseDialog();
    } catch (error) {
      if (error instanceof Error) {
        toast({ description: error.message, variant: "destructive" });
      }
    }
  };

  const handleDelete = async (task: Task) => {
    const confirmed = window.confirm(`¿Eliminar la tarea "${task.title}"?`);
    if (!confirmed) return;
    try {
      await deleteTaskMutation.mutateAsync(task.id);
      toast({ description: "Tarea eliminada." });
    } catch (error) {
      if (error instanceof Error) {
        toast({ description: error.message, variant: "destructive" });
      }
    }
  };

  if (tasksError) {
    return <div className="p-6 text-red-500">No se pudieron cargar las tareas: {tasksError.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tareas</h1>
          <p className="text-muted-foreground">Organiza actividades pendientes y vincúlalas a expedientes.</p>
        </div>
        <Dialog open={dialogState.open} onOpenChange={(open) => (open ? handleOpenCreate() : handleCloseDialog())}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <PlusCircle className="mr-2 h-4 w-4" /> Nueva tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogState.mode === "create" ? "Registrar tarea" : "Editar tarea"}</DialogTitle>
              <DialogDescription>Completa la información para gestionar la tarea seleccionada.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" defaultValue={dialogState.task?.title ?? ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" name="description" defaultValue={dialogState.task?.description ?? ""} rows={3} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select name="status" defaultValue={dialogState.task?.status ?? "pending"}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select name="priority" defaultValue={dialogState.task?.priority ?? "medium"}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fecha límite</Label>
                  <Input id="dueDate" name="dueDate" type="date" defaultValue={toDateInputValue(dialogState.task?.dueDate ?? null)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caseId">Expediente relacionado</Label>
                  <Select name="caseId" defaultValue={dialogState.task?.caseId ?? CASE_NONE_VALUE}>
                    <SelectTrigger id="caseId">
                      <SelectValue placeholder="Selecciona expediente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CASE_NONE_VALUE}>Sin expediente</SelectItem>
                      {cases.map((caseItem) => (
                        <SelectItem key={caseItem.id} value={caseItem.id}>
                          {caseItem.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTaskMutation.isPending || updateTaskMutation.isPending}>
                  {dialogState.mode === "create" ? "Crear tarea" : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | "all") }>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Expediente</Label>
            <Select value={caseFilter} onValueChange={(value) => setCaseFilter(value as string | "all") }>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por expediente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {cases.map((caseItem) => (
                  <SelectItem key={caseItem.id} value={caseItem.id}>
                    {caseItem.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="search">Búsqueda</Label>
            <Input
              id="search"
              placeholder="Buscar por título o descripción"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tareas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTasks ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando tareas…</span>
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se encontraron tareas con los filtros aplicados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Expediente</TableHead>
                  <TableHead>Fecha límite</TableHead>
                  <TableHead className="w-[140px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const caseName = task.caseId ? cases.find((item) => item.id === task.caseId)?.title ?? "Sin expediente" : "Sin expediente";
                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="font-medium">{task.title}</div>
                        {task.description && <div className="text-sm text-muted-foreground">{task.description}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[task.status]}>{statusOptions.find((option) => option.value === task.status)?.label ?? task.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityBadgeVariant[task.priority]}>{priorityOptions.find((option) => option.value === task.priority)?.label ?? task.priority}</Badge>
                      </TableCell>
                      <TableCell>{caseName}</TableCell>
                      <TableCell>{formatRelativeDate(task.dueDate ?? null)}</TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button size="icon" variant="outline" onClick={() => handleOpenEdit(task)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(task)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
