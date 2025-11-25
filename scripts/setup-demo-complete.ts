import 'dotenv/config';
import { db } from "../server/db";
import { users, clients, legalProcessV2 } from "../shared/schema";
import { hashPassword } from "../server/auth/service";
import { eq } from "drizzle-orm";

// Datos sintéticos completos para 3 casos demo
const demoClients = [
  {
    // Cliente 1: Caso Penal Completo (100%)
    name: "María Elena Rodríguez Vega",
    email: "maria.rodriguez@email.com",
    whatsappPrimary: "+51987654321",
    contactInfo: "Av. Larco 456, Miraflores, Lima",
    imputadoName: "Carlos Alberto Rodríguez Vega",
    imputadoDni: "45678912",
    imputadoRelation: "Hijo",
    imputadoContact: "+51912345678",
    processData: {
      activeTab: "dashboard",
      caseStatus: {
        caseNumber: "00234-2024-0-1801-JR-PE-01",
        caseType: "Penal",
        currentStage: "Sentencia",
        resolutionStatus: "favorable",
        nextDeadline: {
          date: "2025-12-15",
          description: "Lectura de sentencia firme"
        }
      },
      participants: [
        {
          name: "Carlos Alberto Rodríguez Vega",
          role: "imputado",
          contact: "+51912345678",
          email: "carlos.rodriguez@email.com",
          dni: "45678912",
          relation: "Hijo de la cliente",
          notes: "Imputado principal. Cooperativo durante todo el proceso."
        },
        {
          name: "Dr. Juan Pérez Mendoza",
          role: "abogado_contraparte",
          contact: "+51998877665",
          email: "jperez@fiscalia.gob.pe",
          dni: "12345678",
          relation: "Fiscal Provincial",
          notes: "Fiscal asignado al caso. Ha mostrado disposición al diálogo."
        },
        {
          name: "Rosa María Quispe Huamán",
          role: "testigo",
          contact: "+51977665544",
          email: "rosa.quispe@gmail.com",
          dni: "87654321",
          relation: "Vecina del imputado",
          notes: "Testigo presencial. Declaró a favor del imputado."
        },
        {
          name: "Pedro Luis Fernández",
          role: "perito",
          contact: "+51966554433",
          email: "pfernandez@peritos.pe",
          dni: "11223344",
          relation: "Perito Contable",
          notes: "Elaboró informe pericial que descartó apropiación ilícita."
        }
      ],
      documentFolders: [
        {
          stage: "Investigación Preparatoria",
          name: "Documentos de Investigación",
          documents: [
            { name: "Disposición de Formalización", date: "2024-03-15", type: "pdf" },
            { name: "Declaración del Imputado", date: "2024-03-20", type: "pdf" },
            { name: "Informe Pericial Contable", date: "2024-04-10", type: "pdf" },
            { name: "Acta de Inspección", date: "2024-04-15", type: "pdf" }
          ]
        },
        {
          stage: "Etapa Intermedia",
          name: "Documentos de Etapa Intermedia",
          documents: [
            { name: "Acusación Fiscal", date: "2024-06-01", type: "pdf" },
            { name: "Escrito de Absolución", date: "2024-06-15", type: "docx" },
            { name: "Auto de Enjuiciamiento", date: "2024-07-01", type: "pdf" }
          ]
        },
        {
          stage: "Juicio Oral",
          name: "Documentos de Juicio",
          documents: [
            { name: "Acta de Instalación de Juicio", date: "2024-08-15", type: "pdf" },
            { name: "Declaración de Testigos", date: "2024-08-20", type: "pdf" },
            { name: "Alegatos de Clausura", date: "2024-09-10", type: "docx" }
          ]
        },
        {
          stage: "Sentencia",
          name: "Documentos de Sentencia",
          documents: [
            { name: "Sentencia Absolutoria", date: "2024-10-01", type: "pdf" },
            { name: "Resolución Consentida", date: "2024-10-20", type: "pdf" }
          ]
        }
      ],
      milestones: [
        {
          instance: "primera",
          stage: "Investigación Preparatoria",
          title: "Inicio de Investigación",
          date: "2024-03-15",
          description: "Se formalizó la investigación preparatoria contra el imputado.",
          isVerdict: false
        },
        {
          instance: "primera",
          stage: "Etapa Intermedia",
          title: "Acusación Fiscal",
          date: "2024-06-01",
          description: "El fiscal presentó acusación formal. Se preparó defensa técnica.",
          isVerdict: false
        },
        {
          instance: "primera",
          stage: "Juicio Oral",
          title: "Inicio de Juicio Oral",
          date: "2024-08-15",
          description: "Se instaló el juicio oral con presencia de todas las partes.",
          isVerdict: false
        },
        {
          instance: "primera",
          stage: "Sentencia",
          title: "Sentencia Absolutoria",
          date: "2024-10-01",
          description: "El Juez dictó sentencia absolutoria por insuficiencia probatoria.",
          isVerdict: true,
          verdictResult: "favorable"
        }
      ],
      strategy: {
        objective: "Lograr la absolución del imputado demostrando la inexistencia del delito de apropiación ilícita.",
        approach: "Defensa técnica basada en la ausencia de elementos objetivos del tipo penal y contradicción de testigos de cargo.",
        strengths: [
          "Informe pericial contable favorable",
          "Testimonios de descargo sólidos",
          "Ausencia de pruebas directas de apropiación",
          "Contradicciones en declaraciones de la parte agraviada"
        ],
        weaknesses: [
          "Demora inicial en la defensa",
          "Falta de documentación original de algunos movimientos"
        ],
        notes: "El caso fue resuelto favorablemente. El cliente quedó muy satisfecho con el resultado. Se logró sentencia absolutoria en primera instancia que quedó consentida."
      },
      financial: {
        totalBudget: 25000,
        totalPaid: 25000,
        payments: [
          { date: "2024-03-10", concept: "Honorarios iniciales", amount: 8000 },
          { date: "2024-05-15", concept: "Etapa intermedia", amount: 7000 },
          { date: "2024-08-01", concept: "Juicio oral", amount: 7000 },
          { date: "2024-10-05", concept: "Cierre de caso", amount: 3000 }
        ],
        expenses: [
          { date: "2024-04-10", concept: "Peritaje contable", amount: 2500 },
          { date: "2024-06-20", concept: "Copias certificadas", amount: 350 },
          { date: "2024-08-10", concept: "Gastos de audiencia", amount: 500 }
        ]
      }
    }
  },
  {
    // Cliente 2: Caso Laboral en Progreso (65%)
    name: "Jorge Luis Mendoza Paredes",
    email: "jorge.mendoza@empresa.com",
    whatsappPrimary: "+51976543210",
    contactInfo: "Jr. Carabaya 123, Cercado de Lima",
    processData: {
      activeTab: "dashboard",
      caseStatus: {
        caseNumber: "00567-2025-0-1801-JR-LA-05",
        caseType: "Laboral",
        currentStage: "Juicio Oral",
        resolutionStatus: "en_tramite",
        nextDeadline: {
          date: "2025-12-10",
          description: "Audiencia de Juzgamiento - Continuación"
        }
      },
      participants: [
        {
          name: "Jorge Luis Mendoza Paredes",
          role: "demandante",
          contact: "+51976543210",
          email: "jorge.mendoza@empresa.com",
          dni: "78945612",
          relation: "Cliente - Trabajador despedido",
          notes: "Ex trabajador de Corporación ABC S.A.C. con 8 años de servicios."
        },
        {
          name: "Corporación ABC S.A.C.",
          role: "demandado",
          contact: "+51014567890",
          email: "legal@corporacionabc.com.pe",
          dni: "20512345678",
          relation: "Empleador demandado",
          notes: "Empresa de retail con sede en Lima. Representante legal: Gerente General."
        },
        {
          name: "Dra. Patricia Sánchez",
          role: "abogado_contraparte",
          contact: "+51955443322",
          email: "psanchez@estudioabc.com",
          dni: "33445566",
          relation: "Abogada de la empresa",
          notes: "Abogada laboralista de la empresa demandada."
        }
      ],
      documentFolders: [
        {
          stage: "Demanda",
          name: "Documentos Iniciales",
          documents: [
            { name: "Demanda de Reposición Laboral", date: "2025-01-15", type: "pdf" },
            { name: "Contrato de Trabajo", date: "2025-01-15", type: "pdf" },
            { name: "Boletas de Pago 2024", date: "2025-01-15", type: "pdf" },
            { name: "Carta de Despido", date: "2025-01-15", type: "pdf" }
          ]
        },
        {
          stage: "Contestación",
          name: "Documentos de Contestación",
          documents: [
            { name: "Contestación de Demanda", date: "2025-03-01", type: "pdf" },
            { name: "Memorandos de Amonestación", date: "2025-03-01", type: "pdf" }
          ]
        },
        {
          stage: "Juicio Oral",
          name: "Documentos de Juicio",
          documents: [
            { name: "Acta de Audiencia Única", date: "2025-06-15", type: "pdf" },
            { name: "Declaración de Testigos", date: "2025-06-15", type: "pdf" }
          ]
        }
      ],
      milestones: [
        {
          instance: "primera",
          stage: "Demanda",
          title: "Presentación de Demanda",
          date: "2025-01-15",
          description: "Se presentó demanda de reposición por despido incausado.",
          isVerdict: false
        },
        {
          instance: "primera",
          stage: "Admisión",
          title: "Auto Admisorio",
          date: "2025-02-01",
          description: "El Juzgado admitió la demanda y notificó a la empresa.",
          isVerdict: false
        },
        {
          instance: "primera",
          stage: "Contestación",
          title: "Contestación de Demanda",
          date: "2025-03-01",
          description: "La empresa contestó alegando causa justa de despido.",
          isVerdict: false
        },
        {
          instance: "primera",
          stage: "Juicio Oral",
          title: "Inicio de Audiencia Única",
          date: "2025-06-15",
          description: "Se llevó a cabo la primera sesión de audiencia única.",
          isVerdict: false
        }
      ],
      strategy: {
        objective: "Lograr la reposición del trabajador y el pago de remuneraciones devengadas.",
        approach: "Demostrar que el despido fue incausado y sin procedimiento previo válido.",
        strengths: [
          "8 años de antigüedad laboral sin antecedentes negativos",
          "La carta de despido no especifica causa legal",
          "Testimonios de compañeros de trabajo",
          "Ausencia de proceso disciplinario previo"
        ],
        weaknesses: [
          "Memorandos de amonestación presentados por la empresa",
          "La empresa alega bajo rendimiento"
        ],
        notes: "Caso en etapa de juzgamiento. Se espera sentencia favorable basada en jurisprudencia del TC sobre despido incausado."
      },
      financial: {
        totalBudget: 15000,
        totalPaid: 10000,
        payments: [
          { date: "2025-01-10", concept: "Honorarios iniciales", amount: 5000 },
          { date: "2025-03-15", concept: "Etapa probatoria", amount: 3000 },
          { date: "2025-06-01", concept: "Audiencia única", amount: 2000 }
        ],
        expenses: [
          { date: "2025-01-20", concept: "Tasa judicial", amount: 180 },
          { date: "2025-02-15", concept: "Notificaciones", amount: 120 }
        ]
      }
    }
  },
  {
    // Cliente 3: Caso Civil Nuevo (25%)
    name: "Ana Patricia Flores Huamán",
    email: "ana.flores@gmail.com",
    whatsappPrimary: "+51965432109",
    contactInfo: "Calle Los Pinos 789, San Borja, Lima",
    assistantName: "Carmen Flores",
    emailAssistant: "carmen.flores@gmail.com",
    whatsappAssistant: "+51954321098",
    processData: {
      activeTab: "dashboard",
      caseStatus: {
        caseNumber: "Pendiente de asignación",
        caseType: "Civil",
        currentStage: "Investigación Preparatoria",
        resolutionStatus: "en_tramite",
        nextDeadline: {
          date: "2025-12-05",
          description: "Presentación de demanda"
        }
      },
      participants: [
        {
          name: "Ana Patricia Flores Huamán",
          role: "demandante",
          contact: "+51965432109",
          email: "ana.flores@gmail.com",
          dni: "56789123",
          relation: "Cliente - Compradora afectada",
          notes: "Adquirió departamento con vicios ocultos. Busca resolución del contrato."
        },
        {
          name: "Inmobiliaria Horizonte S.A.C.",
          role: "demandado",
          contact: "+51014561234",
          email: "ventas@inmohorizonte.com.pe",
          dni: "20601234567",
          relation: "Vendedor del inmueble",
          notes: "Constructora e inmobiliaria que vendió el departamento."
        }
      ],
      documentFolders: [
        {
          stage: "Investigación Preparatoria",
          name: "Documentos Preliminares",
          documents: [
            { name: "Contrato de Compraventa", date: "2025-11-01", type: "pdf" },
            { name: "Informe Técnico de Vicios", date: "2025-11-10", type: "pdf" },
            { name: "Fotografías del Inmueble", date: "2025-11-10", type: "jpg" },
            { name: "Carta Notarial de Reclamo", date: "2025-11-15", type: "pdf" }
          ]
        }
      ],
      milestones: [
        {
          instance: "primera",
          stage: "Investigación Preparatoria",
          title: "Reunión Inicial con Cliente",
          date: "2025-11-01",
          description: "Primera reunión para evaluar el caso y documentación.",
          isVerdict: false
        },
        {
          instance: "primera",
          stage: "Investigación Preparatoria",
          title: "Inspección Técnica",
          date: "2025-11-10",
          description: "Se realizó inspección técnica que confirmó vicios estructurales.",
          isVerdict: false
        }
      ],
      strategy: {
        objective: "Lograr la resolución del contrato de compraventa y la devolución del precio pagado más indemnización.",
        approach: "Demanda de resolución contractual por vicios ocultos según el Código Civil.",
        strengths: [
          "Informe técnico independiente que confirma vicios estructurales",
          "Vicios no fueron declarados por la inmobiliaria",
          "Carta notarial sin respuesta del vendedor",
          "Fotografías que evidencian los daños"
        ],
        weaknesses: [
          "La inmobiliaria podría alegar conocimiento del comprador",
          "Tiempo transcurrido desde la compra"
        ],
        notes: "Caso en etapa inicial de investigación. Se está preparando la demanda con toda la documentación probatoria."
      },
      financial: {
        totalBudget: 20000,
        totalPaid: 5000,
        payments: [
          { date: "2025-11-05", concept: "Honorarios iniciales - Evaluación", amount: 3000 },
          { date: "2025-11-12", concept: "Peritaje técnico", amount: 2000 }
        ],
        expenses: [
          { date: "2025-11-10", concept: "Informe técnico pericial", amount: 1500 },
          { date: "2025-11-15", concept: "Carta notarial", amount: 150 }
        ]
      }
    }
  }
];

