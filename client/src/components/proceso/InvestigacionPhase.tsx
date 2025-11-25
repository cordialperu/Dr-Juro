import { useState, FormEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from './FormField';
import { PhaseHeader } from './PhaseHeader';
import { DocumentFolder } from './DocumentFolder';
import { useDocumentFolders, type FolderConfig } from '@/hooks/useDocumentFolders';
import { FileText } from 'lucide-react';

interface InvestigacionPhaseProps {
  clientId: string;
  formData: Record<string, string>;
  completionPercentage: number;
  isSaving: boolean;
  onBack: () => void;
  onSave: (data: Record<string, string>) => void;
}

const FIELDS = [
  { name: 'denunciaPolicial', label: 'Denuncia Policial', type: 'textarea', placeholder: 'Detalles de la denuncia policial', folder: 'denuncias' },
  { name: 'notificaciones', label: 'Notificaciones Recibidas', type: 'textarea', placeholder: 'Lista de notificaciones judiciales', folder: 'notificaciones' },
  { name: 'documentosAdicionales', label: 'Documentos Adicionales', type: 'textarea', placeholder: 'Otros documentos relevantes', folder: 'documentos_adicionales' },
  { name: 'testimonios', label: 'Testimonios', type: 'textarea', placeholder: 'Testimonios y declaraciones', folder: 'testimonios' },
  { name: 'evidenciaFotografica', label: 'Evidencia Fotográfica', type: 'textarea', placeholder: 'Descripción de evidencias fotográficas', folder: 'evidencia_fotografica' },
  { name: 'fechaInicio', label: 'Fecha de Inicio', type: 'date' },
  { name: 'estadoInvestigacion', label: 'Estado de la Investigación', type: 'text', placeholder: 'En proceso, completada, etc.', required: true },
];

const FOLDER_CONFIGS: FolderConfig[] = [
  { type: 'denuncias', name: 'Denuncias' },
  { type: 'notificaciones', name: 'Notificaciones' },
  { type: 'documentos_adicionales', name: 'Documentos Adicionales' },
  { type: 'testimonios', name: 'Testimonios' },
  { type: 'evidencia_fotografica', name: 'Evidencia Fotográfica' }
];

export function InvestigacionPhase({
  clientId,
  formData,
  completionPercentage,
  isSaving,
  onBack,
  onSave,
}: InvestigacionPhaseProps) {
  const [localData, setLocalData] = useState(formData);
  const { expandedFolders, uploadingFolders, toggleFolder, handleFileUpload } = 
    useDocumentFolders(clientId, 'avance_investigacion', FOLDER_CONFIGS);

  const handleChange = (name: string, value: string) => {
    setLocalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    onSave(localData);
  };

  return (
    <div>
      <PhaseHeader
        title="Avance de la Investigación"
        description="Recopilación de documentos, notificaciones y denuncias"
        color="yellow"
        icon={FileText}
        completionPercentage={completionPercentage}
        isSaving={isSaving}
        onBack={onBack}
        onSave={handleSubmit}
      />

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Información General</h3>
            {FIELDS.map((field) => (
              <FormField
                key={field.name}
                field={field}
                value={localData[field.name] || ''}
                onChange={handleChange}
              />
            ))}
          </CardContent>
        </Card>

        <div>
          <h3 className="text-lg font-semibold mb-4">Carpetas de Documentos</h3>
          <div className="space-y-3">
            {FOLDER_CONFIGS.map((folder) => (
              <DocumentFolder
                key={folder.type}
                folderType={folder.type}
                folderName={folder.name}
                isExpanded={expandedFolders.has(folder.type)}
                isUploading={uploadingFolders.has(folder.type)}
                onToggle={() => toggleFolder(folder.type)}
                onFileUpload={(e) => handleFileUpload(e, folder.type)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
