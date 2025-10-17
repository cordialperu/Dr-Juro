import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { VoiceInput } from "@/components/ui/voice-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ClipboardList, 
  Calendar, 
  Target, 
  FileText, 
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Plus,
  Save,
  Loader2,
  Brain,
  Users,
  Scale,
  Upload,
  Camera,
  X,
  FileImage
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateClientMutation } from "@/hooks/useClients";
import { useProcessState, useSaveProcessState } from "@/hooks/useProcessState";
import { useAddCaseDocument, useUpdateDocumentNotes, useDeleteCaseDocument } from "@/hooks/useCaseDocuments";

// Tipos para el proceso
interface ClientInfo {
  name: string;
  phone: string;
  email: string;
  caseDescription: string;
  clientId?: string;
}

interface UploadedDocument {
  id: string;
  filename: string;
  type: string;
  content: string;
  isProcessing: boolean;
  category: "notifications" | "police-report" | "additional";
  notes?: string;
  uploadDate?: string;
  file?: File; // Almacenar el archivo para transcripción posterior
}
interface InvestigationProgress {
  notifications: string;
  policeReport: string;
  additionalDocuments: string;
}

interface CaseStrategy {
  factsAnalysis: string;
  caseTheory: string;
  objectives: string[];
  legalStrategy: string;
  aiAnalysisResult?: string;
  theoryDraft?: string;
}

interface ClientMeeting {
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
}

type ProcessPhase = "client-info" | "investigation" | "strategy" | "meeting" | "followup" | "completed";

interface ProcessState {
  currentPhase: ProcessPhase;
  clientInfo: ClientInfo;
  uploadedDocuments: UploadedDocument[];
  investigationProgress: InvestigationProgress;
  caseStrategy: CaseStrategy;
  clientMeeting: ClientMeeting;
  completionPercentage: number;
}

