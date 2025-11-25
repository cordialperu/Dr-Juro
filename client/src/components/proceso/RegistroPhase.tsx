import { useState, FormEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from './FormField';
import { PhaseHeader } from './PhaseHeader';
import { User } from 'lucide-react';

interface RegistroPhaseProps {
  formData: Record<string, string>;
  completionPercentage: number;
  isSaving: boolean;
  onBack: () => void;
  onSave: (data: Record<string, string>) => void;
}

const FIELDS = [
  { name: 'name', label: 'Nombre Completo', type: 'text', required: true },
  { name: 'contactInfo', label: 'Teléfono', type: 'text', required: true },
  { name: 'email', label: 'Correo Electrónico', type: 'email', required: false },
  { name: 'address', label: 'Dirección', type: 'text', required: false },
  { name: 'dni', label: 'DNI/RUC', type: 'text', required: false },
  { name: 'notes', label: 'Notas Adicionales', type: 'textarea', required: false },
];

export function RegistroPhase({
  formData,
  completionPercentage,
  isSaving,
  onBack,
  onSave,
}: RegistroPhaseProps) {
  const [localData, setLocalData] = useState(formData);

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
        title="Registro del Cliente"
        description="Información básica del cliente y datos de contacto"
        color="blue"
        icon={User}
        completionPercentage={completionPercentage}
        isSaving={isSaving}
        onBack={onBack}
        onSave={handleSubmit}
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6 space-y-4">
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
      </form>
    </div>
  );
}
