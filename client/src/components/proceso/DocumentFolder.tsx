import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, FolderOpen, Upload, Loader2 } from 'lucide-react';
import { useRef } from 'react';

interface DocumentFolderProps {
  folderType: string;
  folderName: string;
  isExpanded: boolean;
  isUploading: boolean;
  onToggle: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DocumentFolder({
  folderType,
  folderName,
  isExpanded,
  isUploading,
  onToggle,
  onFileUpload,
}: DocumentFolderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <FolderOpen className="h-5 w-5 text-yellow-600" />
            ) : (
              <Folder className="h-5 w-5 text-yellow-600" />
            )}
            <CardTitle className="text-base">{folderName}</CardTitle>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
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
                Subir
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={onFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.docx,.txt"
          />
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>Arrastra archivos aquí o haz clic en "Subir"</p>
            <p className="text-xs mt-1">Formatos: PDF, JPG, PNG, DOCX, TXT</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
