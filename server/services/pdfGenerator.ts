import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CaseWithDetails {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  client?: {
    name?: string;
    contactInfo?: string | null;
    createdAt?: Date | string;
  } | null;
  processState?: {
    currentPhase?: string;
    completionPercentage?: string;
  };
  documents?: Array<{ filename: string; uploadDate: string; category: string }>;
}

const PHASES = {
  'client-info': 'Registro del Cliente',
  'investigation': 'Investigación',
  'strategy': 'Estrategia Legal',
  'meeting': 'Reunión con Cliente',
  'followup': 'Seguimiento',
};

export function generateCasePDF(caseData: CaseWithDetails): jsPDF {
  const doc = new jsPDF();
  let yPosition = 20;

  // ============ HEADER ============
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235); // Blue
  doc.text('Dr. Juro', 20, yPosition);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Sistema de Gestión Legal', 20, yPosition + 6);
  
  // Fecha de generación
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  const generatedDate = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
  doc.text(`Generado: ${generatedDate}`, 20, yPosition + 12);
  
  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition + 15, 190, yPosition + 15);
  
  yPosition = 45;

  // ============ TÍTULO DEL CASO ============
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('EXPEDIENTE LEGAL', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(caseData.title || 'Sin título', 20, yPosition);
  
  yPosition += 12;

  // ============ INFORMACIÓN DEL CASO ============
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.text('Información del Caso', 20, yPosition);
  
  yPosition += 8;
  
  const caseInfo = [
    ['ID del Caso', caseData.id || 'N/A'],
    ['Estado', caseData.status || 'Activo'],
    ['Fecha de Creación', caseData.createdAt ? format(new Date(caseData.createdAt), 'dd/MM/yyyy') : 'N/A'],
    ['Última Actualización', caseData.updatedAt ? format(new Date(caseData.updatedAt), 'dd/MM/yyyy HH:mm') : 'N/A'],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: caseInfo,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 120 },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 12;

  // ============ INFORMACIÓN DEL CLIENTE ============
  if (caseData.client) {
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text('Datos del Cliente', 20, yPosition);
    
    yPosition += 8;
    
    const clientInfo = [
      ['Nombre', caseData.client.name || 'N/A'],
      ['Contacto', caseData.client.contactInfo || 'N/A'],
      ['Registrado', caseData.client.createdAt ? format(new Date(caseData.client.createdAt), 'dd/MM/yyyy') : 'N/A'],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: clientInfo,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 120 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 12;
  }

  // ============ DESCRIPCIÓN DEL CASO ============
  if (caseData.description) {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text('Descripción', 20, yPosition);
    
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const splitDescription = doc.splitTextToSize(caseData.description, 170);
    doc.text(splitDescription, 20, yPosition);
    
    yPosition += splitDescription.length * 5 + 10;
  }

  // ============ PROGRESO DEL PROCESO ============
  if (caseData.processState) {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text('Progreso del Proceso Legal', 20, yPosition);
    
    yPosition += 8;

    const currentPhase = caseData.processState.currentPhase || 'N/A';
    const completion = caseData.processState.completionPercentage || '0';
    
    const progressData = [
      ['Fase Actual', PHASES[currentPhase as keyof typeof PHASES] || currentPhase],
      ['Porcentaje de Completitud', `${completion}%`],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: progressData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 110 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 12;
  }

  // ============ DOCUMENTOS ADJUNTOS ============
  if (caseData.documents && caseData.documents.length > 0) {
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text('Documentos Adjuntos', 20, yPosition);
    
    yPosition += 8;

    const documentsData = caseData.documents.map((doc) => [
      doc.filename,
      doc.category || 'General',
      doc.uploadDate ? format(new Date(doc.uploadDate), 'dd/MM/yyyy') : 'N/A',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Nombre del Archivo', 'Categoría', 'Fecha de Carga']],
      body: documentsData,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 12;
  }

  // ============ FOOTER ============
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Dr. Juro - Sistema de Gestión Legal | Página ${i} de ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  return doc;
}
