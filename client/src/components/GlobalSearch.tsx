import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, FileText, StickyNote, X, Users, Folder, Scale, Clock, Home, Brain, ClipboardList, FolderOpen, Settings, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";
import { useClientsQuery } from "@/hooks/useClients";
import { useCasesQuery } from "@/hooks/useCases";
import { useTasksQuery } from "@/hooks/useTasks";

interface SearchResult {
  type: "note" | "document";
  id: string;
  title: string;
  content: string;
  preview: string;
  relevance: number;
  metadata?: {
    tags?: string[];
    fileType?: string;
    createdAt?: string;
  };
}

interface GlobalSearchProps {
  caseId: string;
  onResultClick?: (result: SearchResult) => void;
}

export default function GlobalSearch({ caseId, onResultClick }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  const { data: searchData, isLoading } = useQuery<{
    results: SearchResult[];
    query: string;
    total: number;
  }>({
    queryKey: ["/api/cases", caseId, "search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { results: [], query: debouncedQuery, total: 0 };
      }
      const response = await fetch(
        `/api/cases/${caseId}/search?q=${encodeURIComponent(debouncedQuery)}`
      );
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
    setOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    setSearchQuery("");
    setDebouncedQuery("");
  };

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prevOpen) => !prevOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const getIcon = (type: string) => {
    return type === "note" ? StickyNote : FileText;
  };

  const getTypeLabel = (type: string) => {
    return type === "note" ? "Nota" : "Documento";
  };

  const getTypeBadgeColor = (type: string) => {
    return type === "note"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  };

  const highlightMatches = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Search className="h-4 w-4 mr-2" />
          Buscar en caso
          <kbd className="ml-2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Búsqueda Global en Caso</DialogTitle>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="px-6 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en notas, documentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {searchData && searchData.total > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {searchData.total} resultado{searchData.total !== 1 ? "s" : ""} encontrado
              {searchData.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Results */}
        <ScrollArea className="h-[400px] px-6">
          {isLoading && debouncedQuery.length >= 2 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : searchData && searchData.results.length > 0 ? (
            <div className="space-y-3 py-4">
              {searchData.results.map((result) => {
                const IconComponent = getIcon(result.type);
                return (
                  <Card
                    key={`${result.type}-${result.id}`}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <IconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-medium truncate">
                              {highlightMatches(result.title, debouncedQuery)}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="secondary"
                                className={getTypeBadgeColor(result.type)}
                              >
                                {getTypeLabel(result.type)}
                              </Badge>
                              {result.metadata?.createdAt && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(result.metadata.createdAt), {
                                    addSuffix: true,
                                    locale: es,
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {highlightMatches(result.preview, debouncedQuery)}
                      </p>
                      {result.metadata?.tags && result.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {result.metadata.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : debouncedQuery.length >= 2 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">
                No se encontraron resultados para "{debouncedQuery}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Intenta con otras palabras clave
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">
                Escribe al menos 2 caracteres para buscar
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Busca en notas, documentos OCR y más
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
