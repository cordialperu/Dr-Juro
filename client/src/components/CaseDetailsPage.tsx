import { useMemo } from "react";
import { useLocation } from "wouter";
import { useCasesQuery } from "@/hooks/useCases";
import { useClientsQuery } from "@/hooks/useClients";
import { useDoctrinasQuery } from "@/hooks/useDoctrinas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { DoctrinaList } from "@/components/DoctrinaList";

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

export function CaseDetailsPage({ params }: CaseDetailsPageProps) {
  const { id } = params;
  const [, navigate] = useLocation();
  const {
    data: cases = [],
    isLoading: isLoadingCases,
    error: casesError,
  } = useCasesQuery();
  const {
    data: clients = [],
    isLoading: isLoadingClients,
    error: clientsError,
  } = useClientsQuery();

  const caseItem = useMemo(() => cases.find((item) => item.id === id), [cases, id]);
  const clientName = useMemo(
    () => clients.find((client) => client.id === caseItem?.clientId)?.name ?? "Desconocido",
    [clients, caseItem?.clientId],
  );

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

  const createdAt = caseItem.createdAt ? new Date(caseItem.createdAt) : undefined;
  const updatedAt = caseItem.updatedAt ? new Date(caseItem.updatedAt) : createdAt;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{caseItem.title}</h1>
          <p className="text-muted-foreground">Expediente ID: {caseItem.id}</p>
        </div>
        <div className="flex gap-2">
          {caseItem.status && (
            <Badge variant="secondary">{statusLabels[caseItem.status] ?? caseItem.status}</Badge>
          )}
          <Button variant="outline" onClick={() => navigate("/cases")}>Volver</Button>
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
    </div>
  );
}
