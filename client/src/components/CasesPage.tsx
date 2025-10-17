import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCasesQuery, useCreateCaseMutation } from '@/hooks/useCases';
import { useClientsQuery } from '@/hooks/useClients';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { insertCaseSchema } from '@shared/schema';

export function CasesPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: cases = [], isLoading: isLoadingCases, error: casesError } = useCasesQuery();
  const { data: clients = [], isLoading: isLoadingClients, error: clientsError } = useClientsQuery();

  const addCaseMutation = useCreateCaseMutation();

  const caseFormSchema = insertCaseSchema.pick({
    title: true,
    description: true,
    clientId: true,
  }).extend({
    title: insertCaseSchema.shape.title.min(1, 'Ingresa el título del expediente'),
    clientId: insertCaseSchema.shape.clientId ?? z.string().min(1, 'Selecciona un cliente'),
    description: insertCaseSchema.shape.description?.optional() ?? z.string().optional(),
  });

  type CaseFormValues = z.infer<typeof caseFormSchema>;

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      title: '',
      description: '',
      clientId: '',
    },
  });

  const handleSuccess = (newCase: any) => {
    form.reset();
    setIsDialogOpen(false);
    toast({
      title: 'Expediente creado',
      description: 'El nuevo expediente ha sido registrado exitosamente.',
    });
    // Redirigir al proceso con el caseId
    if (newCase?.id) {
      navigate(`/process/${newCase.id}`);
    }
  };

  const handleError = (err: Error) => {
    toast({
      title: 'Error al crear expediente',
      description: err.message,
      variant: 'destructive',
    });
  };

  const onSubmit = form.handleSubmit((values) => {
    addCaseMutation.mutate(
      {
        title: values.title,
        description: values.description?.trim() ? values.description : undefined,
        clientId: values.clientId,
        status: 'active',
      },
      {
        onSuccess: handleSuccess,
        onError: handleError,
      },
    );
  });

  if (isLoadingCases || isLoadingClients) return <div className="px-4 py-6">Cargando expedientes...</div>;
  if (casesError) return <div className="px-4 py-6 text-red-500">Error al cargar expedientes: {casesError.message}</div>;
  if (clientsError) return <div className="px-4 py-6 text-red-500">Error al cargar clientes para expedientes: {clientsError.message}</div>;

  return (
    <div className="px-4 pb-12 space-y-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Gestión de Expedientes</h1>
          <p className="text-sm text-muted-foreground sm:hidden">Crea y consulta los expedientes activos de tus clientes.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Expediente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Expediente</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="grid gap-4 py-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3">
                <Label htmlFor="title" className="sm:text-right">Título</Label>
                <Input
                  id="title"
                  {...form.register('title')}
                  className="sm:col-span-3"
                  required
                />
              </div>
              {form.formState.errors.title && (
                <p className="text-xs text-destructive sm:col-span-4 sm:text-right">{form.formState.errors.title.message}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3">
                <Label htmlFor="description" className="sm:text-right">Descripción</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  className="sm:col-span-3"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3">
                <Label htmlFor="client" className="sm:text-right">Cliente</Label>
                <Controller
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <SelectTrigger className="sm:col-span-3">
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {form.formState.errors.clientId && (
                <p className="text-xs text-destructive sm:col-span-4 sm:text-right">{form.formState.errors.clientId.message}</p>
              )}
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={addCaseMutation.isPending || form.formState.isSubmitting}
                >
                  {addCaseMutation.isPending ? 'Creando...' : 'Crear Expediente'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cases.map((caseItem) => (
          <Card key={caseItem.id}>
            <CardHeader>
              <CardTitle>{caseItem.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">ID: {caseItem.id}</p>
              {caseItem.description && <p className="text-sm text-muted-foreground">Descripción: {caseItem.description}</p>}
              <p className="text-sm text-muted-foreground">Cliente: {clients.find(c => c.id === caseItem.clientId)?.name || 'Desconocido'}</p>
              <p className="text-sm text-muted-foreground">Estado: {caseItem.status}</p>
              <p className="text-sm text-muted-foreground">Registrado: {new Date(caseItem.createdAt).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
        {cases.length === 0 && <p className="text-muted-foreground">No hay expedientes registrados.</p>}
      </div>
    </div>
  );
}
