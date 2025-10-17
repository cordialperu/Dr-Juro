import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Camera,
  FileText,
  Image,
  Trash2,
  Loader2,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FolderDetailViewProps {
  folder: any;
  clientId: string;
  phase: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FolderDetailView({
  folder,
  clientId,
  phase,
  isOpen,
  onClose,
}: FolderDetailViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraCapturing, setIsCameraCapturing] = useState(false);

  // Obtener documentos de la carpeta
  const { data: documents = [], isLoading: isLoadingDocs } = useQuery<any[]>({
    queryKey: [`/api/folders/${folder.id}/documents`],
    enabled: isOpen && !!folder.id,
  });

  // Obtener texto consolidado
  const { data: consolidatedData, isLoading: isLoadingText } = useQuery<{
    consolidatedText: string;
    documentCount: number;
    tokenCount: number;
  }>({
    queryKey: [`/api/folders/${folder.id}/consolidated-text`],
    enabled: isOpen && !!folder.id,
  });

  // Subir archivo
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`/api/folders/${folder.id}/documents/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Error al subir archivo');
      }

      queryClient.invalidateQueries({ queryKey: [`/api/folders/${folder.id}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/folders/${folder.id}/consolidated-text`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/folders/${phase}`] });

      toast({
        title: 'Archivos subidos',
        description: `${files.length} archivo(s) procesado(s) correctamente`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al subir archivos',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Capturar con cámara
  const handleCameraCapture = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsCameraCapturing(true);
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`/api/folders/${folder.id}/camera-capture`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al procesar captura');

      queryClient.invalidateQueries({ queryKey: [`/api/folders/${folder.id}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/folders/${folder.id}/consolidated-text`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/folders/${phase}`] });

      toast({
        title: 'Foto capturada',
        description: 'Imagen optimizada y texto extraído con OCR',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al procesar captura de cámara',
        variant: 'destructive',
      });
    } finally {
      setIsCameraCapturing(false);
    }
  };

  // Eliminar documento
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/folders/${folder.id}/documents`] });
      queryClient.invalidateQueries({ queryKey: [`/api/folders/${folder.id}/consolidated-text`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/folders/${phase}`] });
      toast({
        title: 'Documento eliminado',
        description: 'El documento ha sido eliminado correctamente',
      });
    },
  });

  // Regenerar texto consolidado
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/folders/${folder.id}/regenerate-text`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Error al regenerar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/folders/${folder.id}/consolidated-text`] });
      toast({
        title: 'Texto regenerado',
        description: 'El texto consolidado ha sido actualizado',
      });
    },
  });

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('image')) return <Image className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{folder.name}</span>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleCameraCapture(e.target.files)}
              />
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isCameraCapturing}
              >
                {isCameraCapturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Archivos
                  </>
                )}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="documents" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents">
              Documentos ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="consolidated">
              Texto Consolidado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            {isLoadingDocs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">
                    No hay documentos en esta carpeta
                  </p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Sube archivos o captura fotos para comenzar
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <Card key={doc.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3 flex-1">
                        {getFileIcon(doc.fileType)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.fileName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{formatFileSize(parseInt(doc.fileSize || '0'))}</span>
                            <span>•</span>
                            <span>
                              {new Date(doc.uploadedAt).toLocaleDateString('es-PE')}
                            </span>
                            {doc.isProcessed === 'true' && (
                              <>
                                <span>•</span>
                                <Badge variant="secondary" className="text-xs">
                                  Procesado
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="consolidated" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {consolidatedData?.documentCount || 0} documentos consolidados •{' '}
                {consolidatedData?.tokenCount || 0} tokens aproximados
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
              >
                {regenerateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerar
              </Button>
            </div>

            {isLoadingText ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Textarea
                value={consolidatedData?.consolidatedText || ''}
                readOnly
                className="min-h-[400px] font-mono text-sm"
                placeholder="El texto extraído de todos los documentos aparecerá aquí..."
              />
            )}

            {consolidatedData?.consolidatedText && (
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(consolidatedData.consolidatedText);
                    toast({
                      title: 'Copiado',
                      description: 'Texto copiado al portapapeles',
                    });
                  }}
                >
                  Copiar Todo
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
