import { PlusCircle, Eye, ArrowRight, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getClientColor } from '@/lib/clientColors';
import { useAllClientsQuery, useCreateClientMutation } from '@/hooks/useClients';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useClient } from '@/contexts/ClientContext';
import { ClientForm } from './ClientForm';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function ClientsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [, navigate] = useLocation();
  
  // Context unificado para el cliente
  const { client: selectedClient, setClient: setSelectedClient } = useClient();

  const { data: clientsResponse, isLoading, error } = useAllClientsQuery();
  
  // Extraer array de clientes (asegurarse de que siempre sea un array)
  const clients = Array.isArray(clientsResponse) ? clientsResponse : [];

  // Consultar el progreso de todos los clientes
  const { data: progressData = {} } = useQuery({
    queryKey: ['/api/clients/progress/all'],
    refetchInterval: 5000, // Actualizar cada 5 segundos
  });

  const addClientMutation = useCreateClientMutation();

  // Helper para calcular el progreso del cliente usando datos reales
  const getClientProgress = (client: any) => {
    const progress = (progressData as Record<string, any>)[client.id];
    if (progress) {
      return progress;
    }
    // Valor por defecto si no hay datos
    return { phase: 'registered', percentage: 0, label: 'Sin proceso iniciado' };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-400';
    if (percentage < 35) return 'bg-blue-500';
    if (percentage < 60) return 'bg-yellow-500';
    if (percentage < 85) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    toast({
      title: 'Cliente creado',
      description: 'El nuevo cliente ha sido registrado exitosamente.',
    });
  };

  const handleError = (err: Error) => {
    toast({
      title: 'Error al crear cliente',
      description: err.message,
      variant: 'destructive',
    });
  };

  const handleSubmitClient = (values: any) => {
    addClientMutation.mutate(values, {
      onSuccess: handleSuccess,
      onError: handleError,
    });
  };

  const handleDeleteClient = async (client: any) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar a "${client.name}"? Esta acción no se puede deshacer.`
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el cliente');
      }

      toast({
        title: 'Cliente eliminado',
        description: `${client.name} ha sido eliminado exitosamente.`,
      });

      // Recargar la lista de clientes
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error al eliminar',
        description: error instanceof Error ? error.message : 'Ocurrió un error al eliminar el cliente.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <div className="p-6">Cargando clientes...</div>;
  if (error) return <div className="p-6 text-red-500">Error al cargar clientes: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Gestión de Clientes</h1>
          <p className="text-sm text-muted-foreground sm:hidden">
            Administra tus clientes y da seguimiento al avance de cada proceso.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
            </DialogHeader>
            <ClientForm 
              onSubmit={handleSubmitClient}
              onCancel={() => setIsDialogOpen(false)}
              isSubmitting={addClientMutation.isPending}
              submitLabel="Crear Cliente"
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {clients.map((client) => {
          const progress = getClientProgress(client);
          const clientColor = getClientColor(client.id);
          
          return (
            <Card 
              key={client.id} 
              className="hover:shadow-lg transition-shadow"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: clientColor.primary,
                borderLeftStyle: 'solid'
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 flex items-center gap-3">
                    <Avatar 
                      className="h-10 w-10 flex-shrink-0 border-2 shadow-sm"
                      style={{ 
                        borderColor: clientColor.primary
                      }}
                      title={`Color identificador: ${client.name}`}
                    >
                      <AvatarFallback
                        className="font-bold text-sm"
                        style={{
                          backgroundColor: clientColor.primary,
                          color: 'white'
                        }}
                      >
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      {client.contactInfo && (
                        <p className="text-xs text-muted-foreground mt-1">{client.contactInfo}</p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant="outline"
                    className="ml-2 flex-shrink-0"
                    style={{
                      backgroundColor: clientColor.light,
                      color: clientColor.dark,
                      borderColor: clientColor.primary
                    }}
                  >
                    {progress.percentage}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Barra de progreso */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.label}</span>
                    <span>Registrado: {new Date(client.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full transition-all duration-500"
                      style={{ 
                        width: `${progress.percentage}%`,
                        backgroundColor: clientColor.primary
                      }}
                    />
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedClientForDetails(client);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Detalles
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // Seleccionar cliente globalmente
                      setSelectedClient({
                        ...client,
                        contactInfo: client.contactInfo || undefined,
                      });
                      toast({
                        title: "Cliente seleccionado",
                        description: `Trabajando con: ${client.name}`,
                      });
                      // Redirigir a procesos
                      navigate('/procesos');
                    }}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Continuar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClient(client)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {clients.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No hay clientes registrados.</p>
            <p className="text-sm text-muted-foreground mt-2">Haz clic en "Nuevo Cliente" para comenzar.</p>
          </div>
        )}
      </div>

      {/* Modal de detalles del cliente */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalles del Cliente</DialogTitle>
          </DialogHeader>
          {selectedClientForDetails && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Información Básica</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{selectedClientForDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contacto</p>
                    <p className="font-medium">{selectedClientForDetails.contactInfo || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de registro</p>
                    <p className="font-medium">{new Date(selectedClientForDetails.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-medium text-xs">{selectedClientForDetails.id}</p>
                  </div>
                </div>
              </div>

              {/* Progreso del proceso */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Estado del Proceso</h3>
                <div className="space-y-4">
                  {(() => {
                    const progress = getClientProgress(selectedClientForDetails);
                    const progressColor = getProgressColor(progress.percentage);
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{progress.label}</span>
                          <Badge variant="outline">{progress.percentage}% completado</Badge>
                        </div>
                        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`absolute top-0 left-0 h-full ${progressColor} transition-all duration-500`}
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-xs text-center">
                          <div className={progress.percentage >= 10 ? "text-primary font-semibold" : "text-muted-foreground"}>
                            Cliente
                          </div>
                          <div className={progress.percentage >= 35 ? "text-primary font-semibold" : "text-muted-foreground"}>
                            Investigación
                          </div>
                          <div className={progress.percentage >= 60 ? "text-primary font-semibold" : "text-muted-foreground"}>
                            Estrategia
                          </div>
                          <div className={progress.percentage >= 85 ? "text-primary font-semibold" : "text-muted-foreground"}>
                            Reunión
                          </div>
                          <div className={progress.percentage >= 100 ? "text-primary font-semibold" : "text-muted-foreground"}>
                            Seguimiento
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Botón para continuar */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    // Seleccionar cliente globalmente y navegar
                    if (selectedClientForDetails) {
                      setSelectedClient({
                        ...selectedClientForDetails,
                        contactInfo: selectedClientForDetails.contactInfo || undefined,
                      });
                      navigate('/procesos');
                    }
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continuar Proceso
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