export function ProcessPage() {
  const [, navigate] = useLocation();
  const params = useParams();
  const caseId = params.caseId;
  const { toast } = useToast();
  const createClientMutation = useCreateClientMutation();
  
  // Hooks de persistencia
  const { data: processData, isLoading: isLoadingProcess } = useProcessState(caseId);
  const saveProcessMutation = useSaveProcessState(caseId);
  const addDocumentMutation = useAddCaseDocument(caseId);
  const updateNotesMutation = useUpdateDocumentNotes(caseId);
  const deleteDocumentMutation = useDeleteCaseDocument(caseId);
  
  // Refs separados para cada categoría
  const notificationsFileRef = useRef<HTMLInputElement>(null);
  const notificationsCameraRef = useRef<HTMLInputElement>(null);
  const policeFileRef = useRef<HTMLInputElement>(null);
  const policeCameraRef = useRef<HTMLInputElement>(null);
  const additionalFileRef = useRef<HTMLInputElement>(null);
  const additionalCameraRef = useRef<HTMLInputElement>(null);

  const [processState, setProcessState] = useState<ProcessState>({
    currentPhase: "client-info",
    clientInfo: {
      name: "",
      phone: "",
      email: "",
      caseDescription: "",
    },
    uploadedDocuments: [],
    investigationProgress: {
      notifications: "",
      policeReport: "",
      additionalDocuments: "",
    },
    caseStrategy: {
      factsAnalysis: "",
      caseTheory: "",
      objectives: [],
      legalStrategy: "",
    },
    clientMeeting: {
      date: "",
      time: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      notes: "",
    },
    completionPercentage: 0,
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newObjective, setNewObjective] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [previousPhase, setPreviousPhase] = useState<ProcessPhase | null>(null); // Para volver después de editar cliente
  
  // Estados para la nueva UX de documentos
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<{
    filename: string;
    text: string;
    file: File;
  } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"notifications" | "police-report" | "additional" | null>(null);
  const [expandedField, setExpandedField] = useState<"notifications" | "police-report" | "additional" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Cargar datos desde la base de datos cuando hay un caseId
  useEffect(() => {
    if (processData?.processState && caseId) {
      const ps = processData.processState;
      const clientInfo = (ps.clientInfo as ClientInfo) || { name: "", phone: "", email: "", caseDescription: "" };
      
      setProcessState((prev) => ({
        ...prev,
        currentPhase: ps.currentPhase as ProcessPhase,
        completionPercentage: Number(ps.completionPercentage) || 0,
        clientInfo,
        investigationProgress: (ps.investigationProgress as InvestigationProgress) || prev.investigationProgress,
        caseStrategy: (ps.caseStrategy as CaseStrategy) || prev.caseStrategy,
        clientMeeting: (ps.clientMeeting as ClientMeeting) || prev.clientMeeting,
      }));
      
      console.log("Datos cargados desde BD:", {
        phase: ps.currentPhase,
        clientName: clientInfo.name,
        clientId: clientInfo.clientId,
      });
    }

    // Cargar documentos
    if (processData?.documents && caseId) {
      const mappedDocuments: UploadedDocument[] = processData.documents.map((doc: any) => ({
        id: doc.id,
        filename: doc.filename,
        type: doc.fileType,
        content: doc.content || "",
        isProcessing: false,
        category: doc.category,
        notes: doc.notes || "",
        uploadDate: doc.uploadDate,
      }));
      
      setProcessState((prev) => ({
        ...prev,
        uploadedDocuments: mappedDocuments,
      }));
      
      console.log("Documentos cargados:", mappedDocuments.length);
    }
  }, [processData, caseId]);

  // Auto-guardar cambios cada 3 segundos cuando hay modificaciones
  useEffect(() => {
    if (!caseId || !processState.clientInfo.clientId) return;

    const timeoutId = setTimeout(() => {
      console.log("Auto-guardando progreso...");
      saveProcessToDB(processState);
    }, 3000); // 3 segundos después del último cambio

    return () => clearTimeout(timeoutId);
  }, [
    processState.investigationProgress,
    processState.caseStrategy,
    processState.clientMeeting,
    processState.currentPhase,
    caseId,
  ]);

  // Calcular progreso de la fase actual
  const calculatePhaseProgress = (): number => {
    const phase = processState.currentPhase;
    
    if (phase === "client-info") {
      const requiredFields = [
        processState.clientInfo.name,
        processState.clientInfo.phone,
        processState.clientInfo.email,
      ];
      const completed = requiredFields.filter(f => f.trim().length > 0).length;
      return Math.round((completed / requiredFields.length) * 100);
    }
    
    if (phase === "investigation") {
      const fields = Object.values(processState.investigationProgress);
      const completed = fields.filter(f => f.trim().length > 0).length;
      return Math.round((completed / fields.length) * 100);
    }
    
    if (phase === "strategy") {
      let total = 4; // factsAnalysis, caseTheory, objectives (al menos 1), legalStrategy
      let completed = 0;
      
      if (processState.caseStrategy.factsAnalysis.trim()) completed++;
      if (processState.caseStrategy.caseTheory.trim()) completed++;
      if (processState.caseStrategy.objectives.length > 0) completed++;
      if (processState.caseStrategy.legalStrategy.trim()) completed++;
      
      return Math.round((completed / total) * 100);
    }
    
    if (phase === "meeting") {
      const fields = [
        processState.clientMeeting.date,
        processState.clientMeeting.time,
        processState.clientMeeting.clientName,
      ];
      const completed = fields.filter(f => f.trim().length > 0).length;
      return Math.round((completed / fields.length) * 100);
    }
    
    return 0;
  };

  // Helper para guardar el estado del proceso en la base de datos
  const saveProcessToDB = async (state: ProcessState) => {
    if (!caseId) return;

    setIsSaving(true);
    try {
      await saveProcessMutation.mutateAsync({
        currentPhase: state.currentPhase,
        completionPercentage: String(state.completionPercentage),
        clientInfo: state.clientInfo,
        investigationProgress: state.investigationProgress,
        caseStrategy: state.caseStrategy,
        clientMeeting: state.clientMeeting,
      });
      setLastSaved(new Date());
      console.log("✅ Progreso guardado exitosamente");
    } catch (error) {
      console.error("Error al guardar estado del proceso:", error);
      toast({
        title: "Advertencia",
        description: "Los cambios se guardaron localmente pero no se pudieron sincronizar.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Registrar cliente y avanzar a investigación
  const registerClientAndContinue = async () => {
    const progress = calculatePhaseProgress();
    if (progress < 100) {
      toast({
        title: "Información incompleta",
        description: "Por favor, complete nombre, teléfono y correo del cliente.",
        variant: "destructive",
      });
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(processState.clientInfo.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, ingrese un correo electrónico válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Si ya existe clientId, es una edición, no crear nuevo cliente
      if (processState.clientInfo.clientId) {
        // Solo actualizar el estado local y volver a la fase anterior
        const targetPhase = previousPhase || "investigation";
        const newState = {
          ...processState,
          clientMeeting: {
            ...processState.clientMeeting,
            clientName: processState.clientInfo.name,
            clientEmail: processState.clientInfo.email,
            clientPhone: processState.clientInfo.phone,
          },
          currentPhase: targetPhase,
        };

        setProcessState(newState);
        setPreviousPhase(null); // Limpiar
        
        // Guardar en la base de datos
        await saveProcessToDB(newState);

        toast({
          title: "Datos actualizados",
          description: `Información de ${processState.clientInfo.name} actualizada exitosamente.`,
        });
        return;
      }

      // Crear cliente nuevo
      const newClient = await createClientMutation.mutateAsync({
        name: processState.clientInfo.name,
        contactInfo: `Tel: ${processState.clientInfo.phone} | Email: ${processState.clientInfo.email}`,
      });

      const newState = {
        ...processState,
        clientInfo: {
          ...processState.clientInfo,
          clientId: newClient.id,
        },
        clientMeeting: {
          ...processState.clientMeeting,
          clientName: processState.clientInfo.name,
          clientEmail: processState.clientInfo.email,
          clientPhone: processState.clientInfo.phone,
        },
        currentPhase: "investigation" as ProcessPhase,
        completionPercentage: 10,
      };

      setProcessState(newState);
      
      // Guardar en la base de datos
      await saveProcessToDB(newState);

      toast({
        title: "Cliente registrado",
        description: `${newClient.name} ha sido registrado exitosamente. Proceda con la investigación.`,
      });
    } catch (error) {
      toast({
        title: "Error al registrar cliente",
        description: error instanceof Error ? error.message : "No se pudo crear el cliente.",
        variant: "destructive",
      });
    }
  };

  // Procesar texto extraído de archivo o foto
  // NUEVA FUNCIÓN: Abrir modal de carga de documento
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setIsUploadModalOpen(true);

    try {
      let extractedText = "";

      // Si es texto plano, leerlo directamente
      if (file.type === "text/plain") {
        extractedText = await file.text();
      } else {
        // Para imágenes y PDFs, enviar al backend para OCR
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/extract-text", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("No se pudo extraer el texto");
        }

        const data = await response.json();
        extractedText = data.text || "";
        
        console.log("=== DEBUG EXTRACCIÓN ===");
        console.log("Respuesta del servidor:", data);
        console.log("Longitud del texto extraído:", extractedText.length);
        console.log("Primeros 200 caracteres:", extractedText.substring(0, 200));
        console.log("========================");
      }

      setUploadedFilePreview({
        filename: file.name,
        text: extractedText,
        file,
      });

      console.log("Estado del preview guardado:", {
        filename: file.name,
        textLength: extractedText.length,
      });

      toast({
        title: "Documento procesado",
        description: `${extractedText.length} caracteres extraídos. Revise el texto y seleccione dónde anexarlo.`,
      });
    } catch (error) {
      toast({
        title: "Error al procesar documento",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
      setIsUploadModalOpen(false);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // NUEVA FUNCIÓN: Anexar texto a una categoría
  const annexTextToCategory = async (category: "notifications" | "police-report" | "additional") => {
    if (!uploadedFilePreview) return;

    const { filename, text } = uploadedFilePreview;

    // Anexar al campo correspondiente
    if (category === "notifications") {
      setProcessState(prev => ({
        ...prev,
        investigationProgress: {
          ...prev.investigationProgress,
          notifications: prev.investigationProgress.notifications
            ? `${prev.investigationProgress.notifications}\n\n--- ${filename} ---\n${text}`
            : `--- ${filename} ---\n${text}`,
        },
      }));
    } else if (category === "police-report") {
      setProcessState(prev => ({
        ...prev,
        investigationProgress: {
          ...prev.investigationProgress,
          policeReport: prev.investigationProgress.policeReport
            ? `${prev.investigationProgress.policeReport}\n\n--- ${filename} ---\n${text}`
            : `--- ${filename} ---\n${text}`,
        },
      }));
    } else {
      setProcessState(prev => ({
        ...prev,
        investigationProgress: {
          ...prev.investigationProgress,
          additionalDocuments: prev.investigationProgress.additionalDocuments
            ? `${prev.investigationProgress.additionalDocuments}\n\n--- ${filename} ---\n${text}`
            : `--- ${filename} ---\n${text}`,
        },
      }));
    }

    // Cerrar modal y limpiar
    setIsUploadModalOpen(false);
    setUploadedFilePreview(null);
    setSelectedCategory(null);

    toast({
      title: "Documento anexado",
      description: `El contenido de ${filename} se agregó exitosamente.`,
    });
  };

  // Procesar texto extraído de archivo o foto (LEGACY - mantener por compatibilidad)
  // Agregar documento sin procesar (solo subir)
  const addDocumentToFolder = async (file: File, category: "notifications" | "police-report" | "additional") => {
    const docId = `doc-${Date.now()}`;
    
    const newDocument: UploadedDocument = {
      id: docId,
      filename: file.name,
      type: file.type,
      content: "", // Sin contenido aún
      isProcessing: false,
      category,
      notes: "",
      uploadDate: new Date().toISOString(),
      file: file, // Guardar el archivo para transcripción posterior
    };

    // Agregar al estado local
    setProcessState(prev => ({
      ...prev,
      uploadedDocuments: [
        ...prev.uploadedDocuments,
        newDocument,
      ],
    }));

    // Guardar en la base de datos si hay caseId
    if (caseId) {
      try {
        await addDocumentMutation.mutateAsync({
          filename: file.name,
          fileType: file.type,
          category,
          content: "", // Sin transcribir aún
          notes: "",
        });
      } catch (error) {
        console.error("Error al guardar documento:", error);
      }
    }

    return docId;
  };

  // Transcribir documento (segunda etapa)
  const transcribeDocument = async (docId: string) => {
    const document = processState.uploadedDocuments.find(doc => doc.id === docId);
    if (!document || !document.file) {
      toast({
        title: "Error",
        description: "No se encontró el archivo para transcribir.",
        variant: "destructive",
      });
      return;
    }

    // Marcar como procesando
    setProcessState(prev => ({
      ...prev,
      uploadedDocuments: prev.uploadedDocuments.map(doc =>
        doc.id === docId ? { ...doc, isProcessing: true } : doc
      ),
    }));

    try {
      let extractedText = "";

      // Si es texto plano, leerlo directamente
      if (document.type === "text/plain") {
        extractedText = await document.file.text();
      } else {
        // Para imágenes y PDFs, enviar al backend para OCR con Gemini
        const formData = new FormData();
        formData.append("file", document.file);

        const response = await fetch("/api/extract-text", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "No se pudo extraer el texto");
        }

        const data = await response.json();
        extractedText = data.text || "";
      }

      // Actualizar el documento con el contenido transcrito
      setProcessState(prev => ({
        ...prev,
        uploadedDocuments: prev.uploadedDocuments.map(doc =>
          doc.id === docId 
            ? { ...doc, content: extractedText, isProcessing: false } 
            : doc
        ),
      }));

      // Actualizar en la base de datos
      if (caseId) {
        try {
          await updateNotesMutation.mutateAsync({ 
            documentId: docId, 
            notes: document.notes || "" 
          });
        } catch (error) {
          console.error("Error al actualizar documento:", error);
        }
      }

      // Anexar al campo correspondiente
      const category = document.category;
      const text = extractedText;
      const filename = document.filename;

      if (category === "notifications") {
        setProcessState(prev => ({
          ...prev,
          investigationProgress: {
            ...prev.investigationProgress,
            notifications: prev.investigationProgress.notifications
              ? `${prev.investigationProgress.notifications}\n\n--- ${filename} ---\n${text}`
              : `--- ${filename} ---\n${text}`,
          },
        }));
      } else if (category === "police-report") {
        setProcessState(prev => ({
          ...prev,
          investigationProgress: {
            ...prev.investigationProgress,
            policeReport: prev.investigationProgress.policeReport
              ? `${prev.investigationProgress.policeReport}\n\n--- ${filename} ---\n${text}`
              : `--- ${filename} ---\n${text}`,
          },
        }));
      } else {
        setProcessState(prev => ({
          ...prev,
          investigationProgress: {
            ...prev.investigationProgress,
            additionalDocuments: prev.investigationProgress.additionalDocuments
              ? `${prev.investigationProgress.additionalDocuments}\n\n--- ${filename} ---\n${text}`
              : `--- ${filename} ---\n${text}`,
          },
        }));
      }

      toast({
        title: "Documento transcrito",
        description: `El contenido de ${filename} se agregó al campo de texto.`,
      });

    } catch (error) {
      // Quitar estado de procesando
      setProcessState(prev => ({
        ...prev,
        uploadedDocuments: prev.uploadedDocuments.map(doc =>
          doc.id === docId ? { ...doc, isProcessing: false } : doc
        ),
      }));

      toast({
        title: "Error al transcribir",
        description: error instanceof Error ? error.message : "No se pudo transcribir el documento.",
        variant: "destructive",
      });
    }
  };

  const processExtractedText = async (text: string, filename: string, category: "notifications" | "police-report" | "additional"): Promise<void> => {
    // Aquí se podría hacer análisis adicional del texto si es necesario
    const docId = `doc-${Date.now()}`;
    
    const newDocument: UploadedDocument = {
      id: docId,
      filename,
      type: "text/plain",
      content: text,
      isProcessing: false,
      category,
      notes: "",
      uploadDate: new Date().toISOString(),
    };

    // Guardar en el estado local
    setProcessState(prev => ({
      ...prev,
      uploadedDocuments: [
        ...prev.uploadedDocuments,
        newDocument,
      ],
    }));

    // Guardar en la base de datos si hay caseId
    if (caseId) {
      try {
        await addDocumentMutation.mutateAsync({
          filename,
          fileType: "text/plain",
          category,
          content: text,
          notes: "",
        });
      } catch (error) {
        console.error("Error al guardar documento en la base de datos:", error);
        toast({
          title: "Advertencia",
          description: "El documento se guardó localmente pero no se pudo sincronizar con el servidor.",
          variant: "destructive",
        });
      }
    }

    // Anexar al campo correspondiente según la categoría
    if (category === "notifications") {
      setProcessState(prev => ({
        ...prev,
        investigationProgress: {
          ...prev.investigationProgress,
          notifications: prev.investigationProgress.notifications
            ? `${prev.investigationProgress.notifications}\n\n--- ${filename} ---\n${text}`
            : `--- ${filename} ---\n${text}`,
        },
      }));
    } else if (category === "police-report") {
      setProcessState(prev => ({
        ...prev,
        investigationProgress: {
          ...prev.investigationProgress,
          policeReport: prev.investigationProgress.policeReport
            ? `${prev.investigationProgress.policeReport}\n\n--- ${filename} ---\n${text}`
            : `--- ${filename} ---\n${text}`,
        },
      }));
    } else {
      setProcessState(prev => ({
        ...prev,
        investigationProgress: {
          ...prev.investigationProgress,
          additionalDocuments: prev.investigationProgress.additionalDocuments
            ? `${prev.investigationProgress.additionalDocuments}\n\n--- ${filename} ---\n${text}`
            : `--- ${filename} ---\n${text}`,
        },
      }));
    }
  };

  // Manejar subida de archivo (ETAPA 1: Solo agregar a carpeta)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, category: "notifications" | "police-report" | "additional") => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await addDocumentToFolder(file, category);

      toast({
        title: "Documento cargado",
        description: `${file.name} se agregó exitosamente. Usa el botón "Transcribir" para extraer el contenido.`,
      });
    } catch (error) {
      toast({
        title: "Error al cargar documento",
        description: error instanceof Error ? error.message : "No se pudo cargar el documento.",
        variant: "destructive",
      });
    } finally {
      // Limpiar el input correcto según la categoría
      if (category === "notifications" && notificationsFileRef.current) {
        notificationsFileRef.current.value = "";
      } else if (category === "police-report" && policeFileRef.current) {
        policeFileRef.current.value = "";
      } else if (category === "additional" && additionalFileRef.current) {
        additionalFileRef.current.value = "";
      }
    }
  };

  // Manejar captura de foto
  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>, category: "notifications" | "police-report" | "additional") => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Crear un File con nombre personalizado
      const photoFile = new File([file], `Foto_${new Date().toLocaleDateString()}.jpg`, { type: file.type });
      
      await addDocumentToFolder(photoFile, category);

      toast({
        title: "Foto capturada",
        description: "La foto se agregó exitosamente. Usa el botón 'Transcribir' para extraer el texto.",
      });
    } catch (error) {
      toast({
        title: "Error al capturar foto",
        description: error instanceof Error ? error.message : "No se pudo capturar la foto.",
        variant: "destructive",
      });
    } finally {
      // Limpiar el input correcto según la categoría
      if (category === "notifications" && notificationsCameraRef.current) {
        notificationsCameraRef.current.value = "";
      } else if (category === "police-report" && policeCameraRef.current) {
        policeCameraRef.current.value = "";
      } else if (category === "additional" && additionalCameraRef.current) {
        additionalCameraRef.current.value = "";
      }
    }
  };

  // Eliminar documento subido
  const removeDocument = (docId: string) => {
    setProcessState(prev => ({
      ...prev,
      uploadedDocuments: prev.uploadedDocuments.filter(doc => doc.id !== docId),
    }));

    toast({
      title: "Documento eliminado",
      description: "El documento ha sido removido del caso.",
    });
  };

  // Actualizar notas de un documento
  const updateDocumentNotes = async (docId: string, notes: string) => {
    // Actualizar en el estado local
    setProcessState(prev => ({
      ...prev,
      uploadedDocuments: prev.uploadedDocuments.map(doc =>
        doc.id === docId ? { ...doc, notes } : doc
      ),
    }));

    // Guardar en la base de datos si hay caseId
    if (caseId) {
      try {
        await updateNotesMutation.mutateAsync({ documentId: docId, notes });
      } catch (error) {
        console.error("Error al actualizar notas:", error);
        toast({
          title: "Advertencia",
          description: "Las notas se guardaron localmente pero no se pudieron sincronizar.",
          variant: "destructive",
        });
      }
    }
  };

  // Análisis de hechos con AI
  const analyzeFactsWithAI = async () => {
    if (!processState.investigationProgress.policeReport.trim()) {
      toast({
        title: "Información incompleta",
        description: "Por favor, ingrese la denuncia policial para analizar los hechos.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Simular análisis (en producción, esto llamaría a la API de Gemini/OpenAI)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAnalysis = `ANÁLISIS DE HECHOS:

Basado en la denuncia policial proporcionada, se identifican los siguientes elementos clave:

1. HECHOS PRINCIPALES:
   - Se describe un incidente con elementos de [identificar delito/situación]
   - Las partes involucradas son claramente identificables
   - Existe documentación de respaldo inicial

2. ELEMENTOS PROBATORIOS:
   - Denuncia policial formal
   - ${processState.investigationProgress.notifications ? "Notificaciones oficiales" : ""}
   - ${processState.investigationProgress.additionalDocuments ? "Documentación adicional" : ""}

3. LÍNEA DE TIEMPO:
   - Los eventos descritos siguen una secuencia cronológica clara
   - Se pueden establecer fechas clave para el proceso

4. RECOMENDACIONES INICIALES:
   - Recopilar testimonios adicionales
   - Solicitar documentación complementaria
   - Verificar competencia territorial`;

      setProcessState(prev => ({
        ...prev,
        caseStrategy: {
          ...prev.caseStrategy,
          aiAnalysisResult: mockAnalysis,
          factsAnalysis: mockAnalysis,
        },
      }));

      toast({
        title: "Análisis completado",
        description: "Los hechos han sido analizados exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error en el análisis",
        description: "No se pudo completar el análisis. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generar teoría del caso con AI
  const generateCaseTheoryWithAI = async () => {
    if (!processState.caseStrategy.factsAnalysis.trim()) {
      toast({
        title: "Análisis de hechos requerido",
        description: "Primero debe completar el análisis de hechos.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const mockTheory = `TEORÍA DEL CASO - BORRADOR:

I. TEORÍA FÁCTICA:
El presente caso se configura cuando [descripción de los hechos principales], lo cual constituye una clara [violación/incumplimiento/situación jurídica relevante].

II. TEORÍA JURÍDICA:
Los hechos descritos encuadran en:
- [Artículo/norma aplicable 1]
- [Artículo/norma aplicable 2]
- [Precedente vinculante, si aplica]

III. POSICIÓN DEL CLIENTE:
Nuestro representado busca:
1. El reconocimiento de sus derechos
2. La reparación del daño causado
3. El establecimiento de medidas preventivas

IV. ARGUMENTACIÓN PRINCIPAL:
Se probará que [argumento central del caso], mediante:
- Prueba documental
- Prueba testimonial
- Prueba pericial (si aplica)

V. RESULTADOS ESPERADOS:
- Declaración favorable en [instancia correspondiente]
- Reparación integral del daño
- Costas y costos del proceso`;

      setProcessState(prev => ({
        ...prev,
        caseStrategy: {
          ...prev.caseStrategy,
          theoryDraft: mockTheory,
          caseTheory: mockTheory,
        },
      }));

      toast({
        title: "Teoría del caso generada",
        description: "Puede revisar y ajustar el borrador generado.",
      });
    } catch (error) {
      toast({
        title: "Error al generar teoría",
        description: "No se pudo generar la teoría del caso. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Agregar objetivo
  const addObjective = () => {
    if (!newObjective.trim()) return;
    
    setProcessState(prev => ({
      ...prev,
      caseStrategy: {
        ...prev.caseStrategy,
        objectives: [...prev.caseStrategy.objectives, newObjective.trim()],
      },
    }));
    
    setNewObjective("");
  };

  // Remover objetivo
  const removeObjective = (index: number) => {
    setProcessState(prev => ({
      ...prev,
      caseStrategy: {
        ...prev.caseStrategy,
        objectives: prev.caseStrategy.objectives.filter((_, i) => i !== index),
      },
    }));
  };

  // Completar fase de investigación
  const completeInvestigationPhase = async () => {
    const progress = calculatePhaseProgress();
    if (progress < 100) {
      toast({
        title: "Fase incompleta",
        description: "Por favor, complete todos los campos antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    const newState = {
      ...processState,
      currentPhase: "strategy" as ProcessPhase,
      completionPercentage: 35,
    };

    setProcessState(newState);
    await saveProcessToDB(newState);

    toast({
      title: "Fase completada",
      description: "Avance de investigación registrado. Proceda a armar la estrategia.",
    });
  };

  // Completar fase de estrategia
  const completeStrategyPhase = async () => {
    const progress = calculatePhaseProgress();
    if (progress < 100) {
      toast({
        title: "Estrategia incompleta",
        description: "Por favor, complete todos los elementos de la estrategia.",
        variant: "destructive",
      });
      return;
    }

    const newState = {
      ...processState,
      currentPhase: "meeting" as ProcessPhase,
      completionPercentage: 60,
    };

    setProcessState(newState);
    await saveProcessToDB(newState);

    toast({
      title: "Estrategia completada",
      description: "Proceda a programar la cita con el cliente.",
    });
  };

  // Programar cita con cliente
  const scheduleMeeting = async () => {
    const progress = calculatePhaseProgress();
    if (progress < 100) {
      toast({
        title: "Información incompleta",
        description: "Por favor, complete los datos de la cita.",
        variant: "destructive",
      });
      return;
    }

    const newState = {
      ...processState,
      currentPhase: "followup" as ProcessPhase,
      completionPercentage: 85,
    };

    setProcessState(newState);
    await saveProcessToDB(newState);

    toast({
      title: "Cita programada",
      description: `Reunión agendada para ${processState.clientMeeting.date} a las ${processState.clientMeeting.time}`,
    });
  };

  const phaseProgress = calculatePhaseProgress();

  return (
    <div className="space-y-6" data-testid="process-page">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Proceso Legal</h1>
          <p className="text-muted-foreground">
            Acompañamiento completo desde la investigación inicial hasta el cierre del caso
          </p>
        </div>
        
        {/* Indicador de guardado */}
        {caseId && processState.clientInfo.clientId && (
          <div className="flex items-center gap-2 text-sm">
            {isSaving ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </div>
            ) : lastSaved ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>
                  Guardado {new Date().getTime() - lastSaved.getTime() < 10000 
                    ? "ahora" 
                    : `hace ${Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000)}s`
                  }
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Progreso General del Proceso
          </CardTitle>
          <CardDescription>
            Fase actual: {
              processState.currentPhase === "client-info" ? "Registro de Cliente" :
              processState.currentPhase === "investigation" ? "Avance de Investigación" :
              processState.currentPhase === "strategy" ? "Estrategia Legal" :
              processState.currentPhase === "meeting" ? "Programación de Cita" :
              processState.currentPhase === "followup" ? "Seguimiento" :
              "Completado"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={processState.completionPercentage} className="h-3" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {processState.completionPercentage}% completado
            </span>
            <span className="font-medium">
              Fase {
                processState.currentPhase === "investigation" ? "1" :
                processState.currentPhase === "strategy" ? "1" :
                processState.currentPhase === "meeting" ? "1" :
                "2"
              } de 2
            </span>
          </div>

          {/* Phase indicators */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-4">
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              processState.currentPhase === "client-info" 
                ? "bg-primary/10 border-primary" 
                : processState.completionPercentage > 0
                ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                : "border-border"
            }`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                processState.currentPhase === "client-info"
                  ? "bg-primary text-primary-foreground"
                  : processState.completionPercentage > 0
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {processState.completionPercentage > 0 && processState.currentPhase !== "client-info" 
                  ? <CheckCircle className="h-4 w-4" />
                  : <Users className="h-4 w-4" />
                }
              </div>
              <span className="text-sm font-medium">Cliente</span>
            </div>

            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              processState.currentPhase === "investigation" 
                ? "bg-primary/10 border-primary" 
                : processState.completionPercentage >= 10
                ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                : "border-border"
            }`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                processState.currentPhase === "investigation"
                  ? "bg-primary text-primary-foreground"
                  : processState.completionPercentage >= 10
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {processState.completionPercentage >= 10 && processState.currentPhase !== "investigation" 
                  ? <CheckCircle className="h-4 w-4" />
                  : "1"
                }
              </div>
              <span className="text-sm font-medium">Investigación</span>
            </div>

            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              processState.currentPhase === "strategy" 
                ? "bg-primary/10 border-primary" 
                : processState.completionPercentage >= 35
                ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                : "border-border"
            }`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                processState.currentPhase === "strategy"
                  ? "bg-primary text-primary-foreground"
                  : processState.completionPercentage >= 35
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {processState.completionPercentage >= 35 && processState.currentPhase !== "strategy"
                  ? <CheckCircle className="h-4 w-4" />
                  : "2"
                }
              </div>
              <span className="text-sm font-medium">Estrategia</span>
            </div>

            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              processState.currentPhase === "meeting" 
                ? "bg-primary/10 border-primary" 
                : processState.completionPercentage >= 60
                ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                : "border-border"
            }`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                processState.currentPhase === "meeting"
                  ? "bg-primary text-primary-foreground"
                  : processState.completionPercentage >= 60
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {processState.completionPercentage >= 60 && processState.currentPhase !== "meeting"
                  ? <CheckCircle className="h-4 w-4" />
                  : "3"
                }
              </div>
              <span className="text-sm font-medium">Cita Cliente</span>
            </div>

            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              processState.currentPhase === "followup" 
                ? "bg-primary/10 border-primary" 
                : processState.completionPercentage >= 85
                ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                : "border-border"
            }`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                processState.currentPhase === "followup"
                  ? "bg-primary text-primary-foreground"
                  : processState.completionPercentage >= 85
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {processState.completionPercentage >= 85 && processState.currentPhase !== "followup"
                  ? <CheckCircle className="h-4 w-4" />
                  : "4"
                }
              </div>
              <span className="text-sm font-medium">Seguimiento</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del Cliente Registrado - Mostrar en todas las fases excepto client-info */}
      {processState.currentPhase !== "client-info" && processState.clientInfo.name && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Cliente Registrado
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activo
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Información del cliente para este caso
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviousPhase(processState.currentPhase); // Guardar fase actual
                  setProcessState(prev => ({
                    ...prev,
                    currentPhase: "client-info" as ProcessPhase,
                  }));
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Editar datos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Nombre completo</p>
                <p className="text-sm font-semibold">{processState.clientInfo.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                <p className="text-sm font-semibold">{processState.clientInfo.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Correo electrónico</p>
                <p className="text-sm font-semibold">{processState.clientInfo.email}</p>
              </div>
              {processState.clientInfo.caseDescription && (
                <div className="space-y-1 md:col-span-3">
                  <p className="text-sm font-medium text-muted-foreground">Descripción del caso</p>
                  <p className="text-sm">{processState.clientInfo.caseDescription}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Carpeta de Documentos del Caso */}
      {processState.uploadedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Carpeta de Documentos del Caso
              <Badge variant="secondary">{processState.uploadedDocuments.length}</Badge>
            </CardTitle>
            <CardDescription>
              Todos los documentos cargados para este caso. Puede agregar notas y anotaciones a cada documento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  Todos ({processState.uploadedDocuments.length})
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  Notificaciones ({processState.uploadedDocuments.filter(d => d.category === "notifications").length})
                </TabsTrigger>
                <TabsTrigger value="police-report">
                  Denuncia ({processState.uploadedDocuments.filter(d => d.category === "police-report").length})
                </TabsTrigger>
                <TabsTrigger value="additional">
                  Adicionales ({processState.uploadedDocuments.filter(d => d.category === "additional").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3 mt-4">
                {processState.uploadedDocuments.map((doc) => (
                  <Card key={doc.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <FileText className="h-5 w-5 text-primary mt-1" />
                            <div className="flex-1 space-y-1">
                              <p className="font-medium">{doc.filename}</p>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {doc.category === "notifications" ? "Notificaciones" :
                                   doc.category === "police-report" ? "Denuncia Policial" :
                                   "Documentos Adicionales"}
                                </Badge>
                                {doc.uploadDate && (
                                  <span>
                                    {new Date(doc.uploadDate).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                              </div>
                              {/* Botón Transcribir */}
                              {!doc.content && !doc.isProcessing && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => transcribeDocument(doc.id)}
                                  className="mt-2"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Transcribir documento
                                </Button>
                              )}
                              {doc.isProcessing && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Transcribiendo...
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(doc.id)}
                            disabled={doc.isProcessing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {doc.content && (
                          <div className="p-3 bg-muted/50 rounded text-sm max-h-32 overflow-y-auto">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Contenido extraído:</p>
                            <p className="whitespace-pre-wrap text-xs">{doc.content.substring(0, 300)}{doc.content.length > 300 ? '...' : ''}</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor={`notes-${doc.id}`} className="text-xs">
                            Notas y anotaciones
                          </Label>
                          <div className="flex gap-2">
                            <Textarea
                              id={`notes-${doc.id}`}
                              placeholder="Agregue notas, observaciones o comentarios sobre este documento..."
                              value={doc.notes || ""}
                              onChange={(e) => updateDocumentNotes(doc.id, e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                            <VoiceInput
                              onTranscript={(text) => updateDocumentNotes(doc.id, doc.notes ? `${doc.notes}\n\n${text}` : text)}
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="notifications" className="space-y-3 mt-4">
                {processState.uploadedDocuments.filter(d => d.category === "notifications").map((doc) => (
                  <Card key={doc.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <FileText className="h-5 w-5 text-blue-500 mt-1" />
                            <div className="flex-1 space-y-1">
                              <p className="font-medium">{doc.filename}</p>
                              <div className="text-xs text-muted-foreground">
                                {doc.uploadDate && (
                                  <span>
                                    {new Date(doc.uploadDate).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                              </div>
                              {/* Botón Transcribir */}
                              {!doc.content && !doc.isProcessing && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => transcribeDocument(doc.id)}
                                  className="mt-2"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Transcribir documento
                                </Button>
                              )}
                              {doc.isProcessing && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Transcribiendo...
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(doc.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {doc.content && (
                          <div className="p-3 bg-muted/50 rounded text-sm max-h-32 overflow-y-auto">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Contenido extraído:</p>
                            <p className="whitespace-pre-wrap text-xs">{doc.content.substring(0, 300)}{doc.content.length > 300 ? '...' : ''}</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor={`notes-${doc.id}`} className="text-xs">
                            Notas y anotaciones
                          </Label>
                          <div className="flex gap-2">
                            <Textarea
                              id={`notes-${doc.id}`}
                              placeholder="Agregue notas sobre esta notificación..."
                              value={doc.notes || ""}
                              onChange={(e) => updateDocumentNotes(doc.id, e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                            <VoiceInput
                              onTranscript={(text) => updateDocumentNotes(doc.id, doc.notes ? `${doc.notes}\n\n${text}` : text)}
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {processState.uploadedDocuments.filter(d => d.category === "notifications").length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No hay notificaciones cargadas</p>
                )}
              </TabsContent>

              <TabsContent value="police-report" className="space-y-3 mt-4">
                {processState.uploadedDocuments.filter(d => d.category === "police-report").map((doc) => (
                  <Card key={doc.id} className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <FileText className="h-5 w-5 text-red-500 mt-1" />
                            <div className="flex-1 space-y-1">
                              <p className="font-medium">{doc.filename}</p>
                              <div className="text-xs text-muted-foreground">
                                {doc.uploadDate && (
                                  <span>
                                    {new Date(doc.uploadDate).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                              </div>
                              {/* Botón Transcribir */}
                              {!doc.content && !doc.isProcessing && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => transcribeDocument(doc.id)}
                                  className="mt-2"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Transcribir documento
                                </Button>
                              )}
                              {doc.isProcessing && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Transcribiendo...
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(doc.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {doc.content && (
                          <div className="p-3 bg-muted/50 rounded text-sm max-h-32 overflow-y-auto">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Contenido extraído:</p>
                            <p className="whitespace-pre-wrap text-xs">{doc.content.substring(0, 300)}{doc.content.length > 300 ? '...' : ''}</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor={`notes-${doc.id}`} className="text-xs">
                            Notas y anotaciones
                          </Label>
                          <div className="flex gap-2">
                            <Textarea
                              id={`notes-${doc.id}`}
                              placeholder="Agregue notas sobre la denuncia policial..."
                              value={doc.notes || ""}
                              onChange={(e) => updateDocumentNotes(doc.id, e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                            <VoiceInput
                              onTranscript={(text) => updateDocumentNotes(doc.id, doc.notes ? `${doc.notes}\n\n${text}` : text)}
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {processState.uploadedDocuments.filter(d => d.category === "police-report").length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No hay denuncias policiales cargadas</p>
                )}
              </TabsContent>

              <TabsContent value="additional" className="space-y-3 mt-4">
                {processState.uploadedDocuments.filter(d => d.category === "additional").map((doc) => (
                  <Card key={doc.id} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <FileText className="h-5 w-5 text-green-500 mt-1" />
                            <div className="flex-1 space-y-1">
                              <p className="font-medium">{doc.filename}</p>
                              <div className="text-xs text-muted-foreground">
                                {doc.uploadDate && (
                                  <span>
                                    {new Date(doc.uploadDate).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                              </div>
                              {/* Botón Transcribir */}
                              {!doc.content && !doc.isProcessing && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => transcribeDocument(doc.id)}
                                  className="mt-2"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Transcribir documento
                                </Button>
                              )}
                              {doc.isProcessing && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Transcribiendo...
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(doc.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {doc.content && (
                          <div className="p-3 bg-muted/50 rounded text-sm max-h-32 overflow-y-auto">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Contenido extraído:</p>
                            <p className="whitespace-pre-wrap text-xs">{doc.content.substring(0, 300)}{doc.content.length > 300 ? '...' : ''}</p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor={`notes-${doc.id}`} className="text-xs">
                            Notas y anotaciones
                          </Label>
                          <div className="flex gap-2">
                            <Textarea
                              id={`notes-${doc.id}`}
                              placeholder="Agregue notas sobre este documento..."
                              value={doc.notes || ""}
                              onChange={(e) => updateDocumentNotes(doc.id, e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                            <VoiceInput
                              onTranscript={(text) => updateDocumentNotes(doc.id, doc.notes ? `${doc.notes}\n\n${text}` : text)}
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {processState.uploadedDocuments.filter(d => d.category === "additional").length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No hay documentos adicionales cargados</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* FASE 0: Registro de Cliente */}
      {processState.currentPhase === "client-info" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Registro de Cliente
            </CardTitle>
            <CardDescription>
              Ingrese los datos del cliente para iniciar el caso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ℹ️ Los campos marcados con * son obligatorios. Esta información se usará para crear el expediente y programar la cita con el cliente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-name-initial">
                  Nombre completo del cliente *
                </Label>
                <Input
                  id="client-name-initial"
                  placeholder="Ej: Juan Pérez García"
                  value={processState.clientInfo.name}
                  onChange={(e) => setProcessState(prev => ({
                    ...prev,
                    clientInfo: {
                      ...prev.clientInfo,
                      name: e.target.value,
                    },
                  }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-phone-initial">
                  Teléfono / WhatsApp *
                </Label>
                <Input
                  id="client-phone-initial"
                  type="tel"
                  placeholder="+51 999 999 999"
                  value={processState.clientInfo.phone}
                  onChange={(e) => setProcessState(prev => ({
                    ...prev,
                    clientInfo: {
                      ...prev.clientInfo,
                      phone: e.target.value,
                    },
                  }))}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="client-email-initial">
                  Correo electrónico *
                </Label>
                <Input
                  id="client-email-initial"
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={processState.clientInfo.email}
                  onChange={(e) => setProcessState(prev => ({
                    ...prev,
                    clientInfo: {
                      ...prev.clientInfo,
                      email: e.target.value,
                    },
                  }))}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="case-description-initial">
                  Breve descripción del caso (opcional)
                </Label>
                <div className="flex gap-2">
                  <Textarea
                    id="case-description-initial"
                    placeholder="Describa brevemente el motivo de la consulta o el caso..."
                    value={processState.clientInfo.caseDescription}
                    onChange={(e) => setProcessState(prev => ({
                      ...prev,
                      clientInfo: {
                        ...prev.clientInfo,
                        caseDescription: e.target.value,
                      },
                    }))}
                    className="min-h-[120px]"
                  />
                  <VoiceInput
                    onTranscript={(text) => setProcessState(prev => ({
                      ...prev,
                      clientInfo: {
                        ...prev.clientInfo,
                        caseDescription: prev.clientInfo.caseDescription 
                          ? `${prev.clientInfo.caseDescription}\n\n${text}`
                          : text,
                      },
                    }))}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta información ayudará al abogado a prepararse para la consulta. Puede usar el micrófono para dictar.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Progreso del registro</p>
                <div className="flex items-center gap-2">
                  <Progress value={phaseProgress} className="w-32" />
                  <span className="text-sm text-muted-foreground">{phaseProgress}%</span>
                </div>
              </div>
              <div className="flex gap-2">
                {processState.clientInfo.clientId && previousPhase && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setProcessState(prev => ({
                        ...prev,
                        currentPhase: previousPhase,
                      }));
                      setPreviousPhase(null);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
                <Button 
                  onClick={registerClientAndContinue}
                  disabled={phaseProgress < 100 || createClientMutation.isPending}
                >
                  {createClientMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {processState.clientInfo.clientId ? "Actualizando..." : "Registrando..."}
                    </>
                  ) : (
                    <>
                      {processState.clientInfo.clientId ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Actualizar datos
                        </>
                      ) : (
                        <>
                          Registrar y continuar
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 1: Investigación */}
      {processState.currentPhase === "investigation" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Fase 1: Avance de la Investigación
            </CardTitle>
            <CardDescription>
              Complete los campos o cargue documentos para extraer el texto automáticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Botón principal: Cargar Documento */}
            <div className="flex justify-center p-6 bg-muted/30 border-2 border-dashed rounded-lg">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,image/*"
                onChange={handleDocumentUpload}
                className="hidden"
                id="main-file-upload"
              />
              <Button
                size="lg"
                onClick={() => document.getElementById("main-file-upload")?.click()}
                disabled={isProcessingFile}
                className="gap-2"
              >
                {isProcessingFile ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Procesando documento...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Cargar Documento
                  </>
                )}
              </Button>
            </div>

            <Separator />

            {/* Campos colapsables */}
            <div className="space-y-3">
              {/* Notificaciones recibidas */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedField(expandedField === "notifications" ? null : "notifications")}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Notificaciones recibidas</span>
                    {processState.investigationProgress.notifications && (
                      <Badge variant="secondary" className="ml-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completado
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${expandedField === "notifications" ? "rotate-90" : ""}`} />
                </button>
                {expandedField === "notifications" && (
                  <div className="p-4 pt-0 space-y-2">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Describa las notificaciones oficiales recibidas, fechas y entidades emisoras..."
                        value={processState.investigationProgress.notifications}
                        onChange={(e) => setProcessState(prev => ({
                          ...prev,
                          investigationProgress: {
                            ...prev.investigationProgress,
                            notifications: e.target.value,
                          },
                        }))}
                        className="min-h-[120px]"
                      />
                      <VoiceInput
                        onTranscript={(text) => setProcessState(prev => ({
                          ...prev,
                          investigationProgress: {
                            ...prev.investigationProgress,
                            notifications: prev.investigationProgress.notifications
                              ? `${prev.investigationProgress.notifications}\n\n${text}`
                              : text,
                          },
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Denuncia policial */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedField(expandedField === "police-report" ? null : "police-report")}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Denuncia policial</span>
                    {processState.investigationProgress.policeReport && (
                      <Badge variant="secondary" className="ml-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completado
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${expandedField === "police-report" ? "rotate-90" : ""}`} />
                </button>
                {expandedField === "police-report" && (
                  <div className="p-4 pt-0 space-y-2">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Ingrese el contenido de la denuncia policial, número de caso, fecha, comisaría..."
                        value={processState.investigationProgress.policeReport}
                        onChange={(e) => setProcessState(prev => ({
                          ...prev,
                          investigationProgress: {
                            ...prev.investigationProgress,
                            policeReport: e.target.value,
                          },
                        }))}
                        className="min-h-[150px]"
                      />
                      <VoiceInput
                        onTranscript={(text) => setProcessState(prev => ({
                          ...prev,
                          investigationProgress: {
                            ...prev.investigationProgress,
                            policeReport: prev.investigationProgress.policeReport
                              ? `${prev.investigationProgress.policeReport}\n\n${text}`
                              : text,
                          },
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Documentos adicionales */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedField(expandedField === "additional" ? null : "additional")}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Documentos adicionales</span>
                    {processState.investigationProgress.additionalDocuments && (
                      <Badge variant="secondary" className="ml-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completado
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${expandedField === "additional" ? "rotate-90" : ""}`} />
                </button>
                {expandedField === "additional" && (
                  <div className="p-4 pt-0 space-y-2">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Liste otros documentos relevantes: contratos, facturas, correos, fotografías, etc..."
                        value={processState.investigationProgress.additionalDocuments}
                        onChange={(e) => setProcessState(prev => ({
                          ...prev,
                          investigationProgress: {
                            ...prev.investigationProgress,
                            additionalDocuments: e.target.value,
                          },
                        }))}
                        className="min-h-[120px]"
                      />
                      <VoiceInput
                        onTranscript={(text) => setProcessState(prev => ({
                          ...prev,
                          investigationProgress: {
                            ...prev.investigationProgress,
                            additionalDocuments: prev.investigationProgress.additionalDocuments
                              ? `${prev.investigationProgress.additionalDocuments}\n\n${text}`
                              : text,
                          },
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Progreso de esta fase</p>
                <div className="flex items-center gap-2">
                  <Progress value={phaseProgress} className="w-32" />
                  <span className="text-sm text-muted-foreground">{phaseProgress}%</span>
                </div>
              </div>
              <Button 
                onClick={completeInvestigationPhase}
                disabled={phaseProgress < 100}
              >
                Completar y continuar
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de preview de documento */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documento: {uploadedFilePreview?.filename}
            </DialogTitle>
            <DialogDescription>
              Revise el texto extraído y seleccione a qué carpeta desea anexarlo
            </DialogDescription>
          </DialogHeader>

          {/* Preview del texto */}
          <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-muted/30 my-4">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {uploadedFilePreview?.text || "Procesando..."}
            </pre>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-4">
            <div className="w-full">
              <Label className="mb-2 block">Anexar a:</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={selectedCategory === "notifications" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("notifications")}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                  Notificaciones
                </Button>
                <Button
                  variant={selectedCategory === "police-report" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("police-report")}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2 text-red-600" />
                  Denuncia
                </Button>
                <Button
                  variant={selectedCategory === "additional" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("additional")}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2 text-green-600" />
                  Adicionales
                </Button>
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadedFilePreview(null);
                  setSelectedCategory(null);
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => selectedCategory && annexTextToCategory(selectedCategory)}
                disabled={!selectedCategory}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Anexar documento
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FASE 1: Estrategia */}
      {processState.currentPhase === "strategy" && (
        <Tabs defaultValue="facts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="facts">Hechos</TabsTrigger>
            <TabsTrigger value="theory">Teoría</TabsTrigger>
            <TabsTrigger value="objectives">Objetivos</TabsTrigger>
            <TabsTrigger value="legal-strategy">Estrategia Legal</TabsTrigger>
          </TabsList>

          {/* Tab: Análisis de Hechos */}
          <TabsContent value="facts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Entender los Hechos (Primer Análisis)
                </CardTitle>
                <CardDescription>
                  Análisis automatizado de los hechos basado en la información recopilada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!processState.caseStrategy.aiAnalysisResult ? (
                  <div className="text-center py-8">
                    <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Inicie el análisis automatizado de los hechos del caso
                    </p>
                    <Button 
                      onClick={analyzeFactsWithAI}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Analizar hechos
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900 dark:text-green-100">
                          Análisis completado
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facts-analysis">Análisis de hechos (puede editar)</Label>
                      <div className="flex gap-2">
                        <Textarea
                          id="facts-analysis"
                          value={processState.caseStrategy.factsAnalysis}
                          onChange={(e) => setProcessState(prev => ({
                            ...prev,
                            caseStrategy: {
                              ...prev.caseStrategy,
                              factsAnalysis: e.target.value,
                            },
                          }))}
                          className="min-h-[400px] font-mono text-sm"
                        />
                        <VoiceInput
                          onTranscript={(text) => setProcessState(prev => ({
                            ...prev,
                            caseStrategy: {
                              ...prev.caseStrategy,
                              factsAnalysis: prev.caseStrategy.factsAnalysis
                                ? `${prev.caseStrategy.factsAnalysis}\n\n${text}`
                                : text,
                            },
                          }))}
                        />
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={analyzeFactsWithAI}
                      disabled={isAnalyzing}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Regenerar análisis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Teoría del Caso */}
          <TabsContent value="theory">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Teoría del Caso (Segundo Borrador)
                </CardTitle>
                <CardDescription>
                  Generación automatizada de la teoría del caso basada en los hechos analizados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!processState.caseStrategy.theoryDraft ? (
                  <div className="text-center py-8">
                    <Scale className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Genere un borrador de la teoría del caso
                    </p>
                    <Button 
                      onClick={generateCaseTheoryWithAI}
                      disabled={isAnalyzing || !processState.caseStrategy.factsAnalysis}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Generar teoría del caso
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                          Borrador generado
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Revise y ajuste el borrador según sea necesario
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="case-theory">Teoría del caso (puede editar)</Label>
                      <div className="flex gap-2">
                        <Textarea
                          id="case-theory"
                          value={processState.caseStrategy.caseTheory}
                          onChange={(e) => setProcessState(prev => ({
                            ...prev,
                            caseStrategy: {
                              ...prev.caseStrategy,
                              caseTheory: e.target.value,
                            },
                          }))}
                          className="min-h-[400px] font-mono text-sm"
                        />
                        <VoiceInput
                          onTranscript={(text) => setProcessState(prev => ({
                            ...prev,
                            caseStrategy: {
                              ...prev.caseStrategy,
                              caseTheory: prev.caseStrategy.caseTheory
                                ? `${prev.caseStrategy.caseTheory}\n\n${text}`
                                : text,
                            },
                          }))}
                        />
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={generateCaseTheoryWithAI}
                      disabled={isAnalyzing}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Regenerar teoría
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Objetivos */}
          <TabsContent value="objectives">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Objetivos del Caso
                </CardTitle>
                <CardDescription>
                  Defina o genere objetivos específicos basados en los análisis anteriores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar nuevo objetivo..."
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addObjective();
                      }
                    }}
                  />
                  <Button onClick={addObjective}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {processState.caseStrategy.objectives.length > 0 ? (
                  <div className="space-y-2">
                    {processState.caseStrategy.objectives.map((objective, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="flex-1 text-sm">{objective}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeObjective(index)}
                        >
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No hay objetivos definidos. Agregue al menos uno para continuar.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Estrategia Legal */}
          <TabsContent value="legal-strategy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Estrategia Legal
                </CardTitle>
                <CardDescription>
                  Defina la estrategia legal completa del caso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="legal-strategy">Estrategia legal detallada</Label>
                  <div className="flex gap-2">
                    <Textarea
                      id="legal-strategy"
                      placeholder="Describa la estrategia legal: acciones a seguir, plazos, recursos, precedentes a invocar, etc..."
                      value={processState.caseStrategy.legalStrategy}
                      onChange={(e) => setProcessState(prev => ({
                        ...prev,
                        caseStrategy: {
                          ...prev.caseStrategy,
                          legalStrategy: e.target.value,
                        },
                      }))}
                      className="min-h-[300px]"
                    />
                    <VoiceInput
                      onTranscript={(text) => setProcessState(prev => ({
                        ...prev,
                        caseStrategy: {
                          ...prev.caseStrategy,
                          legalStrategy: prev.caseStrategy.legalStrategy
                            ? `${prev.caseStrategy.legalStrategy}\n\n${text}`
                            : text,
                        },
                      }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Progreso de estrategia</p>
                    <div className="flex items-center gap-2">
                      <Progress value={phaseProgress} className="w-32" />
                      <span className="text-sm text-muted-foreground">{phaseProgress}%</span>
                    </div>
                  </div>
                  <Button 
                    onClick={completeStrategyPhase}
                    disabled={phaseProgress < 100}
                  >
                    Completar estrategia
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* FASE 1: Programar Cita */}
      {processState.currentPhase === "meeting" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Programar Cita con Cliente
            </CardTitle>
            <CardDescription>
              Agende la reunión para presentar la estrategia al cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-date">Fecha de la cita</Label>
                <Input
                  id="meeting-date"
                  type="date"
                  value={processState.clientMeeting.date}
                  onChange={(e) => setProcessState(prev => ({
                    ...prev,
                    clientMeeting: {
                      ...prev.clientMeeting,
                      date: e.target.value,
                    },
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-time">Hora de la cita</Label>
                <Input
                  id="meeting-time"
                  type="time"
                  value={processState.clientMeeting.time}
                  onChange={(e) => setProcessState(prev => ({
                    ...prev,
                    clientMeeting: {
                      ...prev.clientMeeting,
                      time: e.target.value,
                    },
                  }))}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Datos del Cliente
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Nombre completo</Label>
                  <Input
                    id="client-name"
                    placeholder="Nombre del cliente"
                    value={processState.clientMeeting.clientName}
                    onChange={(e) => setProcessState(prev => ({
                      ...prev,
                      clientMeeting: {
                        ...prev.clientMeeting,
                        clientName: e.target.value,
                      },
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-email">Correo electrónico</Label>
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={processState.clientMeeting.clientEmail}
                    onChange={(e) => setProcessState(prev => ({
                      ...prev,
                      clientMeeting: {
                        ...prev.clientMeeting,
                        clientEmail: e.target.value,
                      },
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-phone">Teléfono</Label>
                  <Input
                    id="client-phone"
                    type="tel"
                    placeholder="+51 999 999 999"
                    value={processState.clientMeeting.clientPhone}
                    onChange={(e) => setProcessState(prev => ({
                      ...prev,
                      clientMeeting: {
                        ...prev.clientMeeting,
                        clientPhone: e.target.value,
                      },
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-notes">Notas para la reunión</Label>
                <div className="flex gap-2">
                  <Textarea
                    id="meeting-notes"
                    placeholder="Puntos a discutir, documentos a presentar, etc..."
                    value={processState.clientMeeting.notes}
                    onChange={(e) => setProcessState(prev => ({
                      ...prev,
                      clientMeeting: {
                        ...prev.clientMeeting,
                        notes: e.target.value,
                      },
                    }))}
                    className="min-h-[100px]"
                  />
                  <VoiceInput
                    onTranscript={(text) => setProcessState(prev => ({
                      ...prev,
                      clientMeeting: {
                        ...prev.clientMeeting,
                        notes: prev.clientMeeting.notes
                          ? `${prev.clientMeeting.notes}\n\n${text}`
                          : text,
                      },
                    }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Progreso de programación</p>
                <div className="flex items-center gap-2">
                  <Progress value={phaseProgress} className="w-32" />
                  <span className="text-sm text-muted-foreground">{phaseProgress}%</span>
                </div>
              </div>
              <Button 
                onClick={scheduleMeeting}
                disabled={phaseProgress < 100}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Confirmar cita
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 2: Seguimiento (placeholder) */}
      {processState.currentPhase === "followup" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Fase 2: Seguimiento del Caso
            </CardTitle>
            <CardDescription>
              Esta funcionalidad se implementará próximamente
            </CardDescription>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Fase 1 Completada</h3>
            <p className="text-muted-foreground mb-4">
              La reunión con el cliente ha sido programada. La fase de seguimiento se implementará en la próxima actualización.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => navigate("/")}>
                Volver al panel principal
              </Button>
              <Button onClick={() => navigate("/cases")}>
                Ver expedientes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
