import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Search, Brain, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DocumentosPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - reemplazar con datos reales
  const documentos = [
    {
      id: "1",
      nombre: "Demanda Laboral - García vs XYZ.pdf",
      tipo: "Demanda",
      fecha: "2024-11-10",
      estado: "Analizado",
      resumen: "Demanda por despido arbitrario. El empleado solicita reposición y pago de beneficios sociales.",
    },
    {
      id: "2",
      nombre: "Contrato Compraventa - Inmueble.pdf",
      tipo: "Contrato",
      fecha: "2024-11-08",
      estado: "Pendiente",
      resumen: null,
    },
  ];

  const filteredDocs = documentos.filter((doc) =>
    doc.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Análisis de Documentos</h1>
        <p className="text-muted-foreground mt-2">
          Análisis inteligente de documentos legales con IA
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subir Documento</CardTitle>
          <CardDescription>
            Sube un documento para análisis automático con IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium">
              Arrastra un documento aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              PDF, DOCX, TXT (máx. 10MB)
            </p>
            <Button className="mt-4">
              <Upload className="mr-2 h-4 w-4" />
              Seleccionar Archivo
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredDocs.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <CardTitle className="text-lg">{doc.nombre}</CardTitle>
                    <CardDescription className="mt-1">
                      {doc.tipo} • {doc.fecha}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={doc.estado === "Analizado" ? "default" : "secondary"}>
                  {doc.estado}
                </Badge>
              </div>
            </CardHeader>
            {doc.resumen && (
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Brain className="h-4 w-4 text-primary" />
                    Análisis de IA
                  </div>
                  <p className="text-sm text-muted-foreground">{doc.resumen}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Brain className="mr-2 h-4 w-4" />
                    Ver Análisis Completo
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </Button>
                </div>
              </CardContent>
            )}
            {!doc.resumen && (
              <CardContent>
                <Button variant="outline" size="sm">
                  <Brain className="mr-2 h-4 w-4" />
                  Analizar Documento
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No se encontraron documentos</h3>
          <p className="text-muted-foreground mt-2">
            Sube tu primer documento para comenzar el análisis
          </p>
        </div>
      )}
    </div>
  );
}
