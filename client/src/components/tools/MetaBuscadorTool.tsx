import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Loader2, Eye } from "lucide-react";

interface MetaBuscadorToolProps {
  clientId: string;
}

export function MetaBuscadorTool({}: MetaBuscadorToolProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [previewResult, setPreviewResult] = useState<any | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/metabuscador/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termino: query.trim() }),
      });
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Meta-buscador</CardTitle>
          <CardDescription>Búsqueda en múltiples fuentes legales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Término de búsqueda..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, i) => (
                <div key={`${result.link}-${i}`} className="rounded border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <a
                        href={result.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {result.title}
                      </a>
                      <p className="text-xs text-muted-foreground">Fuente: {result.source}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setPreviewResult(result)}>
                      <Eye className="mr-1 h-4 w-4" /> Ver detalle
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(previewResult)} onOpenChange={(open) => !open && setPreviewResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewResult?.title}</DialogTitle>
            <DialogDescription>Fuente: {previewResult?.source}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{previewResult?.snippet || "Sin resumen disponible."}</p>
            {previewResult && (
              <Button asChild variant="outline" size="sm">
                <a href={previewResult.link} target="_blank" rel="noreferrer">
                  Abrir documento
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
