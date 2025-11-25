import { useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  FileSearch, 
  Scale, 
  BookOpen, 
  Search,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { MetaBuscadorTool } from '@/components/tools/MetaBuscadorTool';
import { PdfSearchTool } from '@/components/tools/PdfSearchTool';
import { UnmsmTool } from '@/components/tools/UnmsmTool';
import { DoctrinaTool } from '@/components/tools/DoctrinaTool';
import { DocumentAnalyzerTool } from '@/components/tools/DocumentAnalyzerTool';

interface ToolsProps {
  clientId: string;
}

const TOOLS = [
  {
    id: 'document-analyzer',
    title: 'Análisis de Documentos',
    description: 'Analiza documentos legales para extraer información clave y relevante',
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    available: true,
  },
  {
    id: 'pdf-search',
    title: 'Búsqueda en PDFs',
    description: 'Búsqueda semántica en todos los PDFs del cliente',
    icon: FileSearch,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    available: true,
  },
  {
    id: 'jurisprudence',
    title: 'Jurisprudencia',
    description: 'Busca jurisprudencia relevante para tus casos',
    icon: Scale,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950',
    available: true,
  },
  {
    id: 'doctrine',
    title: 'Doctrina Legal',
    description: 'Accede a doctrina y recursos legales académicos',
    icon: BookOpen,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    available: true,
  },
  {
    id: 'meta-search',
    title: 'Meta Buscador',
    description: 'Búsqueda unificada en múltiples fuentes legales',
    icon: Search,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50 dark:bg-pink-950',
    available: true,
  },
];

export function Tools({ clientId }: ToolsProps) {
  const { client } = useClient();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const renderTool = () => {
    switch (selectedTool) {
      case 'meta-search':
        return <MetaBuscadorTool clientId={clientId} />;
      case 'pdf-search':
        return <PdfSearchTool clientId={clientId} />;
      case 'jurisprudence':
        return <UnmsmTool clientId={clientId} />;
      case 'doctrine':
        return <DoctrinaTool clientId={clientId} />;
      case 'document-analyzer':
        return <DocumentAnalyzerTool clientId={clientId} />;
      default:
        return null;
    }
  };

  if (selectedTool) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedTool(null)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Herramientas
        </Button>
        {renderTool()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Herramientas de Análisis</h1>
        <p className="text-muted-foreground">
          Potencia tu trabajo legal con herramientas avanzadas de búsqueda y análisis
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          
          return (
            <Card
              key={tool.id}
              className="hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
              onClick={() => setSelectedTool(tool.id)}
            >
              <CardHeader>
                <div className={`h-12 w-12 rounded-lg ${tool.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {tool.title}
                </CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTool(tool.id);
                  }}
                >
                  Abrir herramienta
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contexto del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Todas las herramientas están configuradas para trabajar exclusivamente con los datos
            de <span className="font-medium text-foreground">{client?.name}</span>, garantizando
            confidencialidad y resultados específicos para este cliente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
