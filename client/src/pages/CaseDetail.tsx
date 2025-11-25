import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Users,
  Search,
  Target,
  CheckCircle,
  ArrowLeft,
  FolderOpen,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CaseDetailProps {
  clientId: string;
  caseId: string;
}

const PHASES = [
  {
    id: 'info_cliente',
    label: 'Info Cliente',
    icon: Users,
    description: 'Información inicial del cliente y caso',
  },
  {
    id: 'investigacion',
    label: 'Investigación',
    icon: Search,
    description: 'Recopilación de pruebas y evidencias',
  },
  {
    id: 'estrategia',
    label: 'Estrategia',
    icon: Target,
    description: 'Definición de estrategia legal',
  },
  {
    id: 'reunion',
    label: 'Reunión',
    icon: Users,
    description: 'Coordinación y reuniones con cliente',
  },
  {
    id: 'seguimiento',
    label: 'Seguimiento',
    icon: CheckCircle,
    description: 'Seguimiento y resolución del caso',
  },
];

export function CaseDetail({ clientId, caseId }: CaseDetailProps) {
  const [activePhase, setActivePhase] = useState('info_cliente');

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: async () => {
      const response = await fetch(`/api/cases/${caseId}`);
      if (!response.ok) throw new Error('Error al cargar caso');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Caso no encontrado</h3>
        <Button variant="outline" asChild>
          <Link href={`/client/${clientId}/cases`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a casos
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/client/${clientId}/cases`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a casos
          </Link>
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{caseData.title}</h1>
            <p className="text-muted-foreground">{caseData.description}</p>
          </div>
          <Badge variant={
            caseData.status === 'active' ? 'default' :
            caseData.status === 'closed' ? 'secondary' :
            'outline'
          }>
            {caseData.status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              Creado {formatDistanceToNow(new Date(caseData.createdAt), { 
                addSuffix: true, 
                locale: es 
              })}
            </span>
          </div>
          {caseData.caseType && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="capitalize">{caseData.caseType}</span>
            </div>
          )}
        </div>
      </div>

      {/* Phase Tabs */}
      <Tabs value={activePhase} onValueChange={setActivePhase} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {PHASES.map((phase) => {
            const Icon = phase.icon;
            return (
              <TabsTrigger
                key={phase.id}
                value={phase.id}
                className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">{phase.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Phase Content */}
        {PHASES.map((phase) => (
          <TabsContent key={phase.id} value={phase.id} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <phase.icon className="h-5 w-5" />
                  {phase.label}
                </CardTitle>
                <CardDescription>{phase.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Phase-specific content */}
                  {phase.id === 'info_cliente' && (
                    <div>
                      <h4 className="font-semibold mb-3">Información del Cliente</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Caso:</span>
                          <span className="font-medium">{caseData.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estado:</span>
                          <Badge variant="outline">{caseData.status}</Badge>
                        </div>
                        {caseData.caseType && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tipo:</span>
                            <span className="capitalize">{caseData.caseType}</span>
                          </div>
                        )}
                      </div>
                      <Button className="w-full mt-4" variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Agregar Documentos
                      </Button>
                    </div>
                  )}

                  {phase.id === 'investigacion' && (
                    <div>
                      <h4 className="font-semibold mb-3">Materiales de Investigación</h4>
                      <div className="text-sm text-muted-foreground mb-4">
                        Recopila pruebas, evidencias y documentos relevantes para el caso.
                      </div>
                      <Button className="w-full" variant="outline">
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Gestionar Documentos
                      </Button>
                    </div>
                  )}

                  {phase.id === 'estrategia' && (
                    <div>
                      <h4 className="font-semibold mb-3">Estrategia Legal</h4>
                      <div className="text-sm text-muted-foreground mb-4">
                        Define la teoría del caso y estrategia de defensa/acusación.
                      </div>
                      <Button className="w-full" variant="outline">
                        <Target className="mr-2 h-4 w-4" />
                        Definir Estrategia
                      </Button>
                    </div>
                  )}

                  {phase.id === 'reunion' && (
                    <div>
                      <h4 className="font-semibold mb-3">Reuniones y Coordinación</h4>
                      <div className="text-sm text-muted-foreground mb-4">
                        Programa y registra reuniones con el cliente y otros participantes.
                      </div>
                      <Button className="w-full" variant="outline">
                        <Calendar className="mr-2 h-4 w-4" />
                        Programar Reunión
                      </Button>
                    </div>
                  )}

                  {phase.id === 'seguimiento' && (
                    <div>
                      <h4 className="font-semibold mb-3">Seguimiento y Resolución</h4>
                      <div className="text-sm text-muted-foreground mb-4">
                        Monitorea el progreso del caso y registra resoluciones.
                      </div>
                      <Button className="w-full" variant="outline">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Actualizar Estado
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/client/${clientId}/documents`}>
              <FileText className="mr-2 h-4 w-4" />
              Ver Documentos
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/client/${clientId}/tasks`}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Crear Tarea
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/client/${clientId}/tools`}>
              <Target className="mr-2 h-4 w-4" />
              Herramientas IA
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
