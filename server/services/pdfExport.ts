import { db } from "../db";
import { cases, notes, caseActivity, caseDocuments, clients } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportPdfOptions {
  caseId: string;
  includeNotes?: boolean;
  includeTimeline?: boolean;
  includeDocuments?: boolean;
}

export async function generateCaseFullPdf(options: ExportPdfOptions): Promise<Buffer> {
  const {
    caseId,
    includeNotes = true,
    includeTimeline = true,
    includeDocuments = true,
  } = options;

  // Fetch case data
  const caseData = await db!.query.cases.findFirst({
    where: eq(cases.id, caseId),
    with: {
      client: true,
    },
  });

  if (!caseData) {
    throw new Error("Case not found");
  }

  // Create PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = margin;

  // Helper function to add page break if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, fontSize: number, fontStyle: string = "normal") => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    const lineHeight = fontSize * 0.5;
    
    lines.forEach((line: string) => {
      checkPageBreak(lineHeight);
      doc.text(line, margin, currentY);
      currentY += lineHeight;
    });
  };

  // ===== COVER PAGE =====
  doc.setFillColor(41, 128, 185); // Blue header
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("Caso Legal", pageWidth / 2, 30, { align: "center" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  doc.text(caseData.title, pageWidth / 2, 45, { align: "center" });

  // Case info box
  currentY = 80;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Información del Caso", margin, currentY);
  currentY += 10;

  doc.setFont("helvetica", "normal");
  const caseInfo = [
    ["Caso ID:", caseData.id],
    ["Cliente:", (caseData.client as any)?.name || "N/A"],
    ["Categoría:", caseData.category || "Sin categoría"],
    ["Prioridad:", caseData.priority || "Media"],
    ["Estado:", caseData.status || "Activo"],
    ["Fecha de Creación:", new Date(caseData.createdAt).toLocaleDateString("es-ES")],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [],
    body: caseInfo,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: "auto" },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Tags section
  if (caseData.tags && Array.isArray(caseData.tags) && caseData.tags.length > 0) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.text("Tags:", margin, currentY);
    currentY += 7;
    doc.setFont("helvetica", "normal");
    doc.text(caseData.tags.join(", "), margin + 5, currentY);
    currentY += 10;
  }

  // Description
  if (caseData.description) {
    checkPageBreak(30);
    doc.setFont("helvetica", "bold");
    doc.text("Descripción:", margin, currentY);
    currentY += 7;
    addWrappedText(caseData.description, 10, "normal");
    currentY += 5;
  }

  // ===== NOTES SECTION =====
  if (includeNotes) {
    const notesData = await db!.query.notes.findMany({
      where: eq(notes.caseId, caseId),
      orderBy: [desc(notes.isPinned), desc(notes.createdAt)],
    });

    if (notesData.length > 0) {
      doc.addPage();
      currentY = margin;

      doc.setFillColor(52, 152, 219);
      doc.rect(margin, currentY, pageWidth - 2 * margin, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Notas del Caso", margin + 5, currentY + 7);
      currentY += 15;
      doc.setTextColor(0, 0, 0);

      notesData.forEach((note, index) => {
        checkPageBreak(40);

        // Note header
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 8, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const noteTitle = note.isPinned === "true" ? `📌 ${note.title}` : note.title;
        doc.text(noteTitle, margin + 2, currentY + 6);
        currentY += 10;

        // Note metadata
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        const noteDate = new Date(note.createdAt).toLocaleString("es-ES");
        doc.text(`Creado: ${noteDate}`, margin + 2, currentY);
        currentY += 5;

        if (note.tags && Array.isArray(note.tags) && note.tags.length > 0) {
          doc.text(`Tags: ${note.tags.join(", ")}`, margin + 2, currentY);
          currentY += 5;
        }

        // Note content
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        currentY += 2;
        addWrappedText(note.content, 10, "normal");
        currentY += 10;

        if (index < notesData.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, currentY, pageWidth - margin, currentY);
          currentY += 5;
        }
      });
    }
  }

  // ===== TIMELINE SECTION =====
  if (includeTimeline) {
    const activitiesData = await db!.query.caseActivity.findMany({
      where: eq(caseActivity.caseId, caseId),
      orderBy: [desc(caseActivity.createdAt)],
      limit: 50,
    });

    if (activitiesData.length > 0) {
      doc.addPage();
      currentY = margin;

      doc.setFillColor(46, 204, 113);
      doc.rect(margin, currentY, pageWidth - 2 * margin, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Timeline de Actividad", margin + 5, currentY + 7);
      currentY += 15;
      doc.setTextColor(0, 0, 0);

      const timelineData = activitiesData.map((activity) => [
        new Date(activity.createdAt).toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        activity.activityType.replace(/_/g, " "),
        activity.description,
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [["Fecha", "Tipo", "Descripción"]],
        body: timelineData,
        theme: "striped",
        headStyles: {
          fillColor: [46, 204, 113],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 40 },
          2: { cellWidth: "auto" },
        },
        margin: { left: margin, right: margin },
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // ===== DOCUMENTS SECTION =====
  if (includeDocuments) {
    const documentsData = await db!.query.caseDocuments.findMany({
      where: eq(caseDocuments.caseId, caseId),
    });

    if (documentsData.length > 0) {
      checkPageBreak(50);
      if (currentY > pageHeight - 100) {
        doc.addPage();
        currentY = margin;
      }

      doc.setFillColor(155, 89, 182);
      doc.rect(margin, currentY, pageWidth - 2 * margin, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Documentos del Caso", margin + 5, currentY + 7);
      currentY += 15;
      doc.setTextColor(0, 0, 0);

      const docsData = documentsData.map((document, index) => [
        (index + 1).toString(),
        document.filename,
        document.fileType || "N/A",
        new Date(document.createdAt).toLocaleDateString("es-ES"),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [["#", "Nombre del Archivo", "Tipo", "Fecha de Subida"]],
        body: docsData,
        theme: "striped",
        headStyles: {
          fillColor: [155, 89, 182],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: "auto" },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 },
        },
        margin: { left: margin, right: margin },
      });
    }
  }

  // ===== FOOTER ON ALL PAGES =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages} - Generado el ${new Date().toLocaleDateString("es-ES")}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
