import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ExpedientesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - reemplazar con datos reales de la API
  const expedientes = [
    {
      id: "1",
      numero: "00123-2024-0-1801-JR-LA-01",
      materia: "Laboral",
      estado: "En trámite",
      demandante: "María García López",
      demandado: "Empresa XYZ S.A.",
      fechaIngreso: "2024-01-15",
      juzgado: "1° Juzgado de Trabajo de Lima",
    },
    {
      id: "2",
      numero: "00456-2024-0-1801-JR-CI-02",
      materia: "Civil",
      estado: "Sentenciado",
      demandante: "Juan Carlos Mendoza",
      demandado: "Rosa Pérez Silva",
      fechaIngreso: "2024-02-20",
      juzgado: "2° Juzgado Civil de Lima",
    },
  ];

  const filteredExpedientes = expedientes.filter(
    (exp) =>
      exp.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.demandante.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.demandado.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Expedientes</h1>
        <p className="text-muted-foreground mt-2">
          Gestión y seguimiento de expedientes judiciales
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de expediente, demandante o demandado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Nuevo Expediente
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredExpedientes.map((expediente) => (
          <Card key={expediente.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{expediente.numero}</CardTitle>
                  <CardDescription>{expediente.juzgado}</CardDescription>
                </div>
                <Badge variant={expediente.estado === "En trámite" ? "default" : "secondary"}>
                  {expediente.estado}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Materia:</span>
                  <span className="font-medium">{expediente.materia}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Ingreso:</span>
                  <span className="font-medium">{expediente.fechaIngreso}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <div>
                      <span className="text-muted-foreground">Demandante: </span>
                      <span className="font-medium">{expediente.demandante}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Demandado: </span>
                      <span className="font-medium">{expediente.demandado}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm">Ver Detalles</Button>
                <Button variant="outline" size="sm">Seguimiento</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExpedientes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No se encontraron expedientes</h3>
          <p className="text-muted-foreground mt-2">
            {searchQuery
              ? "Intenta con otros términos de búsqueda"
              : "Comienza agregando un nuevo expediente"}
          </p>
        </div>
      )}
    </div>
  );
}
