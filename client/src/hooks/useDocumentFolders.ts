import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface FolderConfig {
  type: string;
  name: string;
}

export function useDocumentFolders(clientId: string, phase: string, folderConfigs: FolderConfig[]) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [uploadingFolders, setUploadingFolders] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const toggleFolder = useCallback((folderType: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderType)) {
        next.delete(folderType);
      } else {
        next.add(folderType);
      }
      return next;
    });
  }, []);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>, folderType: string) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploadingFolders((prev) => new Set(prev).add(folderType));

      try {
        const formData = new FormData();
        formData.append('clientId', clientId);
        formData.append('phase', phase);
        formData.append('folderType', folderType);

        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }

        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!res.ok) throw new Error('Error al subir archivos');

        toast({
          title: 'Archivos subidos',
          description: `${files.length} archivo(s) subido(s) correctamente`,
        });
      } catch (error) {
        toast({
          title: 'Error al subir archivos',
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: 'destructive',
        });
      } finally {
        setUploadingFolders((prev) => {
          const next = new Set(prev);
          next.delete(folderType);
          return next;
        });
      }
    },
    [clientId, phase, toast]
  );

  return {
    expandedFolders,
    uploadingFolders,
    toggleFolder,
    handleFileUpload,
  };
}
