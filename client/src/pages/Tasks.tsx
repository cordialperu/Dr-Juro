import { useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { useTasksQuery, useCreateTaskMutation, useUpdateTaskMutation } from '@/hooks/useTasks';
import { useCasesQuery } from '@/hooks/useCases';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, CheckSquare, Calendar, Clock, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface TasksProps {
  clientId: string;
}

export function Tasks({ clientId }: TasksProps) {
  const { client, getPendingTasks } = useClient();
  const { data: tasks = [], isLoading } = useTasksQuery();
  const { data: cases = [] } = useCasesQuery();
  const { toast } = useToast();
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed',
    dueDate: '',
    caseId: '',
  });

  const createTaskMutation = useCreateTaskMutation();
  const updateTaskStatusMutation = useUpdateTaskMutation();

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  });

  const tasksByStatus = {
    pending: filteredTasks.filter(t => t.status === 'pending'),
    inProgress: filteredTasks.filter(t => t.status === 'in-progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
  };

  const handleCreateTask = () => {
    if (!newTaskForm.title.trim()) {
      toast({ title: 'El título es requerido', variant: 'destructive' });
      return;
    }
    createTaskMutation.mutate(
      {
        title: newTaskForm.title,
        description: newTaskForm.description || null,
        status: newTaskForm.status,
        dueDate: newTaskForm.dueDate || null,
        caseId: newTaskForm.caseId || null,
      },
      {
        onSuccess: () => {
          toast({ title: 'Tarea creada exitosamente' });
          setIsNewTaskDialogOpen(false);
          setNewTaskForm({ title: '', description: '', status: 'pending', dueDate: '', caseId: '' });
        },
        onError: () => {
          toast({ title: 'Error al crear tarea', variant: 'destructive' });
        },
      }
    );
  };

  const handleToggleTaskStatus = (taskId: string, currentStatus: string) => {
    const nextStatus = 
      currentStatus === 'pending' ? 'in-progress' :
      currentStatus === 'in-progress' ? 'completed' :
      'pending';
    
    updateTaskStatusMutation.mutate(
      { id: taskId, data: { status: nextStatus as any } },
      {
        onSuccess: () => {
          toast({ title: 'Tarea actualizada' });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tareas</h1>
          <p className="text-muted-foreground">
            Gestiona las tareas de {client?.name}
          </p>
        </div>
        
        <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Tarea</DialogTitle>
              <DialogDescription>
                Agrega una tarea para {client?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="task-title">Título *</Label>
                <Input
                  id="task-title"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  placeholder="Ej: Revisar documentos del caso"
                />
              </div>
              <div>
                <Label htmlFor="task-description">Descripción</Label>
                <Textarea
                  id="task-description"
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  placeholder="Detalles adicionales..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="task-case">Caso Relacionado</Label>
                <Select
                  value={newTaskForm.caseId}
                  onValueChange={(value) => setNewTaskForm({ ...newTaskForm, caseId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un caso (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ninguno</SelectItem>
                    {cases.map(caseItem => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-dueDate">Fecha de Vencimiento</Label>
                <Input
                  id="task-dueDate"
                  type="date"
                  value={newTaskForm.dueDate}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewTaskDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? 'Creando...' : 'Crear Tarea'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
        <TabsList>
          <TabsTrigger value="all">
            Todas ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes ({tasksByStatus.pending.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            En Progreso ({tasksByStatus.inProgress.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completadas ({tasksByStatus.completed.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tasks List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay tareas</h3>
            <p className="text-muted-foreground text-center mb-6">
              {filterStatus === 'all' 
                ? 'Crea tu primera tarea para comenzar' 
                : `No hay tareas ${filterStatus === 'pending' ? 'pendientes' : filterStatus === 'in-progress' ? 'en progreso' : 'completadas'}`}
            </p>
            {filterStatus === 'all' && (
              <Button onClick={() => setIsNewTaskDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Tarea
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggleTaskStatus(task.id, task.status)}
                    className="mt-1 flex-shrink-0"
                    disabled={updateTaskStatusMutation.isPending}
                  >
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.status === 'completed' 
                        ? 'bg-green-500 border-green-500' 
                        : task.status === 'in-progress'
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300 hover:border-primary'
                    }`}>
                      {task.status === 'completed' && (
                        <CheckSquare className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h4>
                      <Badge variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'in-progress' ? 'secondary' :
                        'outline'
                      } className="flex-shrink-0">
                        {task.status === 'pending' ? 'Pendiente' :
                         task.status === 'in-progress' ? 'En Progreso' :
                         'Completada'}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Vence {formatDistanceToNow(new Date(task.dueDate), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                        </div>
                      )}
                      {task.caseId && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Vinculada a caso</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
