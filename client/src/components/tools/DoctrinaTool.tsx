import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, BookOpen, Loader2, Save, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocTrinaToolProps {
  clientId: string;
}

interface DoctrineResult {
  id: string;
  titulo: string;
  autor: string;
  tipo: string;
  año: string;
  resumen: string;
  url?: string;
}

export function DoctrinaTool({ clientId }: DocTrinaToolProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'tema' | 'autor' | 'articulo'>('tema');
  const [results, setResults] = useState<DoctrineResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un término de búsqueda",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/doctrinas/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query.trim(),
          type: searchType 
        })
      });

      if (!response.ok) throw new Error('Error en la búsqueda');
      
      const data = await response.json();
      setResults(data.results || []);
      
      toast({
        title: "Búsqueda completada",
        description: `Se encontraron ${data.results?.length || 0} documentos`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo realizar la búsqueda de doctrina",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToLibrary = (docId: string) => {
    toast({
      title: "Guardado",
      description: "Documento añadido a la biblioteca del caso"
    });
    // TODO: Implementar guardado real en biblioteca
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Doctrina Legal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={searchType} onValueChange={(v: any) => setSearchType(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tema">Por Tema</SelectItem>
                <SelectItem value="autor">Por Autor</SelectItem>
                <SelectItem value="articulo">Por Artículo</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder={`Buscar ${searchType}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Doctrina Legal ({results.length})</h3>
          {results.map((result) => (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base mb-1">{result.titulo}</h4>
                      <div className="flex gap-3 text-sm text-muted-foreground mb-2">
                        <span>Autor: {result.autor}</span>
                        <span>Tipo: {result.tipo}</span>
                        <span>Año: {result.año}</span>
                      </div>
                      <p className="text-sm">{result.resumen}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => saveToLibrary(result.id)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      {result.url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={result.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
