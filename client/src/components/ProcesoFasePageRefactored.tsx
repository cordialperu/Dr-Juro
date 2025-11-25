import { useClient } from '@/contexts/ClientContext';
import { useLocation, useRoute } from 'wouter';
import { useProcessState, useSaveProcessState } from '@/hooks/useProcessState';
import { RegistroPhase } from './proceso/RegistroPhase';
import { InvestigacionPhase } from './proceso/InvestigacionPhase';
import { EstrategiaPhase } from './proceso/EstrategiaPhase';
import { CitaPhase } from './proceso/CitaPhase';
import { SeguimientoPhase } from './proceso/SeguimientoPhase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type PhaseKey = 'registro' | 'avance_investigacion' | 'programar_cita' | 'armar_estrategia' | 'seguimiento';

const PHASE_PROCESS_MAP: Record<PhaseKey, string> = {
  registro: 'client-info',
  avance_investigacion: 'investigation',
  programar_cita: 'meeting',
  armar_estrategia: 'strategy',
  seguimiento: 'followup',
};

const PHASE_COMPLETION_TARGETS: Record<PhaseKey, number> = {
  registro: 10,
  avance_investigacion: 35,
  armar_estrategia: 60,
  programar_cita: 85,
  seguimiento: 100,
};

const toSafeRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const toSafeString = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return typeof value === 'string' ? value : String(value);
};

const toStringRecord = (input: Record<string, unknown>): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    result[key] = toSafeString(value);
  }
  return result;
};

export function ProcesoFasePage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/proceso/:clientId/:fase');
  const { toast } = useToast();

  const clientId = params?.clientId || '';
  const fase = (params?.fase || 'registro') as PhaseKey;

  const { data, isLoading } = useProcessState(clientId);
  const saveMutation = useSaveProcessState(clientId);

  if (!clientId) {
    navigate('/clients');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const processState = data?.processState;
  const currentPhase = PHASE_PROCESS_MAP[fase];
  const completionPercentage = processState?.completionPercentage 
    ? parseInt(String(processState.completionPercentage))
    : PHASE_COMPLETION_TARGETS[fase];

  const handleBack = () => {
    navigate('/procesos');
  };

  const handleSave = (phaseData: Record<string, string>) => {
    const phaseKey = fase === 'registro' ? 'clientInfo' 
      : fase === 'avance_investigacion' ? 'investigationProgress'
      : fase === 'armar_estrategia' ? 'caseStrategy'
      : fase === 'programar_cita' ? 'clientMeeting'
      : 'followUp';

    saveMutation.mutate({
      caseId: clientId,
      currentPhase,
      completionPercentage: String(PHASE_COMPLETION_TARGETS[fase]),
      [phaseKey]: phaseData,
    } as any);
  };

  // Extract current phase data
  const getCurrentPhaseData = (): Record<string, string> => {
    if (!processState) return {};

    switch (fase) {
      case 'registro':
        return toStringRecord(toSafeRecord(processState.clientInfo));
      case 'avance_investigacion':
        return toStringRecord(toSafeRecord(processState.investigationProgress));
      case 'armar_estrategia':
        return toStringRecord(toSafeRecord(processState.caseStrategy));
      case 'programar_cita':
        return toStringRecord(toSafeRecord(processState.clientMeeting));
      case 'seguimiento':
        return toStringRecord(toSafeRecord((processState as any).followUp));
      default:
        return {};
    }
  };

  const formData = getCurrentPhaseData();

  const commonProps = {
    formData,
    completionPercentage,
    isSaving: saveMutation.isPending,
    onBack: handleBack,
    onSave: handleSave,
  };

  switch (fase) {
    case 'registro':
      return <RegistroPhase {...commonProps} />;

    case 'avance_investigacion':
      return (
        <InvestigacionPhase
          {...commonProps}
          clientId={clientId}
        />
      );

    case 'armar_estrategia':
      return (
        <EstrategiaPhase
          {...commonProps}
          clientId={clientId}
        />
      );

    case 'programar_cita':
      return <CitaPhase {...commonProps} />;

    case 'seguimiento':
      return (
        <SeguimientoPhase
          {...commonProps}
          clientId={clientId}
        />
      );

    default:
      return <div>Fase no encontrada</div>;
  }
}
