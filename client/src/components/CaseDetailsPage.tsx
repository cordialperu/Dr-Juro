import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useCasesQuery } from "@/hooks/useCases";
import { useAllClientsQuery } from "@/hooks/useClients";
import { useDoctrinasQuery } from "@/hooks/useDoctrinas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileDown } from "lucide-react";
import { DoctrinaList } from "@/components/DoctrinaList";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentFolderManager } from "@/components/DocumentFolderManager";
import { getClientColor } from "@/lib/clientColors";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CaseDetailsPageProps {
  params: {
    id: string;
  };
}

const statusLabels: Record<string, string> = {
  active: "Activo",
  pending: "Pendiente",
  closed: "Cerrado",
  review: "En revisión",
};

const DOCUMENT_PHASES = [
  { id: "avance_investigacion", label: "Investigación" },
  { id: "programar_cita", label: "Agenda" },
  { id: "armar_estrategia", label: "Estrategia" },
  { id: "seguimiento", label: "Seguimiento" },
];

export function CaseDetailsPage({ params }: CaseDetailsPageProps) {
  const { id } = params;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPhase, setSelectedPhase] = useState<string>(DOCUMENT_PHASES[0].id);
  const {
    data: cases = [],
    isLoading: isLoadingCases,
    error: casesError,
  } = useCasesQuery();
  const {
    data: clients = [],
    isLoading: isLoadingClients,
    error: clientsError,
  } = useAllClientsQuery();

  const caseItem = useMemo(() => cases.find((item) => item.id === id), [cases, id]);
  const client = useMemo(
    () => clients.find((c) => c.id === caseItem?.clientId),
    [clients, caseItem?.clientId],
  );
  const clientName = client?.name ?? "Desconocido";
  const clientColor = client ? getClientColor(client.id) : { primary: '#64748b', light: '#f1f5f9', dark: '#475569' };

  const {
    data: doctrinas = [],
    isLoading: isLoadingDoctrinas,
    error: doctrinasError,
  } = useDoctrinasQuery(
    caseItem
      ? {
          caseTitle: caseItem.title ?? undefined,
          caseDescription: caseItem.description ?? undefined,
        }
      : undefined,
    {
      enabled: Boolean(caseItem),
    },
  );

  if (isLoadingCases || isLoadingClients || isLoadingDoctrinas) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Cargando expediente…</span>
        </div>
      </div>
    );
  }

  if (casesError) {
    return <div className="p-6 text-red-500">No se pudo cargar el expediente: {casesError.message}</div>;
  }

  if (clientsError) {
    return <div className="p-6 text-red-500">No se pudieron cargar los clientes: {clientsError.message}</div>;
  }

  if (doctrinasError) {
    return <div className="p-6 text-red-500">No se pudieron cargar las doctrinas: {doctrinasError.message}</div>;
  }

  if (!caseItem) {
    return (
      <div className="p-6 space-y-4">
        <div className="rounded-md border border-border bg-muted/40 p-6 text-muted-foreground">
          No se encontró el expediente solicitado.
        </div>
        <Button variant="outline" onClick={() => navigate("/cases")}>Volver a expedientes</Button>
      </div>
    );
  }

  const createdAt = caseItem.createdAt ? new Date(caseItem.createdAt) : null;
  const updatedAt = caseItem.updatedAt ? new Date(caseItem.updatedAt) : null;

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/cases/${id}/export-pdf`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al generar el PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `caso-${caseItem.title.replace(/[^a-z0-9]/gi, '_')}-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF exportado",
        description: "El expediente se ha descargado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {client && (
            <Avatar className="h-12 w-12 border-2" style={{ borderColor: clientColor.primary }}>
              <AvatarFallback 
                className="font-bold text-lg" 
                style={{ 
                  backgroundColor: clientColor.light, 
                  color: clientColor.dark 
                }}
              >
                {getInitials(clientName)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{caseItem.title}</h1>
            <Badge
              variant={caseItem.status === "active" ? "default" : "secondary"}
              style={{
                backgroundColor: clientColor.light,
                color: clientColor.dark,
                borderColor: clientColor.primary
              }}
              className="inline-flex"
            >
            {statusLabels[caseItem.status] || caseItem.status}
          </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Button onClick={() => navigate("/cases")}>Volver</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen del expediente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Cliente:</span> {clientName}
          </p>
          {caseItem.description && (
            <p>
              <span className="font-medium text-foreground">Descripción:</span> {caseItem.description}
            </p>
          )}
          {createdAt && (
            <p>
              <span className="font-medium text-foreground">Creado:</span>{" "}
              {createdAt.toLocaleString("es-PE", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          {updatedAt && (
            <p>
              <span className="font-medium text-foreground">Última actualización:</span>{" "}
              {updatedAt.toLocaleString("es-PE", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doctrina relacionada</CardTitle>
        </CardHeader>
        <CardContent>
          <DoctrinaList doctrinas={doctrinas} emptyMessage="No se encontraron doctrinas vinculadas a este expediente." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos del expediente</CardTitle>
        </CardHeader>
        <CardContent>
          {caseItem.clientId ? (
            <div className="space-y-4">
              <Tabs value={selectedPhase} onValueChange={setSelectedPhase} className="w-full">
                <TabsList className="flex flex-wrap gap-2">
                  {DOCUMENT_PHASES.map((phase) => (
                    <TabsTrigger key={phase.id} value={phase.id} className="px-4 py-1">
                      {phase.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {DOCUMENT_PHASES.map((phase) => (
                  <TabsContent key={phase.id} value={phase.id} className="mt-4">
                    <DocumentFolderManager
                      clientId={caseItem.clientId || ''}
                      phase={phase.id}
                      readOnly
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Este expediente no está vinculado a un cliente, por lo que no hay documentos para mostrar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
