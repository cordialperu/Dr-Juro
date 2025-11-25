import { useState, FormEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from './FormField';
import { PhaseHeader } from './PhaseHeader';
import { Calendar as CalendarIcon } from 'lucide-react';

interface CitaPhaseProps {
  formData: Record<string, string>;
  completionPercentage: number;
  isSaving: boolean;
  onBack: () => void;
  onSave: (data: Record<string, string>) => void;
}

const FIELDS = [
  { name: 'meetingDate', label: 'Fecha de la Cita', type: 'date', required: true },
  { name: 'meetingTime', label: 'Hora', type: 'time', required: true },
  { name: 'location', label: 'Lugar de Reunión', type: 'text', placeholder: 'Oficina, videollamada, etc.' },
  { name: 'attendees', label: 'Asistentes', type: 'text', placeholder: 'Cliente, abogado, terceros' },
  { name: 'agenda', label: 'Agenda de la Reunión', type: 'textarea', placeholder: 'Temas a tratar' },
  { name: 'preparationNotes', label: 'Notas de Preparación', type: 'textarea', placeholder: 'Documentos a revisar, puntos clave' },
];

export function CitaPhase({
  formData,
  completionPercentage,
  isSaving,
  onBack,
  onSave,
}: CitaPhaseProps) {
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
        title="Programar Cita"
        description="Agendar reunión con el cliente para definir estrategia"
        color="green"
        icon={CalendarIcon}
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
