import { useState, FormEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from './FormField';
import { PhaseHeader } from './PhaseHeader';
import { DocumentFolder } from './DocumentFolder';
import { useDocumentFolders, type FolderConfig } from '@/hooks/useDocumentFolders';
import { CheckCircle2 } from 'lucide-react';

interface SeguimientoPhaseProps {
  clientId: string;
  formData: Record<string, string>;
  completionPercentage: number;
  isSaving: boolean;
  onBack: () => void;
  onSave: (data: Record<string, string>) => void;
}

const FIELDS = [
  { name: 'currentStatus', label: 'Estado Actual', type: 'text', required: true, placeholder: 'En trámite, en audiencia, resuelto, etc.' },
  { name: 'lastUpdate', label: 'Última Actualización', type: 'date' },
  { name: 'proximaAudiencia', label: 'Próxima Audiencia', type: 'date', placeholder: 'Fecha de la próxima audiencia' },
  { name: 'resolucionesEmitidas', label: 'Resoluciones Emitidas', type: 'textarea', placeholder: 'Resoluciones judiciales recibidas', folder: 'resoluciones_emitidas' },
  { name: 'pendingTasks', label: 'Tareas Pendientes', type: 'textarea', placeholder: 'Documentos por presentar, gestiones pendientes', folder: 'tareas_pendientes' },
  { name: 'observations', label: 'Observaciones', type: 'textarea', placeholder: 'Comentarios y notas adicionales', folder: 'observaciones' },
];

const FOLDER_CONFIGS: FolderConfig[] = [
  { type: 'actuaciones', name: 'Actuaciones Procesales' },
  { type: 'resoluciones', name: 'Resoluciones' },
  { type: 'escritos', name: 'Escritos Presentados' },
  { type: 'comunicaciones', name: 'Comunicaciones' },
  { type: 'seguimiento', name: 'Seguimiento General' },
  { type: 'resoluciones_emitidas', name: 'Resoluciones Emitidas' },
  { type: 'tareas_pendientes', name: 'Tareas Pendientes' },
  { type: 'observaciones', name: 'Observaciones' }
];

export function SeguimientoPhase({
  clientId,
  formData,
  completionPercentage,
  isSaving,
  onBack,
  onSave,
}: SeguimientoPhaseProps) {
  const [localData, setLocalData] = useState(formData);
  const { expandedFolders, uploadingFolders, toggleFolder, handleFileUpload } = 
    useDocumentFolders(clientId, 'seguimiento', FOLDER_CONFIGS);

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
        title="Seguimiento del Caso"
        description="Monitorear el progreso y actualizaciones del proceso"
        color="purple"
        icon={CheckCircle2}
        completionPercentage={completionPercentage}
        isSaving={isSaving}
        onBack={onBack}
        onSave={handleSubmit}
      />

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Estado del Proceso</h3>
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
