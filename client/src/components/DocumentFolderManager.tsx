import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Folder, Upload, Camera, FileText, Image as ImageIcon, Loader2, Trash2, Eye, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentFolderManagerProps {
  clientId: string | number;
  phase: string;
  onDocumentUploaded?: () => void;
  readOnly?: boolean;
}

// Carpetas predefinidas por fase (solo rutas de organización)
const FOLDER_CONFIGS: Record<string, Array<{ type: string; name: string; description: string }>> = {
  // Fase de Investigación
  investigacion: [
    { type: 'denuncias', name: 'Denuncias', description: 'Denuncias policiales y formales' },
    { type: 'notificaciones', name: 'Notificaciones', description: 'Notificaciones judiciales y oficiales' },
    { type: 'documentos_adicionales', name: 'Documentos Adicionales', description: 'Otros documentos relevantes del caso' },
    { type: 'testimonios', name: 'Testimonios', description: 'Declaraciones y testimonios de testigos' },
    { type: 'evidencia_fotografica', name: 'Evidencia Fotográfica', description: 'Fotos, capturas y material visual' },
  ],
  // Fase de Reunión
  reunion: [
    { type: 'agenda', name: 'Agenda', description: 'Documentos de la agenda de reunión' },
    { type: 'materiales_presentacion', name: 'Materiales de Presentación', description: 'PPT, resúmenes, informes para el cliente' },
    { type: 'documentos_revisar', name: 'Documentos a Revisar', description: 'Documentos que se revisarán con el cliente' },
    { type: 'notas_preparacion', name: 'Notas de Preparación', description: 'Notas y apuntes para la reunión' },
  ],
  // Fase de Estrategia
  estrategia: [
    { type: 'analisis_hechos', name: 'Análisis de Hechos', description: 'Cronología y análisis detallado de los hechos' },
    { type: 'teoria_caso', name: 'Teoría del Caso', description: 'Documentos de la teoría legal del caso' },
    { type: 'fundamentos_legales', name: 'Fundamentos Legales', description: 'Leyes, artículos, jurisprudencia aplicable' },
    { type: 'precedentes', name: 'Precedentes', description: 'Casos similares y precedentes judiciales' },
    { type: 'estrategia_accion', name: 'Estrategia de Acción', description: 'Plan de acción y tácticas legales' },
  ],
  // Fase de Seguimiento
  seguimiento: [
    { type: 'resoluciones', name: 'Resoluciones', description: 'Resoluciones judiciales emitidas' },
    { type: 'actas_audiencias', name: 'Actas de Audiencias', description: 'Registros de audiencias realizadas' },
    { type: 'comunicaciones', name: 'Comunicaciones', description: 'Oficios y comunicaciones oficiales' },
    { type: 'reportes', name: 'Reportes', description: 'Reportes de avance y estado del caso' },
    { type: 'documentos_presentados', name: 'Documentos Presentados', description: 'Escritos y documentos presentados al juzgado' },
  ],
};

