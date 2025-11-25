import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  SearchFilters as SearchFiltersComponent,
  type SearchFilters as SearchFiltersValues,
} from "@/components/SearchFilters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useJurisprudenceSearch } from "@/hooks/useJurisprudence";
import { Loader2 } from "lucide-react";

export function JurisprudenciaPage() {
  const [, navigate] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);
  const jurisprudenceSearch = useJurisprudenceSearch();

  const handleSearch = useCallback(
    (filters: SearchFiltersValues) => {
      const query = filters.query.trim();
      if (!query) {
        return;
      }

      setModalOpen(true);
      setFullscreenMode(false);
      setLastQuery(query);
      setLastAnswer(null);
      jurisprudenceSearch.mutate(
        { query },
        {
          onSuccess: (data) => {
            setLastAnswer(data.answer);
          },
          onError: (error) => {
            const message =
              error.message ||
              "No se pudo obtener una respuesta de la jurisprudencia. Verifica la configuración de Gemini.";
            setLastAnswer(message);
          },
        },
      );
    },
    [jurisprudenceSearch],
  );

  const handleReset = useCallback(() => {
    setLastQuery(null);
    setLastAnswer(null);
    setFullscreenMode(false);
    jurisprudenceSearch.reset();
    navigate("/jurisprudencia");
  }, [jurisprudenceSearch, navigate]);

  const handleDoubleClick = useCallback(() => {
    setFullscreenMode(true);
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setFullscreenMode(false);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Jurisprudencia</h1>
        <p className="text-muted-foreground mt-2">
          Búsqueda y análisis de precedentes legales peruanos
        </p>
      </div>
      
      <SearchFiltersComponent onSearch={handleSearch} onReset={handleReset} />

      <Dialog open={modalOpen && !fullscreenMode} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Resultado de la búsqueda</DialogTitle>
            <DialogDescription>
              {jurisprudenceSearch.isPending
                ? "Consultando Gemini…"
                : lastQuery
                  ? `Consulta: ${lastQuery}`
                  : "Sin consulta"}
            </DialogDescription>
            {lastAnswer && (
              <p className="text-xs text-muted-foreground pt-2">
                💡 Haz doble clic en el texto para abrir en modo lectura completa
              </p>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {jurisprudenceSearch.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Procesando consulta…
              </div>
            )}
            {lastAnswer && (
              <div 
                onDoubleClick={handleDoubleClick}
                className="whitespace-pre-wrap rounded-md border border-border/60 bg-muted/30 p-4 text-sm text-foreground leading-relaxed cursor-pointer hover:border-primary/50 transition-colors"
              >
                {lastAnswer}
              </div>
            )}
            {!jurisprudenceSearch.isPending && !lastAnswer && (
              <p className="text-sm text-muted-foreground">Sin resultados por mostrar.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Reading Mode */}
      <Dialog open={fullscreenMode} onOpenChange={handleCloseFullscreen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl">Modo Lectura</DialogTitle>
            <DialogDescription>
              {lastQuery ? `Consulta: ${lastQuery}` : "Resultado de la búsqueda"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {lastAnswer && (
              <div className="max-w-4xl mx-auto">
                <div className="whitespace-pre-wrap text-base leading-loose text-foreground">
                  {lastAnswer}
                </div>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/30 flex justify-end">
            <Button onClick={handleCloseFullscreen} variant="outline">
              Cerrar modo lectura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
