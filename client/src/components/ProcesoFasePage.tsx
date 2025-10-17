import { useSelectedClient } from '@/contexts/ClientContext';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Briefcase,
  Calendar as CalendarIcon,
  CheckCircle2,
  Save,
  AlertCircle,
  Folder,
  FolderOpen,
  Camera,
  Upload,
  Loader2,
  ExternalLink,
  Wrench,
  Check,
  Search,
  Trash2
} from 'lucide-react';
import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CaseProcessState, Doctrina } from '@shared/schema';
import { cn } from '@/lib/utils';

// Configuración de carpetas por fase
const FOLDER_CONFIGS: Record<string, Array<{ type: string; name: string }>> = {
  avance_investigacion: [
    { type: 'denuncias', name: 'Denuncias' },
    { type: 'notificaciones', name: 'Notificaciones' },
    { type: 'documentos_adicionales', name: 'Documentos Adicionales' },
    { type: 'testimonios', name: 'Testimonios' },
    { type: 'evidencia_fotografica', name: 'Evidencia Fotográfica' }
  ],
  programar_cita: [
    { type: 'agenda', name: 'Agenda' },
    { type: 'materiales', name: 'Materiales de Reunión' },
    { type: 'acuerdos', name: 'Acuerdos Previos' },
    { type: 'documentos_revision', name: 'Documentos para Revisión' }
  ],
  armar_estrategia: [
    { type: 'investigacion', name: 'Investigación' },
    { type: 'precedentes', name: 'Precedentes' },
    { type: 'evidencias', name: 'Evidencias' },
    { type: 'analisis', name: 'Análisis Legal' },
    { type: 'estrategia', name: 'Estrategia' }
  ],
  seguimiento: [
    { type: 'actuaciones', name: 'Actuaciones Procesales' },
    { type: 'resoluciones', name: 'Resoluciones' },
    { type: 'escritos', name: 'Escritos Presentados' },
    { type: 'comunicaciones', name: 'Comunicaciones' },
    { type: 'seguimiento', name: 'Seguimiento General' },
    { type: 'resoluciones_emitidas', name: 'Resoluciones Emitidas' },
    { type: 'tareas_pendientes', name: 'Tareas Pendientes' },
    { type: 'observaciones', name: 'Observaciones' }
  ]
};

// Definir las configuraciones de cada fase
const FASE_CONFIG = {
  registro: {
    title: 'Registro del Cliente',
    icon: User,
    description: 'Información básica del cliente y datos de contacto',
    color: 'blue',
    fields: [
      { name: 'name', label: 'Nombre Completo', type: 'text', required: true },
      { name: 'contactInfo', label: 'Teléfono', type: 'text', required: true },
      { name: 'email', label: 'Correo Electrónico', type: 'email', required: false },
      { name: 'address', label: 'Dirección', type: 'text', required: false },
      { name: 'dni', label: 'DNI/RUC', type: 'text', required: false },
      { name: 'notes', label: 'Notas Adicionales', type: 'textarea', required: false },
    ]
  },
  avance_investigacion: {
    title: 'Avance de la Investigación',
    icon: FileText,
    description: 'Recopilación de documentos, notificaciones y denuncias',
    color: 'yellow',
    fields: [
      { name: 'denunciaPolicial', label: 'Denuncia Policial', type: 'textarea', required: false, placeholder: 'Detalles de la denuncia policial', folder: 'denuncias' },
      { name: 'notificaciones', label: 'Notificaciones Recibidas', type: 'textarea', required: false, placeholder: 'Lista de notificaciones judiciales', folder: 'notificaciones' },
      { name: 'documentosAdicionales', label: 'Documentos Adicionales', type: 'textarea', required: false, placeholder: 'Otros documentos relevantes', folder: 'documentos_adicionales' },
      { name: 'testimonios', label: 'Testimonios', type: 'textarea', required: false, placeholder: 'Testimonios y declaraciones', folder: 'testimonios' },
      { name: 'evidenciaFotografica', label: 'Evidencia Fotográfica', type: 'textarea', required: false, placeholder: 'Descripción de evidencias fotográficas', folder: 'evidencia_fotografica' },
      { name: 'fechaInicio', label: 'Fecha de Inicio', type: 'date', required: false },
      { name: 'estadoInvestigacion', label: 'Estado de la Investigación', type: 'text', required: false, placeholder: 'En proceso, completada, etc.' },
    ]
  },
  programar_cita: {
    title: 'Programar Cita',
    icon: CalendarIcon,
    description: 'Agendar reunión con el cliente para definir estrategia',
    color: 'green',
    fields: [
      { name: 'meetingDate', label: 'Fecha de la Cita', type: 'date', required: true },
      { name: 'meetingTime', label: 'Hora', type: 'time', required: true },
      { name: 'location', label: 'Lugar de Reunión', type: 'text', required: false, placeholder: 'Oficina, videollamada, etc.' },
      { name: 'attendees', label: 'Asistentes', type: 'text', required: false, placeholder: 'Cliente, abogado, terceros' },
      { name: 'agenda', label: 'Agenda de la Reunión', type: 'textarea', required: false, placeholder: 'Temas a tratar', folder: 'agenda' },
      { name: 'preparationNotes', label: 'Notas de Preparación', type: 'textarea', required: false, placeholder: 'Documentos a revisar, puntos clave', folder: 'materiales' },
    ]
  },
  armar_estrategia: {
    title: 'Armar Estrategia',
    icon: Briefcase,
    description: 'Entender los hechos, desarrollar teoría del caso y definir objetivos',
    color: 'orange',
    fields: [
      { name: 'entenderHechos', label: 'Entender los Hechos', type: 'textarea', required: true, placeholder: 'Cronología y descripción detallada de los hechos', folder: 'investigacion' },
      { name: 'teoriaDelCaso', label: 'Teoría del Caso', type: 'textarea', required: true, placeholder: 'Narrativa legal que explica los hechos', folder: 'analisis' },
      { name: 'objetivos', label: 'Objetivos', type: 'textarea', required: true, placeholder: 'Qué se busca lograr con el caso', folder: 'estrategia' },
      { name: 'fundamentoLegal', label: 'Fundamento Legal', type: 'textarea', required: false, placeholder: 'Leyes, artículos y precedentes aplicables', folder: 'precedentes' },
      { name: 'estrategiaDefensa', label: 'Estrategia de Defensa/Acción', type: 'textarea', required: false, placeholder: 'Cómo se abordará el caso', folder: 'estrategia' },
      { name: 'riesgos', label: 'Riesgos y Contingencias', type: 'textarea', required: false, placeholder: 'Posibles obstáculos y planes alternativos', folder: 'evidencias' },
    ]
  },
  seguimiento: {
    title: 'Seguimiento del Caso',
    icon: CheckCircle2,
    description: 'Monitorear el progreso y actualizaciones del proceso',
    color: 'purple',
    fields: [
      { name: 'currentStatus', label: 'Estado Actual', type: 'text', required: true, placeholder: 'En trámite, en audiencia, resuelto, etc.' },
      { name: 'lastUpdate', label: 'Última Actualización', type: 'date', required: false },
      { name: 'proximaAudiencia', label: 'Próxima Audiencia', type: 'date', required: false, placeholder: 'Fecha de la próxima audiencia' },
      { name: 'resolucionesEmitidas', label: 'Resoluciones Emitidas', type: 'textarea', required: false, placeholder: 'Resoluciones judiciales recibidas', folder: 'resoluciones_emitidas' },
      { name: 'pendingTasks', label: 'Tareas Pendientes', type: 'textarea', required: false, placeholder: 'Documentos por presentar, gestiones pendientes', folder: 'tareas_pendientes' },
      { name: 'observations', label: 'Observaciones', type: 'textarea', required: false, placeholder: 'Comentarios y notas adicionales', folder: 'observaciones' },
    ]
  }
};

