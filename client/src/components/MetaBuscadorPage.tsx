import { FormEvent, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search as SearchIcon, ExternalLink } from "lucide-react";

interface MetaBuscadorResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

interface MetaBuscadorResponse {
  term: string;
  results: MetaBuscadorResult[];
}

export function MetaBuscadorPage() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<MetaBuscadorResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTerm, setLastTerm] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = term.trim();
    if (!trimmed) {
      setError("Ingresa un término de búsqueda.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch("/api/metabuscador/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termino: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? `Error del servidor (${response.status})`);
      }

      const data = (await response.json()) as MetaBuscadorResponse;
      setResults(data.results ?? []);
      setLastTerm(data.term ?? trimmed);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="metabuscador-page">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Meta Buscador Jurídico</h1>
        <p className="text-muted-foreground">
          Consulta simultáneamente las principales fuentes doctrinales peruanas (PUCP, UNMSM, Poder Judicial y Tribunal
          Constitucional). Los resultados se obtienen a través del servicio interno `metabuscador`.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form className="flex flex-col gap-4 md:flex-row" onSubmit={handleSubmit}>
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Ej. responsabilidad penal de personas jurídicas"
              className="flex-1"
              data-testid="metabuscador-input"
            />
            <Button type="submit" disabled={isLoading} data-testid="metabuscador-submit">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando…
                </>
              ) : (
                <>
                  <SearchIcon className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-red-500" data-testid="metabuscador-error">{error}</p>}
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="metabuscador-loading">
          <Loader2 className="h-4 w-4 animate-spin" /> Consultando fuentes externas…
        </div>
      )}

      {!isLoading && lastTerm && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Resultados para <span className="font-medium text-foreground">“{lastTerm}”</span>.
          </span>
          <span>
            Mostrar {results.length} {results.length === 1 ? "resultado" : "resultados"} combinados.
          </span>
        </div>
      )}

      <div className="grid gap-4" data-testid="metabuscador-results">
        {!isLoading && results.length === 0 && lastTerm && !error && (
          <Card>
            <CardHeader>
              <CardTitle>Sin coincidencias encontradas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Ajusta el término o prueba con sinónimos (“título preliminar”, “responsabilidad civil” etc.). Considera
              que algunos repositorios requieren autenticación institucional.
            </CardContent>
          </Card>
        )}

        {results.map((result, index) => (
          <Card key={`${result.link}-${index}`}>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <CardTitle className="text-lg font-semibold text-foreground">
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                    data-testid="metabuscador-result-link"
                  >
                    {result.title}
                  </a>
                </CardTitle>
                <Badge variant="secondary">Fuente: {result.source}</Badge>
              </div>
              <div>
                <a
                  href={result.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Abrir documento
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {result.snippet || "Sin resumen disponible."}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