export function DocumentFolderManager({ clientId, phase, onDocumentUploaded, readOnly }: DocumentFolderManagerProps) {
  const queryClient = useQueryClient();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFolderForView, setSelectedFolderForView] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isReadOnly = Boolean(readOnly);

  const folders = FOLDER_CONFIGS[phase] || [];
  
  // Debug: Solo log si hay error
  if (folders.length === 0) {
    console.warn('⚠️ No folders configured for phase:', phase, '| Available phases:', Object.keys(FOLDER_CONFIGS));
  }

  // Obtener documentos agrupados por carpeta
  const { data: documents = [] } = useQuery<any[]>({
    queryKey: [`/api/clients/${clientId}/documents/${phase}`],
  });

  // Obtener texto consolidado
  const { data: consolidatedData } = useQuery<{
    consolidatedText: string;
    documentCount: number;
    tokenCount: number;
  }>({
    queryKey: [`/api/clients/${clientId}/documents/${phase}/consolidated`],
  });

  // Subir archivo
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedFolder) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderType', selectedFolder);
        formData.append('phase', phase);

        const response = await fetch(`/api/clients/${clientId}/documents/upload`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (!result.success) {
          console.error('Error al subir:', file.name, result);
        }
      }

      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/documents/${phase}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/documents/${phase}/consolidated`] });
      
      // Callback para recargar textos consolidados en el formulario
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }
      
      setIsUploadDialogOpen(false);
      setSelectedFolder('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error al subir archivos');
    } finally {
      setIsUploading(false);
    }
  };

  // Captura de cámara
  const handleCameraCapture = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedFolder) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', files[0]);
      formData.append('folderType', selectedFolder);
      formData.append('phase', phase);

      await fetch(`/api/clients/${clientId}/documents/camera-capture`, {
        method: 'POST',
        body: formData,
      });

      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/documents/${phase}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/documents/${phase}/consolidated`] });
      
      // Callback para recargar textos consolidados en el formulario
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }
      
      setIsCameraDialogOpen(false);
      setSelectedFolder('');
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    } catch (error) {
      console.error('Error capturing image:', error);
      alert('Error al capturar imagen');
    } finally {
      setIsUploading(false);
    }
  };

  // Eliminar documento
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await fetch(`/api/documents/${documentId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/documents/${phase}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/documents/${phase}/consolidated`] });
    },
  });

  // Agrupar documentos por carpeta
  const documentsByFolder = documents.reduce((acc: Record<string, any[]>, doc: any) => {
    if (!acc[doc.folderType]) acc[doc.folderType] = [];
    acc[doc.folderType].push(doc);
    return acc;
  }, {});

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocumentUrl = (doc: any) => {
    const targetClientId = doc.clientId ?? clientId;
    return `/api/clients/${encodeURIComponent(targetClientId)}/documents/${encodeURIComponent(doc.phase)}/${encodeURIComponent(doc.folderType)}/${encodeURIComponent(doc.id)}/download`;
  };

  const renderPreviewContent = (doc: any) => {
    const previewUrl = getDocumentUrl(doc);

    if (doc.fileType?.startsWith('image/')) {
      return (
        <div className="flex h-full items-center justify-center bg-muted">
          <img src={previewUrl} alt={doc.fileName} className="max-h-full max-w-full rounded" />
        </div>
      );
    }

    if (doc.fileType === 'application/pdf') {
      return (
        <iframe
          title={doc.fileName}
          src={previewUrl}
          className="h-full w-full rounded border"
        />
      );
    }

    if (doc.fileType?.startsWith('text/') || doc.extractedText) {
      return (
        <ScrollArea className="h-full rounded border bg-muted/30 p-4">
          <pre className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
            {doc.extractedText || 'No se pudo extraer texto de este archivo.'}
          </pre>
        </ScrollArea>
      );
    }

    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <FileText className="h-10 w-10" />
        <p>No se puede previsualizar este formato. Descarga el archivo para revisarlo.</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gestión de Documentos</h3>
        {!isReadOnly && (
          <div className="flex gap-2">
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Añadir Archivo
            </Button>
            <Button variant="outline" onClick={() => setIsCameraDialogOpen(true)}>
              <Camera className="h-4 w-4 mr-2" />
              Capturar con Cámara
            </Button>
          </div>
        )}
      </div>

      {/* Grid de Carpetas con lista de documentos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => {
          const folderDocs = documentsByFolder[folder.type] || [];
          const docCount = folderDocs.length;
          return (
            <Card
              key={folder.type}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedFolderForView(folder.type)}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Header de carpeta */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Folder className="h-8 w-8 text-primary" />
                      <div>
                        <h4 className="font-semibold">{folder.name}</h4>
                        <p className="text-xs text-muted-foreground">{folder.description}</p>
                      </div>
                    </div>
                    {docCount > 0 && (
                      <Badge variant="secondary">{docCount}</Badge>
                    )}
                  </div>
                  
                  {/* Lista de documentos */}
                  {folderDocs.length > 0 && (
                    <div className="border-t pt-2 space-y-1">
                      {folderDocs.slice(0, 3).map((doc: any) => (
                        <div key={doc.id} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {getFileIcon(doc.fileType)}
                          <span className="truncate flex-1">{doc.fileName}</span>
                        </div>
                      ))}
                      {folderDocs.length > 3 && (
                        <p className="text-xs text-muted-foreground italic">
                          +{folderDocs.length - 3} más...
                        </p>
                      )}
                    </div>
                  )}
                  
                  {folderDocs.length === 0 && (
                    <p className="text-xs text-muted-foreground italic border-t pt-2">
                      Sin documentos
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Diálogo de Subida */}
      {!isReadOnly && (
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Archivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">¿A qué carpeta deseas añadir el archivo?</label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecciona una carpeta" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  {folders.map((folder) => (
                    <SelectItem key={folder.type} value={folder.type}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {folders.length === 0 && (
                <p className="text-sm text-destructive mt-2">⚠️ No hay carpetas disponibles para esta fase</p>
              )}
            </div>

            {selectedFolder && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload-input"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                  type="button"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar Archivos
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Selecciona uno o varios archivos (PDF, Word, imágenes, etc.)
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Diálogo de Cámara */}
      {!isReadOnly && (
      <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Capturar con Cámara</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">¿A qué carpeta deseas añadir la foto?</label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecciona una carpeta" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.type} value={folder.type}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFolder && (
              <div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleCameraCapture(e.target.files)}
                  className="hidden"
                />
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Abrir Cámara
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Vista de Documentos en Carpeta */}
      {selectedFolderForView && (
        <Dialog open={!!selectedFolderForView} onOpenChange={() => setSelectedFolderForView(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {folders.find(f => f.type === selectedFolderForView)?.name}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="documents">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="documents">Documentos</TabsTrigger>
                <TabsTrigger value="consolidated">Texto Consolidado</TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="space-y-4">
                {documentsByFolder[selectedFolderForView]?.map((doc: any) => (
                  <Card 
                    key={doc.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onDoubleClick={() => setPreviewDocument(doc)}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.fileType)}
                        <div>
                          <p className="font-medium">{doc.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(doc.fileSize)} • {new Date(doc.uploadedAt).toLocaleDateString('es-PE')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            💡 Doble clic para ver documento
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDocument(doc);
                          }}
                          title="Ver documento"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!isReadOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(doc.id);
                            }}
                            title="Eliminar documento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!documentsByFolder[selectedFolderForView] || documentsByFolder[selectedFolderForView].length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay documentos en esta carpeta
                  </p>
                )}
              </TabsContent>

              <TabsContent value="consolidated">
                <div className="space-y-4">
                  <Textarea
                    value={consolidatedData?.consolidatedText || 'No hay texto consolidado disponible'}
                    readOnly
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{consolidatedData?.documentCount || 0} documentos</span>
                    <span>{consolidatedData?.tokenCount || 0} tokens aproximados</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Visor de documentos */}
      <Dialog open={!!previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)}>
        <DialogContent className="max-w-5xl h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-1">
              <span>{previewDocument?.fileName}</span>
              {previewDocument && (
                <span className="text-sm font-normal text-muted-foreground">
                  {formatFileSize(previewDocument.fileSize)} • {new Date(previewDocument.uploadedAt).toLocaleString('es-PE')}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {previewDocument && (
            <div className="flex h-full flex-col gap-4">
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={getDocumentUrl(previewDocument)} target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </a>
                </Button>
              </div>
              <div className="flex-1 overflow-hidden rounded border bg-background">
                {renderPreviewContent(previewDocument)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
