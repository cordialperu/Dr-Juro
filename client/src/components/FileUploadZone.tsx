import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, FileText, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileItem {
  id: string;
  name: string;
  content?: string;
  type: "file" | "note";
  uploadDate: string;
}

interface FileUploadZoneProps {
  title: string;
  description?: string;
  files: FileItem[];
  onFilesChange: (files: FileItem[]) => void;
  accept?: string;
  maxFiles?: number;
}

export function FileUploadZone({
  title,
  description,
  files = [],
  onFilesChange,
  accept = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png",
  maxFiles = 20,
}: FileUploadZoneProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Límite excedido",
        description: `Solo puedes subir hasta ${maxFiles} archivos`,
        variant: "destructive",
      });
      return;
    }

    const newFiles: FileItem[] = Array.from(selectedFiles).map((file) => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: "file" as const,
      uploadDate: new Date().toLocaleDateString("es-PE"),
    }));

    onFilesChange([...files, ...newFiles]);

    toast({
      title: "Archivo(s) agregado(s)",
      description: `${newFiles.length} archivo(s) subido(s)`,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddNote = () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      toast({
        title: "Error",
        description: "El título y contenido de la nota son obligatorios",
        variant: "destructive",
      });
      return;
    }

    const newNote: FileItem = {
      id: `note-${Date.now()}`,
      name: noteTitle,
      content: noteContent,
      type: "note",
      uploadDate: new Date().toLocaleDateString("es-PE"),
    };

    onFilesChange([...files, newNote]);

    toast({
      title: "Nota agregada",
      description: noteTitle,
    });

    setNoteTitle("");
    setNoteContent("");
    setIsAddingNote(false);
  };

  const handleRemoveFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
    toast({
      title: "Eliminado",
      description: "Archivo eliminado correctamente",
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mb-3">{description}</p>}

        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir Archivo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNote(!isAddingNote)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Nota de Texto
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple
          onChange={handleFileSelect}
        />

        {isAddingNote && (
          <Card className="p-4 mb-4">
            <div className="space-y-3">
              <div>
                <Label>Título de la Nota</Label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Ej: Observaciones importantes"
                />
              </div>
              <div>
                <Label>Contenido</Label>
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Escribe el contenido de la nota aquí..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddNote}>
                  Guardar Nota
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingNote(false);
                    setNoteTitle("");
                    setNoteContent("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay archivos ni notas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{file.type === "note" ? "📝 Nota" : "📎 Archivo"}</span>
                    <span>•</span>
                    <span>{file.uploadDate}</span>
                  </div>
                  {file.type === "note" && file.content && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {file.content}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(file.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
