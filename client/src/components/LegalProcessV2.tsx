import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileText,
  Users,
  FolderOpen,
  Clock,
  Target,
  DollarSign,
  FileDown,
  Plus,
  Calendar,
  Scale,
  Gavel,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClient } from "@/contexts/ClientContext";
import { useClientQuery } from "@/hooks/useClients";
import { useLegalProcessV2, useSaveLegalProcessV2 } from "@/hooks/useLegalProcessV2";
import { FileUploadZone } from "@/components/FileUploadZone";
import { DocumentFolderManager } from "@/components/DocumentFolderManager";
import { getClientColor } from "@/lib/clientColors";
import jsPDF from "jspdf";
import "jspdf-autotable";

// ==================== TIPOS (ARQUITECTURA 2.0) ====================

interface CaseStatus {
  caseNumber: string;
  caseType: string;
  currentStage: string;
  resolutionStatus: "en_tramite" | "absuelto_1ra" | "condenado_1ra" | "absuelto_2da" | "condenado_2da" | "casacion_fundada" | "casacion_infundada" | "archivado" | "sobreseimiento";
  nextDeadline?: { date: string; description: string };
}

interface Participant {
  id: string;
  name: string;
  role: "defensor" | "cliente" | "imputado" | "agraviado" | "fiscal" | "juez" | "vocal" | "testigo" | "perito";
  contact?: string;
  email?: string;
  dni?: string; // Para el imputado
  relation?: string; // Relación con el cliente (si aplica)
  notes?: string;
}

interface DocumentFolder {
  stage: "general" | "investigacion" | "intermedia" | "juicio_oral" | "apelacion" | "casacion" | "ejecucion";
  label: string;
  documents: Array<{
    id: string;
    filename: string;
    uploadDate: string;
    category: string;
  }>;
}

interface Milestone {
  id: string;
  instance: "primera" | "segunda" | "casacion";
  stage: string;
  title: string;
  date: string;
  description: string;
  isVerdict?: boolean;
  verdictResult?: "absolutoria" | "condenatoria" | "confirma" | "revoca" | "anula" | "fundado" | "infundado" | "nulo";
}

interface CaseStrategy {
  caseTheory: string;
  factsAnalysis: string;
  objectives: string[];
  legalStrategy: string;
  privateNotes: string;
  attachments: Array<{
    id: string;
    name: string;
    content?: string;
    type: "file" | "note";
    uploadDate: string;
  }>;
}

interface FinancialControl {
  honorarios: number;
  gastos: number;
  reparacionCivil: number;
  payments: Array<{ date: string; amount: number; concept: string; }>;
}

type ProcessTab = "dashboard" | "intervinientes" | "expediente" | "hitos" | "estrategia" | "financiero" | "reportes";

interface ProcessState {
  activeTab: ProcessTab;
  caseStatus: CaseStatus;
  participants: Participant[];
  documentFolders: DocumentFolder[];
  milestones: Milestone[];
  strategy: CaseStrategy;
  financial: FinancialControl;
}

// ==================== COMPONENTE PRINCIPAL ====================

