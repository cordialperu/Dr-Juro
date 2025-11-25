import { useState, FormEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from './FormField';
import { PhaseHeader } from './PhaseHeader';
import { DocumentFolder } from './DocumentFolder';
import { useDocumentFolders, type FolderConfig } from '@/hooks/useDocumentFolders';
import { Briefcase } from 'lucide-react';

interface EstrategiaPhaseProps {
  clientId: string;
  formData: Record<string, string>;
  completionPercentage: number;
  isSaving: boolean;
  onBack: () => void;
  onSave: (data: Record<string, string>) => void;
}

const FIELDS = [
  { name: 'entenderHechos', label: 'Entender los Hechos', type: 'textarea', required: true, placeholder: 'Cronología y descripción detallada de los hechos', folder: 'investigacion' },
  { name: 'teoriaDelCaso', label: 'Teoría del Caso', type: 'textarea', required: true, placeholder: 'Narrativa legal que explica los hechos', folder: 'analisis' },
  { name: 'objetivos', label: 'Objetivos', type: 'textarea', required: true, placeholder: 'Qué se busca lograr con el caso', folder: 'estrategia' },
  { name: 'fundamentoLegal', label: 'Fundamento Legal', type: 'textarea', placeholder: 'Leyes, artículos y precedentes aplicables', folder: 'precedentes' },
  { name: 'estrategiaDefensa', label: 'Estrategia de Defensa/Acción', type: 'textarea', placeholder: 'Cómo se abordará el caso', folder: 'estrategia' },
  { name: 'riesgos', label: 'Riesgos y Contingencias', type: 'textarea', placeholder: 'Posibles obstáculos y planes alternativos', folder: 'evidencias' },
];

const FOLDER_CONFIGS: FolderConfig[] = [
  { type: 'investigacion', name: 'Investigación' },
  { type: 'precedentes', name: 'Precedentes' },
  { type: 'evidencias', name: 'Evidencias' },
  { type: 'analisis', name: 'Análisis Legal' },
  { type: 'estrategia', name: 'Estrategia' }
];

export function EstrategiaPhase({
  clientId,
  formData,
  completionPercentage,
  isSaving,
  onBack,
  onSave,
}: EstrategiaPhaseProps) {
  const [localData, setLocalData] = useState(formData);
  const { expandedFolders, uploadingFolders, toggleFolder, handleFileUpload } = 
    useDocumentFolders(clientId, 'armar_estrategia', FOLDER_CONFIGS);

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
        title="Armar Estrategia"
        description="Entender los hechos, desarrollar teoría del caso y definir objetivos"
        color="orange"
        icon={Briefcase}
        completionPercentage={completionPercentage}
        isSaving={isSaving}
        onBack={onBack}
        onSave={handleSubmit}
      />

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Desarrollo de la Estrategia</h3>
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
