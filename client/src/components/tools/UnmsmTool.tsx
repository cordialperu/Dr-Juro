import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Loader2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUnmsmSearch } from "@/hooks/useUnmsmSearch";

interface UnmsmToolProps {
  clientId: string;
}

export function UnmsmTool({}: UnmsmToolProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    data,
    isFetching,
    error,
  } = useUnmsmSearch(searchTerm, {
    enabled: Boolean(searchTerm.trim().length > 0),
    page,
    size: 5,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error al consultar UNMSM",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSearch = () => {
    if (!query.trim()) {
      toast({
        title: "Ingresa un término",
        description: "Escribe palabras clave para buscar en Cybertesis UNMSM.",
        variant: "destructive",
      });
      return;
    }

    setSearchTerm(query.trim());
    setPage(0);
  };

  const toggleExpanded = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const totalElements = data?.pagination.totalElements ?? 0;
  const totalPages = data?.pagination.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Biblioteca Académica UNMSM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ej. responsabilidad penal de personas jurídicas"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {data && (
            <p className="text-xs text-muted-foreground">
              Mostrando {data.results.length} de {totalElements} resultados para “{data.term}”.
            </p>
          )}
        </CardContent>
      </Card>

      {isFetching && !data && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Consultando repositorios de la UNMSM…
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {data.results.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No se encontraron resultados para “{data.term}”. Prueba con sinónimos o amplia la búsqueda.
              </CardContent>
            </Card>
          ) : (
            data.results.map((result) => {
              const isExpanded = expandedId === result.id;
              return (
                <Card key={result.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-base font-semibold text-foreground">{result.title}</h4>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {result.authors?.length ? <span>Autores: {result.authors.join(", ")}</span> : null}
                          {result.issued && <Badge variant="outline">{new Date(result.issued).getFullYear()}</Badge>}
                          <Badge variant="secondary">Fuente: {result.source}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {result.url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={result.url} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-1 h-4 w-4" /> Abrir
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => toggleExpanded(result.id)}>
                          {isExpanded ? (
                            <>
                              Ocultar resumen
                              <ChevronUp className="ml-1 h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Ver resumen
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {result.abstract || "El registro no incluye un resumen disponible."}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Página {page + 1} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((prev) => Math.max(prev - 1, 0))}>
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.pagination.hasNext}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