async function setupDemoComplete() {
  console.log("🚀 Configurando ambiente demo completo para Dr. Juro...\n");

  if (!db) {
    console.error("❌ Base de datos no disponible. Verifica DATABASE_URL.");
    process.exit(1);
  }

  try {
    // 1. Crear o recuperar usuario demo
    const demoUsername = "demo";
    const demoPassword = "demo123";
    
    let userId: string;

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, demoUsername))
      .limit(1);

    if (existingUser.length > 0) {
      console.log("✅ Usuario demo ya existe");
      userId = existingUser[0].id;
    } else {
      console.log("📧 Creando usuario demo...");
      const hashedPassword = await hashPassword(demoPassword);
      const [newUser] = await db
        .insert(users)
        .values({
          username: demoUsername,
          password: hashedPassword,
          role: "abogado",
        })
        .returning();
      
      userId = newUser.id;
      console.log("   ✅ Usuario creado");
    }

    // 2. Crear clientes demo con sus procesos
    console.log("\n👥 Creando clientes demo con datos completos...\n");

    for (const clientData of demoClients) {
      // Verificar si el cliente ya existe
      const existingClient = await db
        .select()
        .from(clients)
        .where(eq(clients.name, clientData.name))
        .limit(1);

      let clientId: string;

      if (existingClient.length > 0) {
        console.log(`   ⏩ Cliente "${clientData.name}" ya existe, actualizando proceso...`);
        clientId = existingClient[0].id;
      } else {
        // Crear cliente
        const [newClient] = await db
          .insert(clients)
          .values({
            name: clientData.name,
            userId: userId,
            email: clientData.email,
            whatsappPrimary: clientData.whatsappPrimary,
            contactInfo: clientData.contactInfo,
            imputadoName: clientData.imputadoName || null,
            imputadoDni: clientData.imputadoDni || null,
            imputadoRelation: clientData.imputadoRelation || null,
            imputadoContact: clientData.imputadoContact || null,
            assistantName: clientData.assistantName || null,
            emailAssistant: clientData.emailAssistant || null,
            whatsappAssistant: clientData.whatsappAssistant || null,
          })
          .returning();

        clientId = newClient.id;
        console.log(`   ✅ Cliente creado: ${clientData.name}`);
      }

      // Crear o actualizar proceso legal V2
      const existingProcess = await db
        .select()
        .from(legalProcessV2)
        .where(eq(legalProcessV2.clientId, clientId))
        .limit(1);

      if (existingProcess.length > 0) {
        await db
          .update(legalProcessV2)
          .set({
            data: clientData.processData,
            updatedAt: new Date(),
          })
          .where(eq(legalProcessV2.clientId, clientId));
        console.log(`      📋 Proceso actualizado`);
      } else {
        await db
          .insert(legalProcessV2)
          .values({
            clientId: clientId,
            data: clientData.processData,
          });
        console.log(`      📋 Proceso creado`);
      }

      // Mostrar resumen del caso
      const status = clientData.processData.caseStatus;
      console.log(`      📊 ${status.caseType} - ${status.currentStage} (${status.resolutionStatus})`);
    }

    // 3. Resumen final
    console.log("\n" + "═".repeat(60));
    console.log("✅ AMBIENTE DEMO CONFIGURADO EXITOSAMENTE");
    console.log("═".repeat(60));
    console.log("\n📋 CREDENCIALES DE ACCESO:");
    console.log("   Usuario:    demo");
    console.log("   Contraseña: demo123");
    console.log("\n📊 CLIENTES DEMO CREADOS:");
    for (const client of demoClients) {
      const status = client.processData.caseStatus;
      const progress = status.resolutionStatus === "favorable" ? "100%" : 
                       status.currentStage === "Juicio Oral" ? "65%" : "25%";
      console.log(`   • ${client.name}`);
      console.log(`     ${status.caseType} | ${status.currentStage} | ${progress}`);
    }
    console.log("\n🔗 Inicia sesión en la aplicación para ver los casos.");
    console.log("═".repeat(60) + "\n");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  process.exit(0);
}

setupDemoComplete();
