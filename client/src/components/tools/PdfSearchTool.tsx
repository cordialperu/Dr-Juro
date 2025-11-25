import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Loader2, Download, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePdfSearch } from "@/hooks/usePdfSearch";

interface PdfSearchToolProps {
  clientId: string;
}

interface PdfFileInfo {
  filename: string;
  size: number;
  modifiedAt: string | null;
}

const formatSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fetchPdfFiles = async (): Promise<PdfFileInfo[]> => {
  const response = await fetch("/api/pdf/files");
  if (!response.ok) {
    throw new Error("No se pudo obtener la lista de PDFs disponibles");
  }
  const data = await response.json();
  return data.files ?? [];
};

export function PdfSearchTool({}: PdfSearchToolProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState("");
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: pdfFiles = [],
    isLoading: isLoadingFiles,
    error: filesError,
  } = useQuery<PdfFileInfo[]>({
    queryKey: ["pdf-files"],
    queryFn: fetchPdfFiles,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (filesError) {
      toast({
        title: "No se pudo cargar la lista de PDFs",
        description: filesError.message,
        variant: "destructive",
      });
    }
  }, [filesError, toast]);

  const {
    data: searchData,
    isFetching: isSearching,
    error: searchError,
  } = usePdfSearch(selectedFile || undefined, searchTerm, {
    enabled: Boolean(selectedFile && searchTerm.trim().length > 0),
  });

  useEffect(() => {
    if (searchError) {
      toast({
        title: "Error en la búsqueda",
        description: searchError.message,
        variant: "destructive",
      });
    }
  }, [searchError, toast]);

  const handleSearch = () => {
    if (!selectedFile) {
      toast({
        title: "Selecciona un PDF",
        description: "Primero elige un documento para poder buscar en su contenido.",
        variant: "destructive",
      });
      return;
    }

    if (!query.trim()) {
      toast({
        title: "Término requerido",
        description: "Ingresa una palabra o frase para buscar dentro del PDF.",
        variant: "destructive",
      });
      return;
    }

    setSearchTerm(query.trim());
  };

  const selectedFileInfo = pdfFiles.find((file) => file.filename === selectedFile);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Búsqueda en Documentos PDF del cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Documento</p>
              <Select value={selectedFile} onValueChange={setSelectedFile} disabled={isLoadingFiles || pdfFiles.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingFiles ? "Cargando PDFs..." : "Selecciona un PDF"} />
                </SelectTrigger>
                <SelectContent>
                  {pdfFiles.map((file) => (
                    <SelectItem key={file.filename} value={file.filename}>
                      {file.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFileInfo && (
                <p className="text-xs text-muted-foreground">
                  Tamaño: {formatSize(selectedFileInfo.size)} · Última modificación:{" "}
                  {selectedFileInfo.modifiedAt
                    ? new Date(selectedFileInfo.modifiedAt).toLocaleDateString("es-PE")
                    : "Desconocida"}
                </p>
              )}
              {!isLoadingFiles && pdfFiles.length === 0 && (
                <div className="inline-flex items-center gap-2 rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5" />
                  No se encontraron PDFs en la carpeta compartida (`/pdfs`).
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Término a buscar</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Artículos, nombres, fechas..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching || isLoadingFiles || pdfFiles.length === 0}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Analizando el PDF seleccionado…
        </div>
      )}

      {searchData && searchTerm && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Resultados para “{searchTerm}”</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{searchData.totalMatches} coincidencias</Badge>
              {searchData.truncated && <span>(mostrando las primeras {searchData.matches.length})</span>}
            </div>
          </div>

          {searchData.matches.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No se encontraron coincidencias en este PDF.
              </CardContent>
            </Card>
          ) : (
            searchData.matches.map((match, index) => (
              <Card key={`${match.page}-${index}`} className="hover:shadow-md transition-shadow">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Página {match.page}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={match.url} target="_blank" rel="noreferrer">
                        <Download className="mr-2 h-4 w-4" /> Abrir PDF
                      </a>
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {match.preview.before && <span>{match.preview.before} </span>}
                    <mark className="rounded bg-primary/15 px-1 text-foreground">
                      {match.preview.match}
                    </mark>
                    {match.preview.after && <span> {match.preview.after}</span>}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