export function LegalProcessV2() {
  const [, navigate] = useLocation();
  const params = useParams();
  const clientId = params.clientId;
  const { toast } = useToast();
  
  // Sincronizar con contexto unificado
  const { client, setClient } = useClient();
  
  const { data: existingClient } = useClientQuery(clientId);
  const { data: savedProcess, isLoading: isLoadingProcess } = useLegalProcessV2(clientId);
  const saveMutation = useSaveLegalProcessV2(clientId);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sincronizar cliente del contexto cuando carga
  useEffect(() => {
    if (existingClient && (!client || client.id !== existingClient.id)) {
      setClient(existingClient);
    }
  }, [existingClient, client, setClient]);

  // Estado del modal de intervinientes
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [editingParticipantIndex, setEditingParticipantIndex] = useState<number | null>(null);
  const [participantForm, setParticipantForm] = useState({
    name: "",
    role: "testigo" as Participant["role"],
    contact: "",
    email: "",
    dni: "",
    relation: "",
    notes: "",
  });

  // Estado para upload de documentos
  const [uploadingStage, setUploadingStage] = useState<DocumentFolder["stage"] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado del modal de hitos
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    instance: "primera" as Milestone["instance"],
    stage: "",
    title: "",
    date: "",
    description: "",
    isVerdict: false,
    verdictResult: "" as Milestone["verdictResult"] | "",
  });

  // Estado del modal de pagos
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    concept: "",
    amount: "",
  });

  const [processState, setProcessState] = useState<ProcessState>({
    activeTab: "dashboard",
    caseStatus: {
      caseNumber: "",
      caseType: "Penal",
      currentStage: "Investigación Preparatoria",
      resolutionStatus: "en_tramite",
    },
    participants: [],
    documentFolders: [
      { stage: "general", label: "Documentos Generales / Cliente", documents: [] },
      { stage: "investigacion", label: "Investigación Preparatoria", documents: [] },
      { stage: "intermedia", label: "Etapa Intermedia", documents: [] },
      { stage: "juicio_oral", label: "Juicio Oral", documents: [] },
      { stage: "apelacion", label: "Apelación (2da Instancia)", documents: [] },
      { stage: "casacion", label: "Casación (Corte Suprema)", documents: [] },
      { stage: "ejecucion", label: "Ejecución", documents: [] },
    ],
    milestones: [],
    strategy: {
      caseTheory: "",
      factsAnalysis: "",
      objectives: [],
      legalStrategy: "",
      privateNotes: "",
      attachments: [],
    },
    financial: {
      honorarios: 0,
      gastos: 0,
      reparacionCivil: 0,
      payments: [],
    },
  });

  // Cargar datos guardados
  useEffect(() => {
    if (savedProcess?.data) {
      setProcessState((prev) => {
        // Evitar sobrescribir la pestaña activa para prevenir saltos
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { activeTab, ...restData } = savedProcess.data;
        return {
          ...prev,
          ...restData,
        };
      });
    }
  }, [savedProcess]);

  // Inicializar con datos del cliente
  useEffect(() => {
    if (existingClient && processState.participants.length === 0) {
      setProcessState((prev) => ({
        ...prev,
        participants: [
          {
            id: existingClient.id,
            name: existingClient.name,
            role: "cliente",
            contact: existingClient.whatsappPrimary || existingClient.phonePrimary || "",
            email: existingClient.email,
          },
        ],
      }));
    }
  }, [existingClient, processState.participants.length]);

  // Auto-guardar con debounce (3 segundos)
  useEffect(() => {
    if (isLoadingProcess) return; // No guardar mientras carga

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveMutation.mutate(processState, {
        onSuccess: () => {
          // Toast silencioso, no molestamos al usuario
        },
        onError: (error: any) => {
          toast({
            title: "Error al guardar",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [processState, isLoadingProcess]);

  // ==================== HELPER FUNCTIONS ====================

  const getResolutionStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      en_tramite: "En Trámite",
      absuelto_1ra: "Absuelto 1ra Instancia",
      condenado_1ra: "Condenado 1ra Instancia",
      absuelto_2da: "Absuelto 2da Instancia",
      condenado_2da: "Condenado 2da Instancia",
      casacion_fundada: "Casación Fundada",
      casacion_infundada: "Casación Infundada",
      archivado: "Archivado",
      sobreseimiento: "Sobreseimiento",
    };
    return labels[status] || status;
  };

  const getResolutionStatusColor = (status: string) => {
    if (status.includes("absuelto") || status.includes("fundada") || status.includes("archivado")) {
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    }
    if (status.includes("condenado") || status.includes("infundado")) {
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    }
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      defensor: "Defensor",
      cliente: "Cliente (Contratante)",
      imputado: "Imputado (Procesado)",
      agraviado: "Agraviado",
      fiscal: "Fiscal",
      juez: "Juez",
      vocal: "Vocal",
      testigo: "Testigo",
      perito: "Perito",
    };
    return labels[role] || role;
  };

  // Agregar o editar interviniente
  const handleAddParticipant = () => {
    if (!participantForm.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (editingParticipantIndex !== null) {
      // Editar existente
      setProcessState(prev => ({
        ...prev,
        participants: prev.participants.map((p, idx) =>
          idx === editingParticipantIndex
            ? {
                ...p,
                name: participantForm.name,
                role: participantForm.role,
                contact: participantForm.contact,
                email: participantForm.email,
                dni: participantForm.dni,
                relation: participantForm.relation,
                notes: participantForm.notes,
              }
            : p
        ),
      }));

      toast({
        title: "Interviniente actualizado",
        description: `${participantForm.name} fue actualizado correctamente`,
      });
    } else {
      // Agregar nuevo
      const newParticipant: Participant = {
        id: `participant-${Date.now()}`,
        name: participantForm.name,
        role: participantForm.role,
        contact: participantForm.contact,
        email: participantForm.email,
        dni: participantForm.dni,
        relation: participantForm.relation,
        notes: participantForm.notes,
      };

      setProcessState(prev => ({
        ...prev,
        participants: [...prev.participants, newParticipant],
      }));

      toast({
        title: "Interviniente agregado",
        description: `${newParticipant.name} fue agregado correctamente`,
      });
    }

    // Resetear form
    setParticipantForm({
      name: "",
      role: "testigo",
      contact: "",
      email: "",
      dni: "",
      relation: "",
      notes: "",
    });
    setEditingParticipantIndex(null);
    setIsParticipantModalOpen(false);
  };

  // Abrir modal para editar
  const handleEditParticipant = (index: number) => {
    const participant = processState.participants[index];
    setParticipantForm({
      name: participant.name,
      role: participant.role,
      contact: participant.contact || "",
      email: participant.email || "",
      dni: participant.dni || "",
      relation: participant.relation || "",
      notes: participant.notes || "",
    });
    setEditingParticipantIndex(index);
    setIsParticipantModalOpen(true);
  };

  // Subir documento a una carpeta específica
  const handleDocumentUpload = (stage: DocumentFolder["stage"]) => {
    setUploadingStage(stage);
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !uploadingStage) return;

    const newDocuments = Array.from(files).map(file => ({
      id: `doc-${Date.now()}-${Math.random()}`,
      filename: file.name,
      uploadDate: new Date().toLocaleDateString('es-PE'),
      category: uploadingStage,
    }));

    setProcessState(prev => ({
      ...prev,
      documentFolders: prev.documentFolders.map(folder =>
        folder.stage === uploadingStage
          ? { ...folder, documents: [...folder.documents, ...newDocuments] }
          : folder
      ),
    }));

    toast({
      title: "Documento(s) agregado(s)",
      description: `${newDocuments.length} archivo(s) agregados a ${uploadingStage}`,
    });

    // Reset
    setUploadingStage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Agregar hito
  const handleAddMilestone = () => {
    if (!milestoneForm.title.trim() || !milestoneForm.date) {
      toast({
        title: "Error",
        description: "Título y fecha son obligatorios",
        variant: "destructive",
      });
      return;
    }

    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      instance: milestoneForm.instance,
      stage: milestoneForm.stage,
      title: milestoneForm.title,
      date: milestoneForm.date,
      description: milestoneForm.description,
      isVerdict: milestoneForm.isVerdict,
      verdictResult: milestoneForm.isVerdict && milestoneForm.verdictResult ? milestoneForm.verdictResult : undefined,
    };

    setProcessState(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone],
    }));

    // Resetear form
    setMilestoneForm({
      instance: "primera",
      stage: "",
      title: "",
      date: "",
      description: "",
      isVerdict: false,
      verdictResult: "",
    });
    setIsMilestoneModalOpen(false);

    toast({
      title: "Hito agregado",
      description: `${newMilestone.title} fue registrado correctamente`,
    });
  };

  // Agregar pago
  const handleAddPayment = () => {
    if (!paymentForm.concept.trim() || !paymentForm.amount) {
      toast({
        title: "Error",
        description: "Concepto y monto son obligatorios",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser un número válido mayor a 0",
        variant: "destructive",
      });
      return;
    }

    const newPayment = {
      date: paymentForm.date,
      concept: paymentForm.concept,
      amount: amount,
    };

    setProcessState(prev => ({
      ...prev,
      financial: {
        ...prev.financial,
        payments: [...prev.financial.payments, newPayment],
      },
    }));

    // Resetear form
    setPaymentForm({
      date: new Date().toISOString().split('T')[0],
      concept: "",
      amount: "",
    });
    setIsPaymentModalOpen(false);

    toast({
      title: "Pago registrado",
      description: `S/ ${amount.toFixed(2)} - ${newPayment.concept}`,
    });
  };

  // Generar PDFs
  const generateStatusReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("REPORTE DE ESTADO ACTUAL", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Cliente: ${existingClient?.name || "N/A"}`, 20, 35);
    doc.text(`Expediente: ${processState.caseStatus.caseNumber || "Sin asignar"}`, 20, 42);
    doc.text(`Tipo de Caso: ${processState.caseStatus.caseType}`, 20, 49);
    doc.text(`Etapa Actual: ${processState.caseStatus.currentStage}`, 20, 56);
    doc.text(`Estado: ${getResolutionStatusLabel(processState.caseStatus.resolutionStatus)}`, 20, 63);
    
    if (processState.caseStatus.nextDeadline?.date) {
      doc.text(`Próximo Vencimiento: ${processState.caseStatus.nextDeadline.date}`, 20, 70);
      doc.text(`Descripción: ${processState.caseStatus.nextDeadline.description}`, 20, 77);
    }

    doc.text("Últimos 5 Hitos:", 20, 90);
    const recentMilestones = processState.milestones.slice(-5);
    let y = 100;
    recentMilestones.forEach((m, idx) => {
      doc.text(`${idx + 1}. ${m.title} (${m.date})`, 25, y);
      y += 7;
    });

    doc.save(`reporte_estado_${processState.caseStatus.caseNumber || 'sin_exp'}.pdf`);
    
    toast({
      title: "Reporte generado",
      description: "El PDF se ha descargado correctamente",
    });
  };

  const generateTimelineReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("REPORTE DE HITOS - LÍNEA DE TIEMPO", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Cliente: ${existingClient?.name || "N/A"}`, 20, 35);
    doc.text(`Expediente: ${processState.caseStatus.caseNumber || "Sin asignar"}`, 20, 42);

    let y = 55;
    ["primera", "segunda", "casacion"].forEach((instance) => {
      const instanceMilestones = processState.milestones.filter(m => m.instance === instance);
      if (instanceMilestones.length === 0) return;

      doc.setFontSize(14);
      doc.text(
        instance === "primera" ? "PRIMERA INSTANCIA" : 
        instance === "segunda" ? "SEGUNDA INSTANCIA" : 
        "CASACIÓN",
        20, y
      );
      y += 10;

      doc.setFontSize(10);
      instanceMilestones.forEach((m) => {
        doc.text(`• ${m.date} - ${m.title}`, 25, y);
        y += 7;
        if (m.description) {
          doc.text(`  ${m.description.substring(0, 80)}...`, 30, y);
          y += 7;
        }
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
      y += 5;
    });

    doc.save(`reporte_hitos_${processState.caseStatus.caseNumber || 'sin_exp'}.pdf`);
    
    toast({
      title: "Reporte de hitos generado",
      description: "El PDF se ha descargado correctamente",
    });
  };

  const generateFinancialReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("REPORTE FINANCIERO", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Cliente: ${existingClient?.name || "N/A"}`, 20, 35);
    doc.text(`Expediente: ${processState.caseStatus.caseNumber || "Sin asignar"}`, 20, 42);

    doc.text("Resumen Financiero:", 20, 55);
    doc.text(`Honorarios: S/ ${(processState.financial?.honorarios || 0).toFixed(2)}`, 25, 65);
    doc.text(`Gastos: S/ ${(processState.financial?.gastos || 0).toFixed(2)}`, 25, 72);
    doc.text(`Reparación Civil: S/ ${(processState.financial?.reparacionCivil || 0).toFixed(2)}`, 25, 79);

    const totalPagos = (processState.financial?.payments || []).reduce((sum, p) => sum + p.amount, 0);
    doc.text(`Total Pagos Realizados: S/ ${totalPagos.toFixed(2)}`, 25, 86);

    doc.text("Detalle de Pagos:", 20, 100);
    let y = 110;
    (processState.financial?.payments || []).forEach((p, idx) => {
      doc.text(`${idx + 1}. ${p.date} - ${p.concept}: S/ ${(p.amount || 0).toFixed(2)}`, 25, y);
      y += 7;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`reporte_financiero_${processState.caseStatus.caseNumber || 'sin_exp'}.pdf`);
    
    toast({
      title: "Reporte financiero generado",
      description: "El PDF se ha descargado correctamente",
    });
  };

  const generateStageClosureReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("REPORTE DE CIERRE DE ETAPA", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Cliente: ${existingClient?.name || "N/A"}`, 20, 35);
    doc.text(`Expediente: ${processState.caseStatus.caseNumber || "Sin asignar"}`, 20, 42);
    doc.text(`Tipo de Caso: ${processState.caseStatus.caseType}`, 20, 49);
    doc.text(`Etapa Actual: ${processState.caseStatus.currentStage}`, 20, 56);
    doc.text(`Estado: ${getResolutionStatusLabel(processState.caseStatus.resolutionStatus)}`, 20, 63);
    doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString('es-PE')}`, 20, 70);

    let y = 85;
    
    // Resumen de la etapa
    doc.setFontSize(14);
    doc.text("Resumen de la Etapa", 20, y);
    y += 10;
    doc.setFontSize(10);
    
    // Hitos de la etapa actual
    const stageMilestones = processState.milestones.filter(m => 
      m.stage?.toLowerCase().includes(processState.caseStatus.currentStage.toLowerCase()) ||
      m.title?.toLowerCase().includes(processState.caseStatus.currentStage.toLowerCase())
    );
    
    if (stageMilestones.length > 0) {
      doc.text(`Hitos registrados: ${stageMilestones.length}`, 25, y);
      y += 7;
      stageMilestones.forEach((m, idx) => {
        doc.text(`${idx + 1}. ${m.date} - ${m.title}`, 25, y);
        y += 7;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    } else {
      doc.text("No hay hitos específicos para esta etapa.", 25, y);
      y += 7;
    }
    
    y += 10;
    
    // Documentos subidos
    doc.setFontSize(14);
    doc.text("Documentos del Expediente", 20, y);
    y += 10;
    doc.setFontSize(10);
    
    const totalDocs = processState.documentFolders.reduce((sum, folder) => sum + folder.documents.length, 0);
    doc.text(`Total de documentos: ${totalDocs}`, 25, y);
    y += 7;
    
    processState.documentFolders.forEach((folder) => {
      if (folder.documents.length > 0) {
        doc.text(`${folder.label}: ${folder.documents.length} archivo(s)`, 25, y);
        y += 5;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      }
    });
    
    y += 10;
    
    // Intervinientes
    doc.setFontSize(14);
    doc.text("Intervinientes Registrados", 20, y);
    y += 10;
    doc.setFontSize(10);
    
    processState.participants.forEach((p) => {
      doc.text(`• ${p.name} (${getRoleLabel(p.role)})`, 25, y);
      y += 5;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    
    y += 10;
    
    // Próximos pasos
    if (processState.caseStatus.nextDeadline?.date) {
      doc.setFontSize(14);
      doc.text("Próximo Vencimiento", 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.text(`Fecha: ${processState.caseStatus.nextDeadline.date}`, 25, y);
      y += 5;
      doc.text(`Descripción: ${processState.caseStatus.nextDeadline.description || 'Sin descripción'}`, 25, y);
    }

    doc.save(`reporte_cierre_etapa_${processState.caseStatus.caseNumber || 'sin_exp'}.pdf`);
    
    toast({
      title: "Reporte de cierre de etapa generado",
      description: "El PDF se ha descargado correctamente",
    });
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">

      {/* Input file oculto para documentos */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        multiple
        onChange={handleFileSelect}
      />

      {/* Modal de Intervinientes */}
      <Dialog open={isParticipantModalOpen} onOpenChange={(open) => {
        setIsParticipantModalOpen(open);
        if (!open) {
          setEditingParticipantIndex(null);
          setParticipantForm({
            name: "",
            role: "testigo",
            contact: "",
            email: "",
            dni: "",
            relation: "",
            notes: "",
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingParticipantIndex !== null ? "Editar" : "Agregar"} Interviniente</DialogTitle>
            <DialogDescription>Complete los datos del {editingParticipantIndex !== null ? "interviniente" : "nuevo interviniente en el caso"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="participant-name">Nombre Completo *</Label>
              <Input
                id="participant-name"
                value={participantForm.name}
                onChange={(e) => setParticipantForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Dr. Juan Pérez García"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participant-role">Rol en el Proceso *</Label>
              <Select
                value={participantForm.role}
                onValueChange={(value) => setParticipantForm(prev => ({ ...prev, role: value as Participant["role"] }))}
              >
                <SelectTrigger id="participant-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imputado">Imputado (Procesado) 🔴</SelectItem>
                  <SelectItem value="defensor">Defensor / Abogado</SelectItem>
                  <SelectItem value="agraviado">Agraviado</SelectItem>
                  <SelectItem value="fiscal">Fiscal</SelectItem>
                  <SelectItem value="juez">Juez</SelectItem>
                  <SelectItem value="vocal">Vocal (Sala Superior)</SelectItem>
                  <SelectItem value="testigo">Testigo</SelectItem>
                  <SelectItem value="perito">Perito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {participantForm.role === "imputado" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="participant-dni">DNI del Imputado</Label>
                  <Input
                    id="participant-dni"
                    value={participantForm.dni || ""}
                    onChange={(e) => setParticipantForm(prev => ({ ...prev, dni: e.target.value }))}
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participant-relation">Relación con el Cliente</Label>
                  <Input
                    id="participant-relation"
                    value={participantForm.relation || ""}
                    onChange={(e) => setParticipantForm(prev => ({ ...prev, relation: e.target.value }))}
                    placeholder="Ej: Hijo, Cónyuge, etc."
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="participant-contact">Teléfono / WhatsApp</Label>
              <Input
                id="participant-contact"
                value={participantForm.contact}
                onChange={(e) => setParticipantForm(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="Ej: +51 999 999 999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participant-email">Correo Electrónico</Label>
              <Input
                id="participant-email"
                type="email"
                value={participantForm.email}
                onChange={(e) => setParticipantForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="ejemplo@correo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="participant-notes">Notas Adicionales</Label>
              <Textarea
                id="participant-notes"
                value={participantForm.notes}
                onChange={(e) => setParticipantForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Información relevante sobre este interviniente..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsParticipantModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddParticipant}>
              <Plus className="h-4 w-4 mr-2" />
              {editingParticipantIndex !== null ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Hitos */}
      <Dialog open={isMilestoneModalOpen} onOpenChange={setIsMilestoneModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Hito Procesal</DialogTitle>
            <DialogDescription>Registre una audiencia, diligencia, resolución o veredicto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="milestone-instance">Instancia *</Label>
                <Select
                  value={milestoneForm.instance}
                  onValueChange={(value) => setMilestoneForm(prev => ({ ...prev, instance: value as Milestone["instance"] }))}
                >
                  <SelectTrigger id="milestone-instance">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primera">Primera Instancia</SelectItem>
                    <SelectItem value="segunda">Segunda Instancia (Apelación)</SelectItem>
                    <SelectItem value="casacion">Casación (Corte Suprema)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone-stage">Etapa Procesal</Label>
                <Input
                  id="milestone-stage"
                  value={milestoneForm.stage}
                  onChange={(e) => setMilestoneForm(prev => ({ ...prev, stage: e.target.value }))}
                  placeholder="Ej: Investigación Preparatoria"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-title">Título del Hito *</Label>
              <Input
                id="milestone-title"
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Audiencia de Control de Acusación"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-date">Fecha *</Label>
              <Input
                id="milestone-date"
                type="date"
                value={milestoneForm.date}
                onChange={(e) => setMilestoneForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-description">Descripción</Label>
              <Textarea
                id="milestone-description"
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalles del hito procesal..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="milestone-is-verdict"
                checked={milestoneForm.isVerdict}
                onChange={(e) => setMilestoneForm(prev => ({ ...prev, isVerdict: e.target.checked, verdictResult: e.target.checked ? prev.verdictResult : "" }))}
                className="h-4 w-4"
              />
              <Label htmlFor="milestone-is-verdict" className="cursor-pointer">
                Este hito es un veredicto/resolución
              </Label>
            </div>
            {milestoneForm.isVerdict && (
              <div className="space-y-2">
                <Label htmlFor="milestone-verdict">Resultado del Veredicto *</Label>
                <Select
                  value={milestoneForm.verdictResult || ""}
                  onValueChange={(value) => setMilestoneForm(prev => ({ ...prev, verdictResult: value as Milestone["verdictResult"] }))}
                >
                  <SelectTrigger id="milestone-verdict">
                    <SelectValue placeholder="Seleccione resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absolutoria">Absolutoria</SelectItem>
                    <SelectItem value="condenatoria">Condenatoria</SelectItem>
                    <SelectItem value="confirma">Confirma</SelectItem>
                    <SelectItem value="revoca">Revoca</SelectItem>
                    <SelectItem value="anula">Anula</SelectItem>
                    <SelectItem value="fundado">Fundado</SelectItem>
                    <SelectItem value="infundado">Infundado</SelectItem>
                    <SelectItem value="nulo">Nulo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMilestoneModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMilestone}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Hito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagos */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>Ingrese los detalles del pago realizado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-date">Fecha *</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-concept">Concepto *</Label>
              <Input
                id="payment-concept"
                value={paymentForm.concept}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, concept: e.target.value }))}
                placeholder="Ej: Pago honorarios inicial, Gastos notariales, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Monto (S/) *</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPayment}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header con datos del cliente */}
      {existingClient && (() => {
        const clientColor = getClientColor(existingClient.id);
        return (
          <Card 
            className="border-l-4"
            style={{ borderLeftColor: clientColor.primary }}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: clientColor.light }}
                  >
                    <User className="h-6 w-6" style={{ color: clientColor.dark }} />
                  </div>
                  <div>
                    <CardTitle>{existingClient.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{existingClient.email}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                  Volver a Clientes
                </Button>
              </div>
            </CardHeader>
          </Card>
        );
      })()}

      {/* Tabs Principales */}
      <Tabs value={processState.activeTab} onValueChange={(value) => setProcessState(prev => ({ ...prev, activeTab: value as ProcessTab }))}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">
            <FileText className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="intervinientes">
            <Users className="h-4 w-4 mr-2" />
            Intervinientes
          </TabsTrigger>
          <TabsTrigger value="expediente">
            <FolderOpen className="h-4 w-4 mr-2" />
            Expediente
          </TabsTrigger>
          <TabsTrigger value="hitos">
            <Calendar className="h-4 w-4 mr-2" />
            Hitos
          </TabsTrigger>
          <TabsTrigger value="estrategia">
            <Target className="h-4 w-4 mr-2" />
            Estrategia
          </TabsTrigger>
          <TabsTrigger value="financiero">
            <DollarSign className="h-4 w-4 mr-2" />
            Financiero
          </TabsTrigger>
          <TabsTrigger value="reportes">
            <FileDown className="h-4 w-4 mr-2" />
            Reportes
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ficha Técnica del Caso</CardTitle>
              <CardDescription>Datos clave y estado procesal actual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Datos Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Expediente</Label>
                  <Input
                    value={processState.caseStatus.caseNumber}
                    onChange={(e) => setProcessState(prev => ({
                      ...prev,
                      caseStatus: { ...prev.caseStatus, caseNumber: e.target.value }
                    }))}
                    placeholder="Ej: 00123-2024-0-1801-JR-PE-01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Caso</Label>
                  <Select
                    value={processState.caseStatus.caseType}
                    onValueChange={(value) => setProcessState(prev => ({
                      ...prev,
                      caseStatus: { ...prev.caseStatus, caseType: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Penal">Penal</SelectItem>
                      <SelectItem value="Civil">Civil</SelectItem>
                      <SelectItem value="Laboral">Laboral</SelectItem>
                      <SelectItem value="Familia">Familia</SelectItem>
                      <SelectItem value="Constitucional">Constitucional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Estado Procesal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Etapa Procesal Actual</Label>
                  <Input
                    value={processState.caseStatus.currentStage}
                    onChange={(e) => setProcessState(prev => ({
                      ...prev,
                      caseStatus: { ...prev.caseStatus, currentStage: e.target.value }
                    }))}
                    placeholder="Ej: En Apelación"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado de Resolución</Label>
                  <Select
                    value={processState.caseStatus.resolutionStatus}
                    onValueChange={(value: any) => setProcessState(prev => ({
                      ...prev,
                      caseStatus: { ...prev.caseStatus, resolutionStatus: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_tramite">En Trámite</SelectItem>
                      <SelectItem value="absuelto_1ra">Absuelto 1ra Instancia</SelectItem>
                      <SelectItem value="condenado_1ra">Condenado 1ra Instancia</SelectItem>
                      <SelectItem value="absuelto_2da">Absuelto 2da Instancia</SelectItem>
                      <SelectItem value="condenado_2da">Condenado 2da Instancia</SelectItem>
                      <SelectItem value="casacion_fundada">Casación Fundada</SelectItem>
                      <SelectItem value="casacion_infundada">Casación Infundada</SelectItem>
                      <SelectItem value="archivado">Archivado</SelectItem>
                      <SelectItem value="sobreseimiento">Sobreseimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Badge de Estado */}
              {existingClient && (() => {
                const clientColor = getClientColor(existingClient.id);
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Estado Actual:</span>
                    <Badge 
                      className="border"
                      style={{ 
                        backgroundColor: clientColor.light, 
                        color: clientColor.dark,
                        borderColor: clientColor.primary
                      }}
                    >
                      {getResolutionStatusLabel(processState.caseStatus.resolutionStatus)}
                    </Badge>
                  </div>
                );
              })()}

              {/* Próximo Vencimiento */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Próximo Hito / Vencimiento</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    type="date"
                    value={processState.caseStatus.nextDeadline?.date || ""}
                    onChange={(e) => setProcessState(prev => ({
                      ...prev,
                      caseStatus: {
                        ...prev.caseStatus,
                        nextDeadline: {
                          date: e.target.value,
                          description: prev.caseStatus.nextDeadline?.description || ""
                        }
                      }
                    }))}
                  />
                  <Input
                    placeholder="Descripción del vencimiento"
                    value={processState.caseStatus.nextDeadline?.description || ""}
                    onChange={(e) => setProcessState(prev => ({
                      ...prev,
                      caseStatus: {
                        ...prev.caseStatus,
                        nextDeadline: {
                          date: prev.caseStatus.nextDeadline?.date || "",
                          description: e.target.value
                        }
                      }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: INTERVINIENTES */}
        <TabsContent value="intervinientes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Directorio del Caso</CardTitle>
                  <CardDescription>Todos los intervinientes en el proceso</CardDescription>
                </div>
                <Button onClick={() => setIsParticipantModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Interviniente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processState.participants.map((participant, idx) => (
                  <div key={participant.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          participant.role === "cliente" ? "bg-blue-100 dark:bg-blue-900" : 
                          participant.role === "imputado" ? "bg-red-100 dark:bg-red-900" :
                          "bg-gray-100 dark:bg-gray-800"
                        }`}>
                          {participant.role === "cliente" && <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                          {participant.role === "imputado" && <User className="h-5 w-5 text-red-600 dark:text-red-400" />}
                          {participant.role === "defensor" && <Scale className="h-5 w-5" />}
                          {(participant.role === "fiscal" || participant.role === "juez") && <Gavel className="h-5 w-5" />}
                          {(participant.role === "agraviado" || participant.role === "testigo") && <Users className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          <p className="text-sm text-muted-foreground">{getRoleLabel(participant.role)}</p>
                          {participant.dni && (
                            <p className="text-sm text-muted-foreground mt-1">🆔 DNI: {participant.dni}</p>
                          )}
                          {participant.relation && (
                            <p className="text-sm text-muted-foreground">👥 Relación: {participant.relation}</p>
                          )}
                          {participant.contact && (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-muted-foreground">📱 {participant.contact}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => window.open(`https://wa.me/${(participant.contact || '').replace(/[^0-9]/g, '')}`, '_blank')}
                              >
                                WhatsApp
                              </Button>
                            </div>
                          )}
                          {participant.email && (
                            <p className="text-sm text-muted-foreground">✉️ {participant.email}</p>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleEditParticipant(idx)}>Editar</Button>
                    </div>
                  </div>
                ))}
                {processState.participants.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay intervinientes registrados</p>
                    <p className="text-sm">Agrega abogados, fiscales, jueces, testigos, etc.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: EXPEDIENTE DIGITAL - Sistema de gestión documental */}
        <TabsContent value="expediente" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Expediente Digital
              </CardTitle>
              <CardDescription>
                Documentos organizados por fase del proceso. Click en cualquier carpeta para ver su contenido. Doble clic en documentos para abrirlos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="investigacion" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="investigacion">📋 Investigación</TabsTrigger>
                  <TabsTrigger value="estrategia">⚖️ Estrategia</TabsTrigger>
                  <TabsTrigger value="reunion">👥 Reunión</TabsTrigger>
                  <TabsTrigger value="seguimiento">📊 Seguimiento</TabsTrigger>
                </TabsList>
                
                <TabsContent value="investigacion" className="mt-4">
                  <DocumentFolderManager
                    clientId={clientId || ''}
                    phase="investigacion"
                    readOnly={false}
                  />
                </TabsContent>
                
                <TabsContent value="estrategia" className="mt-4">
                  <DocumentFolderManager
                    clientId={clientId || ''}
                    phase="estrategia"
                    readOnly={false}
                  />
                </TabsContent>
                
                <TabsContent value="reunion" className="mt-4">
                  <DocumentFolderManager
                    clientId={clientId || ''}
                    phase="reunion"
                    readOnly={false}
                  />
                </TabsContent>
                
                <TabsContent value="seguimiento" className="mt-4">
                  <DocumentFolderManager
                    clientId={clientId || ''}
                    phase="seguimiento"
                    readOnly={false}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: HITOS PROCESALES */}
        <TabsContent value="hitos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Línea de Tiempo Procesal</CardTitle>
                  <CardDescription>Hitos agrupados por instancia</CardDescription>
                </div>
                <Button onClick={() => setIsMilestoneModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Hito
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {processState.milestones.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay hitos registrados</p>
                  <p className="text-sm">Registra audiencias, diligencias y resoluciones</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Agrupar por instancia */}
                  {["primera", "segunda", "casacion"].map((instance) => {
                    const instanceMilestones = processState.milestones.filter(m => m.instance === instance);
                    if (instanceMilestones.length === 0) return null;
                    
                    return (
                      <div key={instance}>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          {instance === "primera" && "Primera Instancia"}
                          {instance === "segunda" && "Segunda Instancia (Apelación)"}
                          {instance === "casacion" && "Casación (Corte Suprema)"}
                        </h3>
                        <div className="space-y-3 border-l-2 border-primary/30 pl-4">
                          {instanceMilestones.map((milestone) => (
                            <div key={milestone.id} className="relative">
                              <div className="absolute -left-[1.3rem] top-2 h-4 w-4 rounded-full bg-primary" />
                              <div className="p-4 border rounded-lg bg-card">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-medium">{milestone.title}</h4>
                                    <p className="text-sm text-muted-foreground">{milestone.date}</p>
                                  </div>
                                  {milestone.isVerdict && (
                                    <Badge className={
                                      milestone.verdictResult?.includes("absolut") || milestone.verdictResult === "fundado" 
                                        ? "bg-green-500" 
                                        : "bg-red-500"
                                    }>
                                      {milestone.verdictResult?.toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm">{milestone.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: ESTRATEGIA */}
        <TabsContent value="estrategia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estrategia y Notas Privadas</CardTitle>
              <CardDescription>Uso interno - No visible para el cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Teoría del Caso</Label>
                <Textarea
                  value={processState.strategy.caseTheory}
                  onChange={(e) => setProcessState(prev => ({
                    ...prev,
                    strategy: { ...prev.strategy, caseTheory: e.target.value }
                  }))}
                  placeholder="Desarrolla tu teoría del caso..."
                  className="min-h-[150px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Análisis de Hechos</Label>
                <Textarea
                  value={processState.strategy.factsAnalysis}
                  onChange={(e) => setProcessState(prev => ({
                    ...prev,
                    strategy: { ...prev.strategy, factsAnalysis: e.target.value }
                  }))}
                  placeholder="Análisis detallado de los hechos..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Estrategia Legal</Label>
                <Textarea
                  value={processState.strategy.legalStrategy}
                  onChange={(e) => setProcessState(prev => ({
                    ...prev,
                    strategy: { ...prev.strategy, legalStrategy: e.target.value }
                  }))}
                  placeholder="Líneas de defensa, argumentos, recursos..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Notas Privadas</Label>
                <Textarea
                  value={processState.strategy.privateNotes}
                  onChange={(e) => setProcessState(prev => ({
                    ...prev,
                    strategy: { ...prev.strategy, privateNotes: e.target.value }
                  }))}
                  placeholder="Apuntes, recordatorios, pendientes..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Zona de subida de archivos/notas */}
              <div className="pt-4 border-t">
                <FileUploadZone
                  title="Archivos y Notas Adjuntas"
                  description="Sube documentos externos o crea notas de texto relacionadas con la estrategia"
                  files={processState.strategy.attachments}
                  onFilesChange={(files) =>
                    setProcessState(prev => ({
                      ...prev,
                      strategy: { ...prev.strategy, attachments: files },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: CONTROL FINANCIERO */}
        <TabsContent value="financiero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Control Financiero</CardTitle>
              <CardDescription>Honorarios, gastos y reparación civil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm text-muted-foreground">Honorarios</Label>
                  <p className="text-2xl font-bold mt-2">S/ {(processState.financial?.honorarios || 0).toFixed(2)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm text-muted-foreground">Gastos</Label>
                  <p className="text-2xl font-bold mt-2">S/ {(processState.financial?.gastos || 0).toFixed(2)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Label className="text-sm text-muted-foreground">Reparación Civil</Label>
                  <p className="text-2xl font-bold mt-2">S/ {(processState.financial?.reparacionCivil || 0).toFixed(2)}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Registro de Pagos</Label>
                  <Button size="sm" variant="outline" onClick={() => setIsPaymentModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Pago
                  </Button>
                </div>
                {processState.financial?.payments?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No hay pagos registrados
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(processState.financial?.payments || []).map((payment, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{payment.concept}</p>
                          <p className="text-sm text-muted-foreground">{payment.date}</p>
                        </div>
                        <p className="font-semibold">S/ {(payment.amount || 0).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 7: REPORTES */}
        <TabsContent value="reportes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generador de Reportes</CardTitle>
              <CardDescription>Informes para el cliente o uso interno</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" size="lg" onClick={generateStatusReport}>
                <FileDown className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Reporte de Estado Actual</p>
                  <p className="text-xs text-muted-foreground">Dashboard + últimos 5 hitos + próximo vencimiento</p>
                </div>
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg" onClick={generateTimelineReport}>
                <FileDown className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Reporte de Hitos (Línea de Tiempo Completa)</p>
                  <p className="text-xs text-muted-foreground">Historial completo del caso explicado</p>
                </div>
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg" onClick={generateStageClosureReport}>
                <FileDown className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Reporte de Cierre de Etapa</p>
                  <p className="text-xs text-muted-foreground">Resumen de una etapa específica (Investigación, Juicio, etc.)</p>
                </div>
              </Button>
              <Button className="w-full justify-start" variant="outline" size="lg" onClick={generateFinancialReport}>
                <FileDown className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Reporte Financiero</p>
                  <p className="text-xs text-muted-foreground">Estado de cuenta: honorarios, gastos, pagos</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