type PhaseKey = keyof typeof FASE_CONFIG;

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

const PHASE_REQUIRED_FIELDS: Record<PhaseKey, string[]> = {
  registro: ['name', 'contactInfo'],
  avance_investigacion: ['estadoInvestigacion'],
  armar_estrategia: ['entenderHechos', 'teoriaDelCaso', 'objetivos'],
  programar_cita: ['meetingDate', 'meetingTime'],
  seguimiento: ['currentStatus'],
};

type CaseProcessStateWithFollowUp = CaseProcessState & {
  followUp?: Record<string, unknown>;
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

const extractFormDataFromProcessState = (
  phase: PhaseKey,
  state?: CaseProcessStateWithFollowUp | null,
): Record<string, string> => {
  if (!state) {
    return {};
  }

  const clientInfo = toSafeRecord(state.clientInfo);
  const investigationProgress = toSafeRecord(state.investigationProgress);
  const caseStrategy = toSafeRecord(state.caseStrategy);
  const clientMeeting = toSafeRecord(state.clientMeeting);
  const followUp = toSafeRecord(state.followUp);

  switch (phase) {
    case 'registro':
      return {
        name: toSafeString(clientInfo.name),
        contactInfo: toSafeString(clientInfo.phone ?? clientInfo.contactInfo),
        email: toSafeString(clientInfo.email),
        address: toSafeString(clientInfo.address),
        dni: toSafeString(clientInfo.dni),
        notes: toSafeString(clientInfo.notes),
      };
    case 'avance_investigacion':
      return {
        denunciaPolicial: toSafeString(investigationProgress.denunciaPolicial),
        notificaciones: toSafeString(investigationProgress.notificaciones),
        documentosAdicionales: toSafeString(investigationProgress.documentosAdicionales),
        testimonios: toSafeString(investigationProgress.testimonios),
        evidenciaFotografica: toSafeString(investigationProgress.evidenciaFotografica),
        fechaInicio: toSafeString(investigationProgress.fechaInicio),
        estadoInvestigacion: toSafeString(investigationProgress.estadoInvestigacion),
      };
    case 'armar_estrategia':
      return {
        entenderHechos: toSafeString(caseStrategy.entenderHechos),
        teoriaDelCaso: toSafeString(caseStrategy.teoriaDelCaso),
        objetivos: toSafeString(caseStrategy.objetivos),
        fundamentoLegal: toSafeString(caseStrategy.fundamentoLegal),
        estrategiaDefensa: toSafeString(caseStrategy.estrategiaDefensa),
        riesgos: toSafeString(caseStrategy.riesgos),
      };
    case 'programar_cita':
      return {
        meetingDate: toSafeString(clientMeeting.date),
        meetingTime: toSafeString(clientMeeting.time),
        location: toSafeString(clientMeeting.location),
        attendees: toSafeString(clientMeeting.attendees),
        agenda: toSafeString(clientMeeting.agenda),
        preparationNotes: toSafeString(clientMeeting.preparationNotes),
      };
    case 'seguimiento':
      return {
        currentStatus: toSafeString(followUp.currentStatus),
        lastUpdate: toSafeString(followUp.lastUpdate),
        proximaAudiencia: toSafeString(followUp.proximaAudiencia),
        resolucionesEmitidas: toSafeString(followUp.resolucionesEmitidas),
        pendingTasks: toSafeString(followUp.pendingTasks),
        observations: toSafeString(followUp.observations),
      };
    default:
      return {};
  }
};

const hasFilledValue = (value?: string) => Boolean(value && value.trim().length > 0);

const calculateCompletionForPhase = (
  phase: PhaseKey,
  data: Record<string, string>,
  previous: number,
): number => {
  const required = PHASE_REQUIRED_FIELDS[phase];
  if (!required) {
    console.log(`⚠️ No required fields for phase: ${phase}`);
    return previous;
  }

  const isComplete = required.every((field) => {
    const value = data[field];
    const filled = hasFilledValue(value);
    console.log(`  Field "${field}": "${value}" → filled: ${filled}`);
    return filled;
  });
  
  console.log(`Phase "${phase}" complete: ${isComplete}, required fields:`, required);
  
  if (!isComplete) {
    console.log(`❌ Phase incomplete, keeping previous: ${previous}%`);
    return previous;
  }

  const target = PHASE_COMPLETION_TARGETS[phase] ?? previous;
  const newValue = Math.max(previous, target);
  console.log(`✅ Phase complete! Previous: ${previous}%, Target: ${target}%, New: ${newValue}%`);
  return newValue;
};

interface ClientDocument {
  id: string;
  clientId: string;
  phase: string;
  folderType: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  uploadedAt: string;
  uploadedBy: string;
}

type ToolType = 'jurisprudencia' | 'analisis' | 'doctrina' | 'metabuscador';

interface ToolContextField {
  scope: 'field';
  fieldName: string;
  fieldLabel: string;
  folderType?: string;
  text: string;
}

interface ToolContextDocument {
  scope: 'document';
  document: ClientDocument;
  text: string;
}

type ToolContext = ToolContextField | ToolContextDocument;

interface JurisprudenceResult {
  term: string;
  answer: string;
  references?: string[];
}

interface AnalysisResult {
  documentSummary: string;
  keyLegalConcepts: string[];
  legalAreas: string[];
  relevantArticles: string[];
  precedentsFound: Array<{
    id: string;
    title: string;
    court: string;
    chamber: string;
    date: string;
    caseNumber: string;
    bindingLevel: string;
    summary: string;
    confidence: number;
    articlesMatched: string[];
    excerpt: string;
    officialLink?: string;
  }>;
  recommendations: string[];
  risks: string[];
  confidence: number;
  note?: string;
}

interface MetaBuscadorResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

interface MetaBuscadorResponse {
  term?: string;
  results: MetaBuscadorResult[];
}

type ToolResult =
  | { tool: 'jurisprudencia'; data: JurisprudenceResult }
  | { tool: 'analisis'; data: AnalysisResult }
  | { tool: 'doctrina'; data: { items: Doctrina[]; query: string } }
  | { tool: 'metabuscador'; data: MetaBuscadorResponse };

const TOOL_OPTIONS: Array<{ type: ToolType; label: string; description: string }> = [
  { type: 'jurisprudencia', label: 'Jurisprudencia', description: 'Buscar precedentes y criterios relevantes.' },
  { type: 'analisis', label: 'Análisis de documentos', description: 'Generar análisis completo del texto seleccionado.' },
  { type: 'doctrina', label: 'Doctrina', description: 'Consultar doctrina relacionada con el texto.' },
  { type: 'metabuscador', label: 'Meta buscador', description: 'Consultar fuentes externas (PUCP, UNMSM, TC).' }
];

const TOOL_LABELS: Record<ToolType, string> = {
  jurisprudencia: 'Jurisprudencia',
  analisis: 'Análisis de documentos',
  doctrina: 'Doctrina',
  metabuscador: 'Meta buscador'
};

const formatFileSize = (bytes: number | null | undefined): string => {
  if (!Number.isFinite(bytes) || !bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatUploadDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida';
  return date.toLocaleString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const truncateForTool = (text: string, limit = 4000): string => {
  if (text.length <= limit) return text;
  return text.slice(0, limit);
};

export function ProcesoFasePage() {
  const { selectedClient, setSelectedClient } = useSelectedClient();
  const [, navigate] = useLocation();
  const [, params] = useRoute('/proceso/:clientId/:fase');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fase = params?.fase as keyof typeof FASE_CONFIG || 'registro';
  const config = FASE_CONFIG[fase];

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Estados para diálogos de documentos
  const [isSelectFolderDialogOpen, setIsSelectFolderDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'camera' | null>(null);
  const [selectedFolderForUpload, setSelectedFolderForUpload] = useState<string>('');
  const [documentTrigger, setDocumentTrigger] = useState(0);
  const [isDocumentsDialogOpen, setIsDocumentsDialogOpen] = useState(false);
  const [selectedFolderForView, setSelectedFolderForView] = useState<string>('');
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [toolContext, setToolContext] = useState<ToolContext | null>(null);
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [toolError, setToolError] = useState<string | null>(null);
  const [isToolRunning, setIsToolRunning] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [storedResults, setStoredResults] = useState<{
    field: Record<string, Partial<Record<ToolType, ToolResult>>>;
    document: Record<string, Partial<Record<ToolType, ToolResult>>>;
  }>({ field: {}, document: {} });
  const [metaSearchTerm, setMetaSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isChangingFolderRef = useRef(false);

  const clientId = selectedClient?.id;
  const folders = FOLDER_CONFIGS[fase] || [];

  const processQuery = useQuery<{ processState: CaseProcessState | null; documents: unknown[] }>(
    {
      queryKey: ['/api/cases', clientId, 'process'],
      enabled: Boolean(clientId),
      retry: false,
      queryFn: async () => {
        if (!clientId) {
          return { processState: null, documents: [] };
        }

        const response = await fetch(`/api/cases/${clientId}/process`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar el estado del proceso');
        }

        return response.json();
      },
    },
  );

  const phaseStateQuery = useQuery<{ data: Record<string, string>; updatedAt: string | null }>(
    {
      queryKey: ['/api/clients', clientId, 'phases', fase],
      enabled: Boolean(clientId),
      retry: false,
      queryFn: async () => {
        if (!clientId) {
          return { data: {}, updatedAt: null };
        }

        const response = await fetch(`/api/clients/${clientId}/phases/${fase}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar la información de la fase');
        }

        return response.json();
      },
    },
  );
  const processState = processQuery.data?.processState as CaseProcessStateWithFollowUp | null;

  const selectedFolderConfig = folders.find(folder => folder.type === selectedFolderForUpload);
  const selectedFolderConfigForView = folders.find(folder => folder.type === selectedFolderForView);

  useEffect(() => {
    setIsDirty(false);
  }, [clientId, fase]);

  useEffect(() => {
    if (!clientId) {
      setFormData({});
      setSelectedDate(undefined);
      return;
    }

    if (isDirty) {
      return;
    }

    const latestProcessState = processQuery.data?.processState as CaseProcessStateWithFollowUp | null;
    const latestPhaseData = phaseStateQuery.data?.data ?? {};

    const baseFromProcess = extractFormDataFromProcessState(fase as PhaseKey, latestProcessState);
    const mergedData = { ...baseFromProcess, ...latestPhaseData };

    setFormData(mergedData);

    if (fase === 'programar_cita') {
      const rawDate = mergedData.meetingDate;
      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!Number.isNaN(parsed.getTime())) {
          setSelectedDate(parsed);
        }
      } else {
        setSelectedDate(undefined);
      }
    } else {
      setSelectedDate(undefined);
    }
  }, [clientId, fase, processQuery.dataUpdatedAt, phaseStateQuery.dataUpdatedAt, isDirty]);

  const getFolderDisplayName = (folderType?: string) => {
    if (!folderType) return undefined;
    const match = folders.find(folder => folder.type === folderType);
    return match?.name ?? folderType;
  };

  const openDocumentsDialog = (folderType: string) => {
    setSelectedFolderForView(folderType);
    setIsDocumentsDialogOpen(true);
  };

  const handleDocumentsDialogChange = (open: boolean) => {
    if (open) {
      setIsDocumentsDialogOpen(true);
      return;
    }

    setIsDocumentsDialogOpen(false);
    setSelectedFolderForView('');
  };

  const handleOpenDocument = (document: ClientDocument) => {
    if (!selectedClient) return;
    if (typeof window === 'undefined') return;

    const downloadUrl = `/api/clients/${encodeURIComponent(selectedClient.id)}/documents/${encodeURIComponent(document.phase)}/${encodeURIComponent(document.folderType)}/${encodeURIComponent(document.id)}/download`;
    window.open(downloadUrl, '_blank', 'noopener');
  };

  const handleDeleteDocument = async (document: ClientDocument) => {
    if (!selectedClient) return;
    
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar "${document.fileName}"? Esta acción no se puede deshacer.`
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/clients/${encodeURIComponent(selectedClient.id)}/documents/${encodeURIComponent(document.phase)}/${encodeURIComponent(document.folderType)}/${encodeURIComponent(document.id)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('No se pudo eliminar el documento');
      }

      // Refrescar la lista de documentos
      setDocumentTrigger(prev => prev + 1);

      toast({
        title: 'Documento eliminado',
        description: `"${document.fileName}" ha sido eliminado correctamente.`,
      });
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast({
        title: 'Error al eliminar',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el documento.',
        variant: 'destructive',
      });
    }
  };

  const resetUploadState = () => {
    isChangingFolderRef.current = false;
    setIsSelectFolderDialogOpen(false);
    setIsUploadDialogOpen(false);
    setUploadMode(null);
    setSelectedFolderForUpload('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const openSelectFolderDialog = (mode: 'file' | 'camera') => {
    setUploadMode(mode);
    setIsSelectFolderDialogOpen(true);
  };

  const handleFolderSelection = (folderType: string) => {
    setSelectedFolderForUpload(folderType);
    setIsSelectFolderDialogOpen(false);
    setIsUploadDialogOpen(true);
  };

  const handleFolderDialogChange = (open: boolean) => {
    if (isUploading) return;
    setIsSelectFolderDialogOpen(open);
    if (!open && !isUploadDialogOpen) {
      setUploadMode(null);
      setSelectedFolderForUpload('');
    }
  };

  const handleUploadDialogChange = (open: boolean) => {
    if (isUploading) return;
    if (open) {
      setIsUploadDialogOpen(true);
    } else {
      if (isChangingFolderRef.current) {
        isChangingFolderRef.current = false;
        setIsUploadDialogOpen(false);
        return;
      }
      resetUploadState();
    }
  };

  const handleChangeFolder = () => {
    if (isUploading) return;
    isChangingFolderRef.current = true;
    setSelectedFolderForUpload('');
    setIsUploadDialogOpen(false);
    setIsSelectFolderDialogOpen(true);
  };

  const handleToolDialogChange = (open: boolean) => {
    if (open) {
      setIsToolDialogOpen(true);
      return;
    }

    setIsToolDialogOpen(false);
    setActiveTool(null);
    setToolContext(null);
    setToolResult(null);
    setToolError(null);
    setIsToolRunning(false);
    setIsReadingMode(false);
    setMetaSearchTerm('');
  };

  const getFieldKey = (fieldName: string, folderType?: string) => {
    return folderType ? `folder:${folderType}` : `field:${fieldName}`;
  };

  const getDocumentKey = (documentId: string) => `document:${documentId}`;

  const getStoredResult = (context: ToolContext, toolType: ToolType): ToolResult | null => {
    if (context.scope === 'field') {
      const key = getFieldKey(context.fieldName, context.folderType);
      return storedResults.field[key]?.[toolType] ?? null;
    }
    const key = getDocumentKey(context.document.id);
    return storedResults.document[key]?.[toolType] ?? null;
  };

  const hasStoredResultForField = (fieldName: string, folderType: string | undefined, toolType: ToolType): boolean => {
    const key = getFieldKey(fieldName, folderType);
    return Boolean(storedResults.field[key]?.[toolType]);
  };

  const hasStoredResultForDocument = (documentId: string, toolType: ToolType): boolean => {
    const key = getDocumentKey(documentId);
    return Boolean(storedResults.document[key]?.[toolType]);
  };

  const persistResult = (context: ToolContext, result: ToolResult) => {
    setStoredResults((prev) => {
      if (context.scope === 'field') {
        const key = getFieldKey(context.fieldName, context.folderType);
        const existing = prev.field[key] ?? {};
        return {
          ...prev,
          field: {
            ...prev.field,
            [key]: {
              ...existing,
              [result.tool]: result,
            },
          },
        };
      }

      const key = getDocumentKey(context.document.id);
      const existing = prev.document[key] ?? {};
      return {
        ...prev,
        document: {
          ...prev.document,
          [key]: {
            ...existing,
            [result.tool]: result,
          },
        },
      };
    });
  };

  const runTool = async (
    toolType: ToolType,
    context: ToolContext,
    options?: { overrideText?: string }
  ) => {
    const rawInput = options?.overrideText ?? context.text;
    const trimmed = rawInput.trim();

    if (!trimmed) {
      setToolError('No hay texto disponible para procesar.');
      setToolResult(null);
      setIsToolRunning(false);
      return;
    }

    setIsToolRunning(true);
    setToolError(null);
    setToolResult(null);

    try {
      switch (toolType) {
        case 'jurisprudencia': {
          const response = await fetch('/api/jurisprudence/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: truncateForTool(trimmed, 800) })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData?.error ?? 'No se pudo consultar la jurisprudencia.');
          }

          const data = (await response.json()) as JurisprudenceResult;
          const result: ToolResult = { tool: 'jurisprudencia', data };
          setToolResult(result);
          persistResult(context, result);
          break;
        }
        case 'analisis': {
          const formData = new FormData();
          formData.append('text', truncateForTool(trimmed, 6000));

          const response = await fetch('/api/analyze-document', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData?.error ?? 'Error durante el análisis del documento.');
          }

          const data = (await response.json()) as AnalysisResult;
          const result: ToolResult = { tool: 'analisis', data };
          setToolResult(result);
          persistResult(context, result);
          break;
        }
        case 'doctrina': {
          const params = new URLSearchParams({
            search: truncateForTool(trimmed, 200),
            caseDescription: truncateForTool(trimmed, 2000)
          });

          const response = await fetch(`/api/doctrinas?${params.toString()}`);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData?.error ?? 'No se pudo obtener doctrina relacionada.');
          }

          const items = (await response.json()) as Doctrina[];
          const result: ToolResult = { tool: 'doctrina', data: { items, query: trimmed } };
          setToolResult(result);
          persistResult(context, result);
          break;
        }
        case 'metabuscador': {
          const response = await fetch('/api/metabuscador/buscar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ termino: truncateForTool(trimmed, 200) })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData?.error ?? 'El metabuscador no respondió correctamente.');
          }

          const data = (await response.json()) as MetaBuscadorResponse;
          const result: ToolResult = { tool: 'metabuscador', data };
          setToolResult(result);
          persistResult(context, result);
          setMetaSearchTerm(data.term ?? trimmed);
          break;
        }
        default: {
          throw new Error('Herramienta no soportada.');
        }
      }
    } catch (error) {
      console.error('Error ejecutando la herramienta:', error);
      const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      setToolError(message);
    } finally {
      setIsToolRunning(false);
    }
  };

  const startToolForContext = (toolType: ToolType, context: ToolContext) => {
    setActiveTool(toolType);
    setToolContext(context);
    setIsToolDialogOpen(true);
    setIsReadingMode(false);

    if (toolType === 'metabuscador') {
      const initialTerm = truncateForTool(context.text.trim(), 200);
      setMetaSearchTerm(initialTerm);
    }

    const cached = getStoredResult(context, toolType);
    if (cached) {
      setToolError(null);
      setToolResult(cached);
      setIsToolRunning(false);
      if (toolType === 'metabuscador') {
        setMetaSearchTerm(
          cached.tool === 'metabuscador'
            ? cached.data.term ?? truncateForTool(context.text.trim(), 200)
            : truncateForTool(context.text.trim(), 200)
        );
      }
      return;
    }

    void runTool(toolType, context);
  };

  const handleFieldToolSelection = (
    toolType: ToolType,
    fieldName: string,
    fieldLabel: string,
    folderType?: string
  ) => {
    const rawValue = formData[fieldName] ?? '';
    const trimmedValue = rawValue.trim();

    if (!trimmedValue) {
      toast({
        variant: 'destructive',
        title: 'Sin texto para analizar',
        description: 'Agrega información en el campo antes de usar las herramientas.'
      });
      return;
    }

    startToolForContext(toolType, {
      scope: 'field',
      fieldName,
      fieldLabel,
      folderType,
      text: rawValue
    });
  };

  const handleDocumentToolSelection = (toolType: ToolType, document: ClientDocument) => {
    const trimmedText = document.extractedText?.trim() ?? '';

    if (!trimmedText) {
      toast({
        variant: 'destructive',
        title: 'Documento sin texto',
        description: 'El documento seleccionado no tiene texto extraído disponible.'
      });
      return;
    }

    startToolForContext(toolType, {
      scope: 'document',
      document,
      text: document.extractedText
    });
  };

  const handleRerunTool = () => {
    if (!activeTool || !toolContext) return;
    setIsReadingMode(false);
    const overrideText = activeTool === 'metabuscador' ? metaSearchTerm : undefined;
    void runTool(activeTool, toolContext, { overrideText });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!selectedClient || !selectedFolderForUpload) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderType', selectedFolderForUpload);
        formData.append('phase', fase);

        const response = await fetch(`/api/clients/${selectedClient.id}/documents/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }
      }

      toast({
        title: 'Archivo subido',
        description: 'Los documentos fueron procesados correctamente.',
      });

      setDocumentTrigger(prev => prev + 1);
      resetUploadState();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        variant: 'destructive',
        title: 'Error al subir',
        description: 'No se pudo procesar el archivo. Inténtalo nuevamente.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraCapture = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!selectedClient || !selectedFolderForUpload) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', files[0]);
      formData.append('folderType', selectedFolderForUpload);
      formData.append('phase', fase);

      const response = await fetch(`/api/clients/${selectedClient.id}/documents/camera-capture`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Camera capture failed');
      }

      toast({
        title: 'Imagen capturada',
        description: 'La captura fue procesada correctamente.',
      });

      setDocumentTrigger(prev => prev + 1);
      resetUploadState();
    } catch (error) {
      console.error('Error capturing image:', error);
      toast({
        variant: 'destructive',
        title: 'Error al capturar',
        description: 'No se pudo procesar la captura. Inténtalo nuevamente.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Query para obtener todos los documentos de la fase
  const { data: allDocuments = [], isFetching: isFetchingDocuments } = useQuery<ClientDocument[]>({
    queryKey: ['documents', selectedClient?.id, fase, documentTrigger],
    queryFn: async () => {
      if (!selectedClient || fase === 'registro') return [];

      const response = await fetch(`/api/clients/${selectedClient.id}/documents/${fase}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error fetching documents');
      }

      return await response.json();
    },
    enabled: !!selectedClient && fase !== 'registro'
  });
  const documentsInSelectedFolder = selectedFolderForView
    ? allDocuments.filter(doc => doc.folderType === selectedFolderForView)
    : [];

  // Función helper para obtener el conteo de documentos por carpeta
  const getDocumentCount = (folderType: string): number => {
    return allDocuments.filter((doc) => doc.folderType === folderType).length;
  };

  const formatDisplayDate = (value: string | undefined) => {
    if (!value) return 'Sin fecha registrada';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const resolucionesEmitidasCount = getDocumentCount('resoluciones_emitidas');
  const tareasPendientesCount = getDocumentCount('tareas_pendientes');
  const observacionesCount = getDocumentCount('observaciones');

  const seguimientoSignals = [
    Boolean(formData.currentStatus?.trim()),
    Boolean(formData.lastUpdate?.trim()),
    Boolean(formData.proximaAudiencia?.trim()),
    resolucionesEmitidasCount > 0,
    tareasPendientesCount > 0,
    observacionesCount > 0,
  ];

  const seguimientoCompletion = seguimientoSignals.length
    ? Math.round((seguimientoSignals.filter(Boolean).length / seguimientoSignals.length) * 100)
    : 0;

  const lastUpdateDisplay = formData.lastUpdate?.trim()
    ? formatDisplayDate(formData.lastUpdate)
    : 'Sin actualización registrada';

  const nextHearingDisplay = formData.proximaAudiencia?.trim()
    ? formatDisplayDate(formData.proximaAudiencia)
    : 'Sin audiencia programada';

  const estadoActualDisplay = formData.currentStatus?.trim() || 'Sin estado registrado';

  // useEffect para cargar texto consolidado de cada carpeta y auto-llenar textareas
  // Se ejecuta cuando se suben nuevos documentos (documentTrigger cambia)
  useEffect(() => {
    if (!selectedClient || fase === 'registro') return;

    const loadConsolidatedTexts = async () => {
      console.log('🔄 Cargando textos consolidados... documentTrigger:', documentTrigger);
      
      // Para cada campo que tiene una carpeta asignada
      for (const field of config.fields as any[]) {
        if (field.folder) {
          try {
            const response = await fetch(`/api/clients/${selectedClient.id}/documents/${fase}/${field.folder}/consolidated`);
            if (response.ok) {
              const data = await response.json();
              if (data?.consolidatedText && data.consolidatedText.trim() !== '') {
                console.log(`✅ Texto consolidado actualizado para ${field.label} (${data.consolidatedText.length} caracteres)`);
                
                // SIEMPRE actualizar con el texto consolidado más reciente
                setFormData(prev => ({
                  ...prev,
                  [field.name]: data.consolidatedText
                }));
                
                // Marcar como dirty para que se pueda guardar
                setIsDirty(true);
              } else {
                console.log(`ℹ️ No hay texto consolidado para ${field.label}`);
              }
            }
          } catch (error) {
            console.error(`Error cargando texto consolidado para ${field.folder}:`, error);
          }
        }
      }
    };

    loadConsolidatedTexts();
  }, [selectedClient?.id, fase, documentTrigger]); // Re-cargar cuando cambia el cliente, fase o se suben documentos

  useEffect(() => {
    setStoredResults({ field: {}, document: {} });
    setMetaSearchTerm('');
  }, [selectedClient?.id, fase]);

  if (!selectedClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">No hay cliente seleccionado</h2>
          <p className="text-muted-foreground">
            Selecciona un cliente desde la página de Clientes
          </p>
        </div>
        <Button onClick={() => navigate('/clients')}>
          <User className="h-4 w-4 mr-2" />
          Ir a Clientes
        </Button>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Fase no encontrada</h2>
          <p className="text-muted-foreground">
            La fase "{fase}" no existe
          </p>
        </div>
  <Button onClick={() => navigate('/procesos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Procesos
        </Button>
      </div>
    );
  }

  const Icon = config.icon;

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!selectedClient) {
      return;
    }

    setIsSaving(true);

    try {
      const sanitizedData: Record<string, string> = {};
      for (const [key, value] of Object.entries(formData)) {
        sanitizedData[key] = value ?? '';
      }

      const phaseResponse = await fetch(`/api/clients/${selectedClient.id}/phases/${fase}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: sanitizedData }),
      });

      if (!phaseResponse.ok) {
        throw new Error('No se pudo guardar la información de la fase');
      }

      const existingProcess = processQuery.data?.processState as CaseProcessStateWithFollowUp | null;
      const previousCompletion = Number(existingProcess?.completionPercentage ?? 0) || 0;
      
      console.log('🔢 CÁLCULO DE PROGRESO:');
      console.log('  Fase:', fase);
      console.log('  Progreso anterior:', previousCompletion);
      console.log('  Datos a validar:', sanitizedData);
      
      const nextCompletion = calculateCompletionForPhase(fase as PhaseKey, sanitizedData, previousCompletion);
      
      console.log('  Progreso calculado:', nextCompletion);

      const baseClientInfo = toStringRecord(toSafeRecord(existingProcess?.clientInfo));
      const baseInvestigation = toStringRecord(toSafeRecord(existingProcess?.investigationProgress));
      const baseStrategy = toStringRecord(toSafeRecord(existingProcess?.caseStrategy));
      const baseMeeting = toStringRecord(toSafeRecord(existingProcess?.clientMeeting));
      const baseFollowUp = toStringRecord(toSafeRecord(existingProcess?.followUp));

      const processPayload: {
        currentPhase: string;
        completionPercentage: number;
        clientInfo: Record<string, string>;
        investigationProgress: Record<string, string>;
        caseStrategy: Record<string, string>;
        clientMeeting: Record<string, string>;
        followUp: Record<string, string>;
      } = {
        currentPhase: PHASE_PROCESS_MAP[fase as PhaseKey] ?? existingProcess?.currentPhase ?? 'client-info',
        completionPercentage: nextCompletion,
        clientInfo: baseClientInfo,
        investigationProgress: baseInvestigation,
        caseStrategy: baseStrategy,
        clientMeeting: baseMeeting,
        followUp: baseFollowUp,
      };

      if (fase === 'registro') {
        processPayload.clientInfo = {
          ...processPayload.clientInfo,
          name: sanitizedData.name ?? '',
          phone: sanitizedData.contactInfo ?? '',
          contactInfo: sanitizedData.contactInfo ?? '',
          email: sanitizedData.email ?? '',
          address: sanitizedData.address ?? '',
          dni: sanitizedData.dni ?? '',
          notes: sanitizedData.notes ?? '',
        };
      } else if (fase === 'avance_investigacion') {
        processPayload.investigationProgress = {
          ...processPayload.investigationProgress,
          denunciaPolicial: sanitizedData.denunciaPolicial ?? '',
          notificaciones: sanitizedData.notificaciones ?? '',
          documentosAdicionales: sanitizedData.documentosAdicionales ?? '',
          testimonios: sanitizedData.testimonios ?? '',
          evidenciaFotografica: sanitizedData.evidenciaFotografica ?? '',
          fechaInicio: sanitizedData.fechaInicio ?? '',
          estadoInvestigacion: sanitizedData.estadoInvestigacion ?? '',
        };
      } else if (fase === 'armar_estrategia') {
        processPayload.caseStrategy = {
          ...processPayload.caseStrategy,
          entenderHechos: sanitizedData.entenderHechos ?? '',
          teoriaDelCaso: sanitizedData.teoriaDelCaso ?? '',
          objetivos: sanitizedData.objetivos ?? '',
          fundamentoLegal: sanitizedData.fundamentoLegal ?? '',
          estrategiaDefensa: sanitizedData.estrategiaDefensa ?? '',
          riesgos: sanitizedData.riesgos ?? '',
        };
      } else if (fase === 'programar_cita') {
        processPayload.clientMeeting = {
          ...processPayload.clientMeeting,
          date: sanitizedData.meetingDate ?? '',
          time: sanitizedData.meetingTime ?? '',
          location: sanitizedData.location ?? '',
          attendees: sanitizedData.attendees ?? '',
          agenda: sanitizedData.agenda ?? '',
          preparationNotes: sanitizedData.preparationNotes ?? '',
        };
      } else if (fase === 'seguimiento') {
        processPayload.followUp = {
          ...processPayload.followUp,
          currentStatus: sanitizedData.currentStatus ?? '',
          lastUpdate: sanitizedData.lastUpdate ?? '',
          proximaAudiencia: sanitizedData.proximaAudiencia ?? '',
          resolucionesEmitidas: sanitizedData.resolucionesEmitidas ?? '',
          pendingTasks: sanitizedData.pendingTasks ?? '',
          observations: sanitizedData.observations ?? '',
        };
      }

      const processResponse = await fetch(`/api/cases/${selectedClient.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(processPayload),
      });

      if (!processResponse.ok) {
        throw new Error('No se pudo actualizar el progreso del caso');
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/clients', selectedClient.id, 'phases', fase] }),
        queryClient.invalidateQueries({ queryKey: ['/api/cases', selectedClient.id, 'process'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/clients/progress/all'] }),
      ]);

      if (fase === 'registro') {
        setSelectedClient({
          ...selectedClient,
          name: sanitizedData.name || selectedClient.name,
          contactInfo: sanitizedData.contactInfo || selectedClient.contactInfo,
          email: sanitizedData.email ?? selectedClient.email,
          address: sanitizedData.address ?? selectedClient.address,
          dni: sanitizedData.dni ?? selectedClient.dni,
        });
      }

      setIsDirty(false);

      toast({
        title: 'Cambios guardados',
        description: `La información de la fase "${config.title}" ha sido guardada correctamente.`,
      });
    } catch (error) {
      console.error('Error al guardar la fase del proceso:', error);
      toast({
        title: 'No se pudo guardar',
        description: error instanceof Error ? error.message : 'Ocurrió un error al guardar los cambios.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderToolContent = () => {
    if (!activeTool) {
      return (
        <p className="text-sm text-muted-foreground">
          Selecciona una herramienta para generar resultados.
        </p>
      );
    }

    if (isToolRunning) {
      return (
        <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Procesando solicitud...
        </div>
      );
    }

    if (toolError) {
      return (
        <div className="space-y-4">
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {toolError}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleRerunTool}>
              Reintentar
            </Button>
          </div>
        </div>
      );
    }

    if (activeTool === 'metabuscador') {
      const results =
        toolResult?.tool === 'metabuscador'
          ? toolResult.data.results
          : [];
      const term =
        toolResult?.tool === 'metabuscador'
          ? toolResult.data.term
          : metaSearchTerm;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!toolContext) return;
        const nextTerm = metaSearchTerm.trim();
        if (!nextTerm) {
          toast({
            variant: 'destructive',
            title: 'Ingrese un término válido',
            description: 'Escribe una frase clave antes de consultar el metabuscador.'
          });
          return;
        }
        setIsReadingMode(false);
        void runTool('metabuscador', toolContext, { overrideText: nextTerm });
      };

      return (
        <div className="space-y-4">
          <form
            className="flex flex-col gap-3 rounded-md border p-3 md:flex-row"
            onSubmit={handleSubmit}
            data-tool-form="metabuscador"
          >
            <Input
              value={metaSearchTerm}
              onChange={(event) => setMetaSearchTerm(event.target.value)}
              placeholder="Frase clave para buscar (ej. responsabilidad penal)"
              className="flex-1"
            />
            <Button type="submit" disabled={isToolRunning || !metaSearchTerm.trim()}>
              {isToolRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando…
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </form>

          {!isToolRunning && toolResult?.tool === 'metabuscador' && (
            <div className="text-xs text-muted-foreground">
              Resultados para <span className="font-medium text-foreground">“{term ?? metaSearchTerm}”</span>
            </div>
          )}

          {!isToolRunning && (!results || results.length === 0) && toolResult?.tool === 'metabuscador' ? (
            <p className="text-sm text-muted-foreground">
              No se hallaron resultados externos para “{term ?? (metaSearchTerm || '—')}”. Ajusta las palabras clave y vuelve a intentar.
            </p>
          ) : (
            <div className="space-y-4">
              {results?.map((result, index) => (
                <div key={`${result.link}-${index}`} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{result.title}</h4>
                    <Badge variant="outline" className="text-xs uppercase">{result.source}</Badge>
                  </div>
                  <p
                    className={cn(
                      'text-sm text-muted-foreground leading-relaxed',
                      isReadingMode && 'text-base leading-7 text-foreground'
                    )}
                  >
                    {result.snippet}
                  </p>
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Abrir enlace
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (!toolResult) {
      return (
        <p className="text-sm text-muted-foreground">
          Sin resultados disponibles todavía.
        </p>
      );
    }

    if (toolResult.tool === 'jurisprudencia') {
      return (
        <div className="space-y-4">
          <div
            className={cn(
              'rounded-md border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap',
              isReadingMode && 'border-none bg-background text-base leading-7 shadow-none'
            )}
          >
            {toolResult.data.answer}
          </div>
          {toolResult.data.references && toolResult.data.references.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Referencias destacadas</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {toolResult.data.references.map((reference, index) => (
                  <li key={index}>{reference}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (toolResult.tool === 'analisis') {
      const analysis = toolResult.data;
      return (
        <div className="space-y-5">
          {analysis.note && (
            <div className="rounded-md border border-blue-300/40 bg-blue-500/10 p-3 text-sm">
              {analysis.note}
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Resumen ejecutivo</h4>
            <p
              className={cn(
                'text-sm text-muted-foreground leading-relaxed',
                isReadingMode && 'text-base leading-7 text-foreground'
              )}
            >
              {analysis.documentSummary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="text-sm font-semibold">Áreas legales</h5>
              <div className="flex flex-wrap gap-1">
                {analysis.legalAreas.map((area) => (
                  <div key={area} className="relative group">
                    <Badge 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => {
                        setMetaSearchTerm(area);
                        setActiveTool('metabuscador');
                        setToolContext({
                          scope: 'field',
                          fieldName: 'analysisArea',
                          fieldLabel: `Área legal: ${area}`,
                          text: area,
                        });
                        setIsToolDialogOpen(true);
                      }}
                    >
                      {area}
                    </Badge>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Click para buscar
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h5 className="text-sm font-semibold">Conceptos clave</h5>
              <div className="flex flex-wrap gap-1">
                {analysis.keyLegalConcepts.map((concept) => (
                  <div key={concept} className="relative group">
                    <Badge 
                      variant="outline" 
                      className="text-xs cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => {
                        setMetaSearchTerm(concept);
                        setActiveTool('metabuscador');
                        setToolContext({
                          scope: 'field',
                          fieldName: 'analysisKeyword',
                          fieldLabel: `Concepto: ${concept}`,
                          text: concept,
                        });
                        setIsToolDialogOpen(true);
                      }}
                    >
                      {concept}
                    </Badge>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Click para buscar en Metabuscador
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {analysis.relevantArticles && analysis.relevantArticles.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-semibold">Artículos relevantes</h5>
              <div className="flex flex-wrap gap-1">
                {analysis.relevantArticles.map((article, index) => (
                  <div key={index} className="relative group">
                    <Badge 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => {
                        setMetaSearchTerm(article);
                        setActiveTool('metabuscador');
                        setToolContext({
                          scope: 'field',
                          fieldName: 'analysisArticle',
                          fieldLabel: `Artículo: ${article}`,
                          text: article,
                        });
                        setIsToolDialogOpen(true);
                      }}
                    >
                      {article}
                    </Badge>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      Click para buscar en Metabuscador
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.recommendations.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-semibold">Recomendaciones</h5>
              <ul
                className={cn(
                  'space-y-1 text-sm text-muted-foreground list-disc list-inside',
                  isReadingMode && 'text-base leading-7 text-foreground'
                )}
              >
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.risks.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-semibold">Riesgos identificados</h5>
              <ul
                className={cn(
                  'space-y-1 text-sm text-muted-foreground list-disc list-inside',
                  isReadingMode && 'text-base leading-7 text-foreground'
                )}
              >
                {analysis.risks.map((risk, index) => (
                  <li key={index}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (toolResult.tool === 'doctrina') {
      const { items, query } = toolResult.data;
      if (!items.length) {
        return (
          <p className="text-sm text-muted-foreground">
            No se encontraron coincidencias doctrinales para “{query}”.
          </p>
        );
      }

      return (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{item.obra ?? 'Sin título'}</span>
                {item.autor && <Badge variant="outline" className="text-xs">{item.autor}</Badge>}
                {item.ano && <Badge variant="secondary" className="text-xs">{item.ano}</Badge>}
              </div>
              {item.extracto && (
                <p
                  className={cn(
                    'text-sm text-muted-foreground leading-relaxed',
                    isReadingMode && 'text-base leading-7 text-foreground'
                  )}
                >
                  {item.extracto}
                </p>
              )}
              {item.link_repositorio && (
                <a
                  href={item.link_repositorio}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Ver en repositorio
                </a>
              )}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/procesos')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Título y cliente */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{config.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {selectedClient?.name || 'Sin cliente seleccionado'}
        </p>
      </div>

      <div className="mb-6 rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide text-primary">Resumen del proceso</span>
          <span>
            Avance: <span className="font-medium text-foreground">{seguimientoCompletion}%</span>
          </span>
          <span>
            Estado actual: <span className="font-medium text-foreground">{estadoActualDisplay}</span>
          </span>
          <span>
            Última actualización: <span className="font-medium text-foreground">{lastUpdateDisplay}</span>
          </span>
          <span>
            Próxima audiencia: <span className="font-medium text-foreground">{nextHearingDisplay}</span>
          </span>
          <span>
            Docs • R: <span className="font-medium text-foreground">{resolucionesEmitidasCount}</span> T: <span className="font-medium text-foreground">{tareasPendientesCount}</span> O: <span className="font-medium text-foreground">{observacionesCount}</span>
          </span>
        </div>
      </div>

      {/* Botones de gestión de documentos (compactos) */}
      {fase !== 'registro' && (
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button onClick={() => openSelectFolderDialog('file')}>
            <Upload className="h-4 w-4 mr-2" />
            Añadir Archivo
          </Button>
          <Button variant="outline" onClick={() => openSelectFolderDialog('camera')}>
            <Camera className="h-4 w-4 mr-2" />
            Capturar
          </Button>
        </div>
      )}

      {/* Formulario de la Fase */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {config.fields.map((field) => {
              const hasFolder = Object.prototype.hasOwnProperty.call(field, 'folder');
              const folderType = hasFolder ? (field as any).folder as string : undefined;

              return (
                <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={field.name} className="flex items-center gap-2">
                      {hasFolder && <Folder className="h-4 w-4 text-muted-foreground" />}
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {hasFolder && (
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-sm">
                          {getDocumentCount(folderType!)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDocumentsDialog(folderType!)}
                          title="Ver documentos de la carpeta"
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Herramientas"
                            >
                              <Wrench className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuLabel>Herramientas</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {TOOL_OPTIONS.map((option) => {
                              const stored = hasStoredResultForField(field.name, folderType, option.type);
                              return (
                                <DropdownMenuItem
                                  key={`${field.name}-${option.type}`}
                                  className={cn(
                                    'cursor-pointer focus:bg-muted',
                                    stored && 'bg-muted/60 text-muted-foreground'
                                  )}
                                  onClick={() => handleFieldToolSelection(option.type, field.name, field.label, folderType)}
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium">{option.label}</span>
                                    <span className="text-xs text-muted-foreground">{option.description}</span>
                                  </div>
                                  {stored && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>

                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      placeholder={`Ingrese ${field.label.toLowerCase()}`}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      rows={4}
                      className="mt-2"
                    />
                  ) : field.name === 'meetingDate' ? (
                    <div className="mt-2 space-y-4">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (date) {
                            handleInputChange('meetingDate', date.toISOString().split('T')[0]);
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="rounded-md border"
                      />
                      {selectedDate && (
                        <p className="text-sm text-muted-foreground">
                          Fecha seleccionada: {selectedDate.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      placeholder={`Ingrese ${field.label.toLowerCase()}`}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => navigate('/procesos')}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            {fase === 'registro' && (
              <>
                <p>• Esta fase se completa una sola vez durante el registro inicial del cliente.</p>
                <p>• Puede volver a editar estos datos en cualquier momento si necesita actualizar la información de contacto.</p>
                <p>• Los campos marcados con (*) son obligatorios.</p>
              </>
            )}
            {fase === 'avance_investigacion' && (
              <>
                <p>• Recopile y documente denuncias policiales y notificaciones oficiales.</p>
                <p>• Adjunte todos los documentos relacionados al caso en las carpetas correspondientes.</p>
                <p>• Esta información es fundamental para entender el contexto del caso.</p>
              </>
            )}
            {fase === 'programar_cita' && (
              <>
                <p>• Programe una reunión para presentar los hallazgos al cliente.</p>
                <p>• Prepare la agenda con los temas clave a discutir.</p>
                <p>• Asegúrese de tener todos los documentos necesarios listos.</p>
              </>
            )}
            {fase === 'armar_estrategia' && (
              <>
                <p>• Analice los hechos del caso de manera cronológica y detallada.</p>
                <p>• Desarrolle una teoría del caso sólida basada en la evidencia recopilada.</p>
                <p>• Defina objetivos claros y realistas para el cliente.</p>
              </>
            )}
            {fase === 'seguimiento' && (
              <>
                <p>• Mantenga un registro actualizado del estado del caso.</p>
                <p>• Documente todas las resoluciones y próximas audiencias.</p>
                <p>• Registre cualquier observación relevante sobre el progreso.</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isToolDialogOpen} onOpenChange={handleToolDialogChange}>
        <DialogContent className={cn('max-w-3xl', isReadingMode && 'max-w-[90vw] h-[90vh]')}>
          <DialogHeader>
            <DialogTitle>{activeTool ? TOOL_LABELS[activeTool] : 'Herramientas'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {toolContext && (
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                <div>
                  <span className="font-semibold text-foreground">Fuente:</span>{' '}
                  {toolContext.scope === 'field'
                    ? `${toolContext.fieldLabel}${toolContext.folderType ? ` · ${getFolderDisplayName(toolContext.folderType)}` : ''}`
                    : toolContext.document.fileName}
                </div>
                {toolContext.scope === 'document' && (
                  <div>
                    Subido el {formatUploadDate(toolContext.document.uploadedAt)} · {formatFileSize(toolContext.document.fileSize)}
                  </div>
                )}
              </div>
            )}

            {toolResult && !isToolRunning && !toolError && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Doble clic en el contenido para activar el modo lectura.</span>
                {isReadingMode && (
                  <Button size="sm" variant="secondary" onClick={() => setIsReadingMode(false)}>
                    Salir modo lectura
                  </Button>
                )}
              </div>
            )}

            <div
              className={cn(
                'rounded-md border bg-background p-3 transition-all',
                toolResult && !isToolRunning && !toolError
                  ? 'cursor-zoom-in'
                  : 'border-dashed border-muted-foreground/40',
                isReadingMode &&
                  'cursor-default border-primary/50 bg-background shadow-lg text-base leading-7 overflow-y-auto h-[calc(90vh-18rem)]'
              )}
              onDoubleClick={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest('[data-tool-form]')) {
                  return;
                }
                if (!isReadingMode && toolResult && !isToolRunning && !toolError) {
                  setIsReadingMode(true);
                }
              }}
            >
              {renderToolContent()}
            </div>

            {activeTool && !isToolRunning && !toolError && toolResult && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleRerunTool}>
                  Volver a ejecutar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDocumentsDialogOpen} onOpenChange={handleDocumentsDialogChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Documentos en {selectedFolderConfigForView?.name || 'la carpeta seleccionada'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isFetchingDocuments ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cargando documentos...
              </div>
            ) : documentsInSelectedFolder.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay documentos en esta carpeta todavía.
              </p>
            ) : (
              <div className="space-y-3">
                {documentsInSelectedFolder.map((document) => (
                  <div key={document.id} className="flex items-start justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">{document.fileName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Subido el {formatUploadDate(document.uploadedAt)} · {formatFileSize(document.fileSize)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pl-3">
                      <Badge variant="outline" className="uppercase text-xs">
                        {document.fileType?.split('/').pop() || document.fileType || 'archivo'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            title="Herramientas"
                          >
                            <Wrench className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                          <DropdownMenuLabel>Herramientas</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {TOOL_OPTIONS.map((option) => {
                            const stored = hasStoredResultForDocument(document.id, option.type);
                            return (
                              <DropdownMenuItem
                                key={`${document.id}-${option.type}`}
                                className={cn(
                                  'cursor-pointer focus:bg-muted',
                                  stored && 'bg-muted/60 text-muted-foreground'
                                )}
                                onClick={() => handleDocumentToolSelection(option.type, document)}
                              >
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm font-medium">{option.label}</span>
                                  <span className="text-xs text-muted-foreground">{option.description}</span>
                                </div>
                                {stored && <Check className="ml-auto h-4 w-4" />}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDocument(document)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Abrir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDeleteDocument(document)}
                        title="Eliminar documento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSelectFolderDialogOpen} onOpenChange={handleFolderDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿A qué carpeta deseas añadir el documento?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2">
            {folders.map(folder => (
              <Button
                key={folder.type}
                variant="outline"
                className="justify-start"
                onClick={() => handleFolderSelection(folder.type)}
                disabled={isUploading}
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span>{folder.name}</span>
                </div>
              </Button>
            ))}
            {folders.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay carpetas configuradas para esta fase.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={handleUploadDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {uploadMode === 'camera' ? 'Capturar con Cámara' : 'Añadir Archivo'}
            </DialogTitle>
          </DialogHeader>
          {selectedFolderForUpload ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Carpeta seleccionada</p>
                  <p className="text-sm font-medium">
                    {selectedFolderConfig?.name || selectedFolderForUpload}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleChangeFolder}
                  disabled={isUploading}
                >
                  Cambiar carpeta
                </Button>
              </div>

              {uploadMode === 'camera' ? (
                <>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => handleCameraCapture(event.target.files)}
                  />
                  <Button
                    className="w-full"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Abrir cámara
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Tomaremos una fotografía y la procesaremos automáticamente.
                  </p>
                </>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(event) => handleFileUpload(event.target.files)}
                  />
                  <Button
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar archivos
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Puedes subir PDFs, imágenes o documentos de texto.
                  </p>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecciona una carpeta para continuar.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
