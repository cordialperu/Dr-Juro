/**
 * DashboardGlobal V4 - Vista Panorámica del Caso
 * 
 * Propósito:
 * - Mostrar información completa del cliente y caso
 * - Resumen del estado actual del proceso
 * - Próximas audiencias y eventos importantes
 * - Documentos recientes
 * - Acceso rápido a las 7 etapas del proceso
 * 
 * Filosofía V4:
 * "Vista global primero, luego profundizar en el proceso"
 */

import { useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { useLegalProcessV2 } from '@/hooks/useLegalProcessV2';
import { EditClientDialog } from '@/components/EditClientDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Mail, 
  MessageCircle, 
  Phone, 
  Scale,
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  FolderOpen,
  Users,
  Target,
  DollarSign,
  ArrowRight,
  Bell,
  ChevronRight,
  Edit
} from 'lucide-react';
import { Link } from 'wouter';
import { formatDistanceToNow, format, parseISO, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardGlobalProps {
  clientId: string;
}

export function DashboardGlobal({ clientId }: DashboardGlobalProps) {
  const { client } = useClient();
  const { data: processData, isLoading } = useLegalProcessV2(clientId);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  if (!client) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No se encontró información del cliente</p>
        </div>
      </div>
    );
  }

  const caseStatus = processData?.data?.caseStatus;
  const participants = processData?.data?.participants || [];
  const milestones = processData?.data?.milestones || [];
  const documentFolders = processData?.data?.documentFolders || [];
  const financial = processData?.data?.financial;

  // Obtener documentos recientes (últimos 5)
  const recentDocuments = documentFolders
    .flatMap((folder: any) => 
      folder.documents.map((doc: any) => ({
        ...doc,
        folderLabel: folder.label,
        folderStage: folder.stage
      }))
    )
    .sort((a: any, b: any) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 5);

  // Obtener próximas audiencias (próximos 30 días)
  const today = new Date();
  const upcomingMilestones = milestones
    .filter((m: any) => {
      const milestoneDate = parseISO(m.date);
      return milestoneDate >= today && milestoneDate <= addDays(today, 30);
    })
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Obtener el imputado (si existe y es diferente del cliente)
  const imputado = participants.find((p: any) => p.role === 'imputado');
  const isClientTheImputado = imputado?.id === client.id || imputado?.name === client.name;

  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header: Información del Cliente */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-3 flex items-center gap-2">
                <User className="h-6 w-6" />
                {client.name}
              </CardTitle>
              
              {/* Contacto del Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{client.whatsappPrimary}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-6 px-2 py-0 ml-2"
                    onClick={() => handleWhatsApp(client.whatsappPrimary)}
                  >
                    Enviar mensaje
                  </Button>
                </div>
              </div>

              {/* Asistente (si existe) */}
              {(client.assistantName || client.whatsappAssistant) && (
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Asistente: {client.assistantName || 'Sin nombre'}
                  </p>
                  <div className="flex items-center gap-3 text-sm">
                    {client.whatsappAssistant && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-3 w-3" />
                        <span>{client.whatsappAssistant}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-5 px-2 py-0"
                          onClick={() => handleWhatsApp(client.whatsappAssistant!)}
                        >
                          Contactar
                        </Button>
                      </div>
                    )}
                    {client.emailAssistant && (
                      <div className="text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 inline mr-1" />
                        {client.emailAssistant}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Imputado (si es diferente del cliente) */}
              {imputado && !isClientTheImputado && (
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
                  <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-1">
                    <Scale className="h-3 w-3" />
                    Imputado: {imputado.name}
                    {imputado.relation && ` (${imputado.relation})`}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    {imputado.dni && <div>DNI: {imputado.dni}</div>}
                    {imputado.contact && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {imputado.contact}
                      </div>
                    )}
                    {imputado.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {imputado.email}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CTA Principal */}
            <div className="flex gap-2 ml-4">
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar Info
              </Button>
              <Button 
                size="lg"
                asChild
              >
                <Link href={`/client/${clientId}/proceso`}>
                  Ver Proceso Completo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Dialog de Edición */}
      <EditClientDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
      />

      {/* Estado del Caso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Estado del Caso
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-56" />
            </div>
          ) : caseStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Expediente</p>
                <p className="font-medium">{caseStatus.caseNumber || 'Sin asignar'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tipo de Caso</p>
                <Badge variant="secondary">{caseStatus.caseType || 'No especificado'}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Etapa Actual</p>
                <p className="font-medium">{caseStatus.currentStage}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Estado</p>
                <Badge 
                  variant={
                    caseStatus.resolutionStatus.includes('absuelto') ? 'default' :
                    caseStatus.resolutionStatus.includes('condenado') ? 'destructive' :
                    'secondary'
                  }
                >
                  {caseStatus.resolutionStatus === 'en_tramite' ? 'En Trámite' : caseStatus.resolutionStatus}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No hay información del caso registrada</p>
              <Button variant="outline" asChild>
                <Link href={`/client/${clientId}/proceso`}>
                  Ir al Proceso para completar
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid: Próximas Audiencias + Documentos Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Audiencias */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Audiencias
              </CardTitle>
              {upcomingMilestones.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  <Bell className="h-3 w-3 mr-1" />
                  {upcomingMilestones.length}
                </Badge>
              )}
            </div>
            <CardDescription>Próximos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : upcomingMilestones.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No hay audiencias próximas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMilestones.map((milestone: any) => {
                  const milestoneDate = parseISO(milestone.date);
                  const daysUntil = Math.ceil((milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysUntil <= 3;

                  return (
                    <div 
                      key={milestone.id}
                      className={`p-3 rounded-lg border ${isUrgent ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' : 'bg-muted/50'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{milestone.title}</h4>
                        {isUrgent && (
                          <Badge variant="destructive" className="text-xs">
                            Urgente
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{milestone.description}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(milestoneDate, "dd 'de' MMMM, yyyy", { locale: es })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          En {daysUntil} {daysUntil === 1 ? 'día' : 'días'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documentos Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Recientes
            </CardTitle>
            <CardDescription>Últimos 5 archivos subidos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">No hay documentos subidos</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/client/${clientId}/proceso`}>
                    Subir primer documento
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDocuments.map((doc: any) => (
                  <div 
                    key={doc.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">{doc.folderLabel}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(doc.uploadDate), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acceso Rápido a las 7 Etapas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Acceso Rápido a Etapas del Proceso
          </CardTitle>
          <CardDescription>
            Navega directamente a cada etapa del proceso legal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { stage: 'general', label: 'Documentos Generales', icon: FileText, color: 'text-gray-600' },
              { stage: 'investigacion', label: 'Investigación', icon: Target, color: 'text-blue-600' },
              { stage: 'intermedia', label: 'Etapa Intermedia', icon: Clock, color: 'text-purple-600' },
              { stage: 'juicio_oral', label: 'Juicio Oral', icon: Scale, color: 'text-red-600' },
              { stage: 'apelacion', label: 'Apelación', icon: ArrowRight, color: 'text-orange-600' },
              { stage: 'casacion', label: 'Casación', icon: CheckCircle, color: 'text-green-600' },
              { stage: 'ejecucion', label: 'Ejecución', icon: DollarSign, color: 'text-teal-600' },
            ].map((item) => {
              const folder = documentFolders.find((f: any) => f.stage === item.stage);
              const docCount = folder?.documents.length || 0;

              return (
                <Button
                  key={item.stage}
                  variant="outline"
                  className="h-auto flex-col items-start p-4 text-left"
                  asChild
                >
                  <Link href={`/client/${clientId}/proceso`}>
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {docCount} {docCount === 1 ? 'documento' : 'documentos'}
                    </div>
                    <ChevronRight className="h-4 w-4 ml-auto mt-2" />
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards: Intervinientes, Hitos, Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intervinientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participants.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Partes del proceso registradas
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="px-0 mt-2"
              asChild
            >
              <Link href={`/client/${clientId}/proceso`}>
                Ver detalle <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hitos Registrados</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{milestones.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Eventos importantes del caso
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="px-0 mt-2"
              asChild
            >
              <Link href={`/client/${clientId}/proceso`}>
                Ver timeline <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Honorarios</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {financial?.honorarios?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gastos: S/ {financial?.gastos?.toLocaleString() || '0'}
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="px-0 mt-2"
              asChild
            >
              <Link href={`/client/${clientId}/proceso`}>
                Ver detalle <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CTA Final */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              ¿Listo para trabajar en el caso?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Accede al proceso legal completo con las 7 etapas, documentos, estrategia y más
            </p>
            <Button size="lg" asChild>
              <Link href={`/client/${clientId}/proceso`}>
                <Scale className="mr-2 h-5 w-5" />
                Ir al Proceso Completo
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
