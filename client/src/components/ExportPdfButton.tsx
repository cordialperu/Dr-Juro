import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ExportPdfButtonProps {
  caseId: string;
  caseTitle?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function ExportPdfButton({
  caseId,
  caseTitle,
  variant = "outline",
  size = "default",
}: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(true);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const params = new URLSearchParams({
        notes: includeNotes.toString(),
        timeline: includeTimeline.toString(),
        documents: includeDocuments.toString(),
      });

      const response = await fetch(`/api/cases/${caseId}/export/pdf?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to export PDF");
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `caso-${caseTitle || caseId}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF generado",
        description: "El archivo se ha descargado correctamente.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Incluir en el PDF</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={includeNotes}
          onCheckedChange={setIncludeNotes}
        >
          Notas del caso
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={includeTimeline}
          onCheckedChange={setIncludeTimeline}
        >
          Timeline de actividad
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={includeDocuments}
          onCheckedChange={setIncludeDocuments}
        >
          Lista de documentos
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <Button
          className="w-full"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? "Generando..." : "Descargar PDF"}
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
