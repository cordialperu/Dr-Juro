import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  FileSearch, 
  Search, 
  BookOpen, 
  Bot,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useClient } from '@/contexts/ClientContext';
import { cn } from '@/lib/utils';

export function AnalysisToolbar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { client } = useClient();
  const [, navigate] = useLocation();

  if (!client) return null;

  const tools = [
    {
      id: 'ai-analysis',
      icon: Sparkles,
      label: 'Análisis IA',
      description: 'Analiza documentos con inteligencia artificial',
      gradient: 'from-violet-500 to-purple-600',
      action: () => navigate(`/client/${client.id}/ai-analysis`),
    },
    {
      id: 'document-search',
      icon: FileSearch,
      label: 'Buscar en PDFs',
      description: 'Búsqueda semántica en documentos del cliente',
      gradient: 'from-blue-500 to-cyan-600',
      action: () => navigate(`/client/${client.id}/documents`),
    },
    {
      id: 'jurisprudence',
      icon: BookOpen,
      label: 'Jurisprudencia',
      description: 'Consulta precedentes y jurisprudencia',
      gradient: 'from-amber-500 to-orange-600',
      action: () => navigate(`/client/${client.id}/jurisprudence`),
    },
    {
      id: 'metabuscador',
      icon: Search,
      label: 'Metabuscador',
      description: 'Búsqueda avanzada en múltiples fuentes',
      gradient: 'from-emerald-500 to-teal-600',
      action: () => navigate(`/client/${client.id}/metabuscador`),
    },
    {
      id: 'doctrina',
      icon: Bot,
      label: 'Doctrina',
      description: 'Consulta doctrina jurídica y normativa',
      gradient: 'from-rose-500 to-pink-600',
      action: () => navigate(`/client/${client.id}/doctrina`),
    },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Herramientas */}
        {isExpanded && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
            {tools.map((tool, index) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={tool.action}
                    size="lg"
                    className={cn(
                      "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
                      "bg-gradient-to-r hover:scale-110",
                      tool.gradient,
                      "text-white border-2 border-white/20"
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <tool.icon className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <div className="space-y-1">
                    <p className="font-semibold">{tool.label}</p>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Botón Toggle */}
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          size="lg"
          className={cn(
            "h-16 w-16 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300",
            "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
            "text-white border-4 border-white/30 hover:scale-105",
            isExpanded && "rotate-180"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-7 w-7" />
          ) : (
            <Sparkles className="h-7 w-7" />
          )}
        </Button>

        {/* Label flotante */}
        {!isExpanded && (
          <div className="absolute -top-12 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap animate-pulse">
            Herramientas IA
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
