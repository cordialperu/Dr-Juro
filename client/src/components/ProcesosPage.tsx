import { useSelectedClient } from '@/contexts/ClientContext';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export function ProcesosPage() {
  const { selectedClient, clearSelectedClient } = useSelectedClient();
  const [, navigate] = useLocation();

  const { data: progressData } = useQuery({
    queryKey: ['/api/clients/progress/all'],
    enabled: !!selectedClient,
    refetchInterval: 5000,
  });

  if (!selectedClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">No hay cliente seleccionado</h2>
          <p className="text-muted-foreground">
            Selecciona un cliente desde la página de Clientes para gestionar sus procesos.
          </p>
        </div>
        <Button onClick={() => navigate('/clients')}>
          <User className="h-4 w-4 mr-2" />
          Ir a Clientes
        </Button>
      </div>
    );
  }

  const progress = (progressData as Record<string, any>)?.[selectedClient.id] || {
    phase: 'registered',
    percentage: 0,
    label: 'Sin proceso iniciado'
  };

  const phases = [
    { 
      name: 'Avance de la Investigación', 
      percentage: 25, 
      icon: FileText, 
      completed: progress.percentage >= 25,
      route: 'avance_investigacion',
      description: 'Denuncias, notificaciones y documentos'
    },
    { 
      name: 'Programar Cita', 
      percentage: 50, 
      icon: Calendar, 
      completed: progress.percentage >= 50,
      route: 'programar_cita',
      description: 'Agendar reunión con el cliente'
    },
    { 
      name: 'Armar Estrategia', 
      percentage: 75, 
      icon: Briefcase, 
      completed: progress.percentage >= 75,
      route: 'armar_estrategia',
      description: 'Teoría del caso y objetivos'
    },
    { 
      name: 'Seguimiento', 
      percentage: 100,
      icon: CheckCircle2, 
      completed: progress.percentage >= 100,
      route: 'seguimiento',
      description: 'Monitoreo del proceso'
    }
  ];

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearSelectedClient();
            navigate('/clients');
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/proceso/${selectedClient.id}/registro`)}
        >
          <User className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide text-primary">Resumen del proceso</span>
          <span>
            Avance: <span className="font-medium text-foreground">{progress.percentage}%</span>
          </span>
          <span>
            Estado: <span className="font-medium text-foreground">{progress.label}</span>
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground px-1">Fase del Proceso</h3>
        {phases.map((phase) => {
          const Icon = phase.icon;
          const isActive = progress.percentage >= phase.percentage;
          
          return (
            <button
              key={phase.route}
              onClick={() => navigate(`/proceso/${selectedClient.id}/${phase.route}`)}
              className="w-full"
            >
              <Card className={`hover:shadow-md transition-all ${
                isActive ? 'border-primary' : 'opacity-60'
              }`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      phase.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {phase.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-sm">{phase.name}</h4>
                      <p className="text-xs text-muted-foreground">{phase.description}</p>
                    </div>
                    
                    {phase.completed && (
                      <Badge variant="secondary" className="text-xs">
                        Completado
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
