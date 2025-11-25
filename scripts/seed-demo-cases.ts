/**
 * Script de Seed: Casos Demo Completos
 * 
 * Crea usuario demo y 3 clientes con procesos legales completos:
 * 1. Carlos Mendoza - Caso Concluido (Absuelto)
 * 2. Andrea Torres - En Curso (Juicio Oral)
 * 3. Miguel Rodríguez - Iniciando (Investigación)
 * 
 * Ejecutar: tsx scripts/seed-demo-cases.ts
 */

import { db } from "../server/db";
import { users, clients } from "../shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const DEMO_USER = {
  username: "demo@drjuro.com",
  password: "Demo2025!", // Contraseña: Demo2025!
  role: "abogado" as const,
};

// ============================================================================
// DATOS DE LOS 3 CLIENTES
// ============================================================================

const CASO_1_CARLOS_MENDOZA = {
  name: "Carlos Alberto Mendoza Ruiz",
  email: "carlos.mendoza@gmail.com",
  whatsappPrimary: "+51 987 654 321",
  assistantName: "María Elena Mendoza",
  emailAssistant: "maria.mendoza@gmail.com",
  whatsappAssistant: "+51 987 654 322",
  imputadoName: "", // El mismo es el imputado
  imputadoDni: "43256789",
  imputadoRelation: "",
  imputadoContact: "",
  imputadoEmail: "",
  notifyClient: "true",
  notifyAssistant: "true",
  notifyImputado: "false",
  notes: "Empresario constructor, 45 años. Caso de apropiación ilícita ABSUELTO en 2da instancia.",
  contactInfo: "Esposa María Elena es el contacto principal para coordinaciones.",
};

const CASO_2_ANDREA_TORRES = {
  name: "Andrea Sofía Torres Vega",
  email: "andrea.torres@outlook.com",
  whatsappPrimary: "+51 965 432 100",
  assistantName: "Juan Pablo Torres",
  emailAssistant: "jp.torres@gmail.com",
  whatsappAssistant: "+51 965 432 101",
  imputadoName: "", // Ella misma
  imputadoDni: "72345678",
  imputadoRelation: "",
  imputadoContact: "",
  imputadoEmail: "",
  notifyClient: "true",
  notifyAssistant: "true",
  notifyImputado: "false",
  notes: "Diseñadora gráfica, 32 años. Caso de estafa agravada EN JUICIO ORAL. Padre es asistente.",
  contactInfo: "Padre Juan Pablo Torres coordina audiencias y pagos.",
};

const CASO_3_MIGUEL_RODRIGUEZ = {
  name: "Pedro Martín Quispe Huamán",
  email: "pedro.quispe@gmail.com",
  whatsappPrimary: "+51 945 123 456",
  assistantName: "Rosa María Huamán",
  emailAssistant: "rosa.huaman@gmail.com",
  whatsappAssistant: "+51 945 123 457",
  imputadoName: "Miguel Ángel Rodríguez Paz",
  imputadoDni: "76543210",
  imputadoRelation: "Hijo",
  imputadoContact: "+51 945 123 458",
  imputadoEmail: "miguelrodriguez19@gmail.com",
  notifyClient: "true",
  notifyAssistant: "true",
  notifyImputado: "true",
  notes: "Padres contratan defensa para hijo Miguel (19 años). Conducción en estado de ebriedad. CASO INICIANDO.",
  contactInfo: "Ambos padres están muy involucrados. Miguel es estudiante de ingeniería.",
};

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
  console.log("🚀 Iniciando seed de casos demo...\n");

  if (!db) {
    console.error("❌ Base de datos no disponible");
    process.exit(1);
  }

  try {
    // Paso 1: Crear usuario demo (o verificar si existe)
    console.log("👤 Creando usuario demo...");
    const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);
    
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, DEMO_USER.username))
      .limit(1);

    let demoUser;
    if (existingUser.length > 0) {
      console.log(`   ✓ Usuario ${DEMO_USER.username} ya existe`);
      demoUser = existingUser[0];
    } else {
      [demoUser] = await db.insert(users).values({
        username: DEMO_USER.username,
        password: hashedPassword,
        role: DEMO_USER.role,
      }).returning();
      console.log(`   ✓ Usuario creado: ${DEMO_USER.username}`);
      console.log(`   ✓ Contraseña: ${DEMO_USER.password}`);
    }

    // Paso 2: Crear Cliente 1 - Carlos Mendoza (Caso Concluido)
    console.log("\n📁 Creando CASO 1: Carlos Alberto Mendoza Ruiz (Concluido - Absuelto)");
    const [cliente1] = await db.insert(clients).values(CASO_1_CARLOS_MENDOZA).returning();
    console.log(`   ✓ Cliente creado con ID: ${cliente1.id}`);
    console.log(`   ✓ Expediente: 00123-2023-0-1801-JR-PE-01`);
    console.log(`   ✓ Delito: Apropiación Ilícita`);
    console.log(`   ✓ Estado: ABSUELTO (sentencia firme)`);

    // Paso 3: Crear Cliente 2 - Andrea Torres (Caso En Curso)
    console.log("\n📁 Creando CASO 2: Andrea Sofía Torres Vega (En Curso - Juicio Oral)");
    const [cliente2] = await db.insert(clients).values(CASO_2_ANDREA_TORRES).returning();
    console.log(`   ✓ Cliente creado con ID: ${cliente2.id}`);
    console.log(`   ✓ Expediente: 00847-2024-0-1801-JR-PE-03`);
    console.log(`   ✓ Delito: Estafa Agravada`);
    console.log(`   ✓ Estado: EN JUICIO ORAL (próxima audiencia 25/11/2025)`);

    // Paso 4: Crear Cliente 3 - Miguel Rodríguez (Caso Iniciando)
    console.log("\n📁 Creando CASO 3: Pedro Martín Quispe Huamán (Iniciando - Investigación)");
    console.log("   Imputado: Miguel Ángel Rodríguez Paz (hijo)");
    const [cliente3] = await db.insert(clients).values(CASO_3_MIGUEL_RODRIGUEZ).returning();
    console.log(`   ✓ Cliente creado con ID: ${cliente3.id}`);
    console.log(`   ✓ Expediente: 01245-2025-0-1801-JR-PE-07`);
    console.log(`   ✓ Delito: Conducción en Estado de Ebriedad`);
    console.log(`   ✓ Estado: INVESTIGACIÓN PREPARATORIA (solicitud principio de oportunidad)`);

    // Paso 5: Crear datos de LegalProcessV2 para cada cliente
    console.log("\n📊 Poblando datos de procesos legales...");
    await seedLegalProcessData(cliente1.id, "CASO_1_CONCLUIDO");
    await seedLegalProcessData(cliente2.id, "CASO_2_EN_CURSO");
    await seedLegalProcessData(cliente3.id, "CASO_3_INICIANDO");

    console.log("\n✅ Seed completado exitosamente!");
    console.log("\n" + "=".repeat(60));
    console.log("📋 RESUMEN");
    console.log("=".repeat(60));
    console.log(`Usuario Demo: ${DEMO_USER.username}`);
    console.log(`Contraseña: ${DEMO_USER.password}`);
    console.log(`\nClientes Creados: 3`);
    console.log(`1. Carlos Mendoza (${cliente1.id}) - ABSUELTO`);
    console.log(`2. Andrea Torres (${cliente2.id}) - EN JUICIO ORAL`);
    console.log(`3. Miguel Rodríguez (${cliente3.id}) - INVESTIGACIÓN`);
    console.log("=".repeat(60));
    console.log("\n🌐 Inicia sesión con:");
    console.log(`   Usuario: ${DEMO_USER.username}`);
    console.log(`   Contraseña: ${DEMO_USER.password}`);
    console.log("\n");

  } catch (error) {
    console.error("❌ Error en seed:", error);
    process.exit(1);
  }

  process.exit(0);
}

// ============================================================================
// DATOS DEL PROCESO LEGAL (Legal ProcessV2)
// ============================================================================

async function seedLegalProcessData(clientId: string, caseType: string) {
  console.log(`   Poblando datos para ${caseType}...`);
  
  if (!db) {
    console.log(`   ⚠️  Base de datos no disponible, saltando proceso legal`);
    return;
  }
  
  const processData = getProcessDataForCase(caseType);
  
  try {
    // Insertar directamente en la base de datos usando Drizzle
    const { legalProcessV2 } = await import("../shared/schema");
    
    // Verificar si ya existe
    const existing = await db
      .select()
      .from(legalProcessV2)
      .where(eq(legalProcessV2.clientId, clientId))
      .limit(1);

    if (existing.length > 0) {
      // Actualizar
      await db
        .update(legalProcessV2)
        .set({
          data: processData,
          updatedAt: new Date(),
        })
        .where(eq(legalProcessV2.clientId, clientId));
      console.log(`   ✓ Datos del proceso actualizados`);
    } else {
      // Crear nuevo
      await db.insert(legalProcessV2).values({
        clientId: clientId,
        data: processData,
      });
      console.log(`   ✓ Datos del proceso creados`);
    }
  } catch (error) {
    console.error(`   ❌ Error guardando proceso:`, error);
  }
}

function getProcessDataForCase(caseType: string) {
  switch (caseType) {
    case "CASO_1_CONCLUIDO":
      return getCaso1CarlosMendozaData();
    case "CASO_2_EN_CURSO":
      return getCaso2AndreaTorresData();
    case "CASO_3_INICIANDO":
      return getCaso3MiguelRodriguezData();
    default:
      return {};
  }
}

// Continuará en siguientes archivos...
// Los datos completos de cada caso se agregarán a continuación

function getCaso1CarlosMendozaData() {
  return {
    activeTab: "dashboard" as const,
    caseStatus: {
      caseNumber: "00123-2023-0-1801-JR-PE-01",
      caseType: "Penal",
      currentStage: "Proceso Concluido",
      resolutionStatus: "absuelto_2da" as const,
      nextDeadline: undefined,
    },
    participants: [
      {
        id: "p1",
        name: "Carlos Alberto Mendoza Ruiz",
        role: "imputado" as const,
        contact: "+51 987 654 321",
        email: "carlos.mendoza@gmail.com",
        dni: "43256789",
        notes: "Empresario constructor. Imputado absuelto.",
      },
      {
        id: "p2",
        name: "Dr. Ricardo Salazar Ponce",
        role: "defensor" as const,
        contact: "+51 999 111 222",
        email: "rsalazar@estudiojuridico.pe",
        dni: "08765432",
        notes: "Abogado defensor principal",
      },
      {
        id: "p3",
        name: "Dra. Patricia Vega Ruiz",
        role: "fiscal" as const,
        email: "pvega@mpfn.gob.pe",
        dni: "09876543",
        notes: "Fiscal del caso",
      },
      {
        id: "p4",
        name: "Dr. Miguel Ángel Torres",
        role: "juez" as const,
        dni: "07654321",
        notes: "Juez de Primera Instancia",
      },
      {
        id: "p5",
        name: "Dr. Héctor Ramírez Soto",
        role: "vocal" as const,
        dni: "06543210",
        notes: "Vocal - Segunda Instancia",
      },
      {
        id: "p6",
        name: "Jorge Luis Paredes Núñez",
        role: "agraviado" as const,
        contact: "+51 987 333 444",
        dni: "44567890",
        notes: "Denunciante",
      },
      {
        id: "p7",
        name: "Ing. Roberto Silva",
        role: "testigo" as const,
        contact: "+51 988 555 666",
        email: "rsilva@acerosdelnorte.com",
        dni: "41234567",
        notes: "Proveedor de acero - testigo clave de la defensa",
      },
      {
        id: "p8",
        name: "CPC Juan Carlos Ríos",
        role: "perito" as const,
        contact: "+51 989 777 888",
        email: "jrios@peritoscontables.pe",
        dni: "10234567",
        notes: "Perito contable",
      },
    ],
    documentFolders: [
      {
        stage: "general" as const,
        label: "Documentos Generales / Cliente",
        documents: [
          {
            id: "doc1-1",
            filename: "DNI_Carlos_Mendoza.pdf",
            uploadDate: "2023-03-15T10:00:00Z",
            category: "Identificación",
          },
          {
            id: "doc1-2",
            filename: "Antecedentes_Penales.pdf",
            uploadDate: "2023-03-15T10:05:00Z",
            category: "Certificados",
          },
          {
            id: "doc1-3",
            filename: "Poder_Abogado.pdf",
            uploadDate: "2023-03-15T10:10:00Z",
            category: "Legal",
          },
          {
            id: "doc1-4",
            filename: "Declaracion_Jurada_Domicilio.pdf",
            uploadDate: "2023-03-15T10:15:00Z",
            category: "Declaraciones",
          },
          {
            id: "doc1-5",
            filename: "Contrato_Honorarios_Defensa.pdf",
            uploadDate: "2023-03-20T14:00:00Z",
            category: "Contractual",
          },
        ],
      },
      {
        stage: "investigacion" as const,
        label: "Investigación Preparatoria",
        documents: [
          {
            id: "doc2-1",
            filename: "Denuncia_Fiscal.pdf",
            uploadDate: "2023-03-15T09:00:00Z",
            category: "Denuncia",
          },
          {
            id: "doc2-2",
            filename: "Declaracion_Preliminar_Carlos_Mendoza.pdf",
            uploadDate: "2023-03-22T11:30:00Z",
            category: "Declaraciones",
          },
          {
            id: "doc2-3",
            filename: "Informe_Pericial_Contable.pdf",
            uploadDate: "2023-04-05T15:00:00Z",
            category: "Pericias",
          },
          {
            id: "doc2-4",
            filename: "Facturas_Compra_Materiales.pdf",
            uploadDate: "2023-03-25T10:00:00Z",
            category: "Pruebas",
          },
          {
            id: "doc2-5",
            filename: "Testimonial_Proveedor_Acero.pdf",
            uploadDate: "2023-04-08T14:00:00Z",
            category: "Testimonios",
          },
          {
            id: "doc2-6",
            filename: "Disposicion_Formalizacion.pdf",
            uploadDate: "2023-04-10T16:00:00Z",
            category: "Resoluciones",
          },
          {
            id: "doc2-7",
            filename: "Escrito_Defensa_Cuestionamiento.pdf",
            uploadDate: "2023-04-12T10:00:00Z",
            category: "Escritos Defensa",
          },
        ],
      },
      {
        stage: "intermedia" as const,
        label: "Etapa Intermedia",
        documents: [
          {
            id: "doc3-1",
            filename: "Requerimiento_Acusacion_Fiscal.pdf",
            uploadDate: "2023-06-15T09:00:00Z",
            category: "Acusación",
          },
          {
            id: "doc3-2",
            filename: "Escrito_Defensa_Excepciones.pdf",
            uploadDate: "2023-06-20T11:00:00Z",
            category: "Escritos Defensa",
          },
          {
            id: "doc3-3",
            filename: "Resolucion_Audiencia_Control_Acusacion.pdf",
            uploadDate: "2023-07-05T16:30:00Z",
            category: "Resoluciones",
          },
          {
            id: "doc3-4",
            filename: "Auto_Enjuiciamiento.pdf",
            uploadDate: "2023-07-12T10:00:00Z",
            category: "Autos",
          },
          {
            id: "doc3-5",
            filename: "Ofrecimiento_Pruebas_Defensa.pdf",
            uploadDate: "2023-07-15T09:00:00Z",
            category: "Pruebas",
          },
          {
            id: "doc3-6",
            filename: "Admision_Pruebas.pdf",
            uploadDate: "2023-07-20T14:00:00Z",
            category: "Autos",
          },
        ],
      },
      {
        stage: "juicio_oral" as const,
        label: "Juicio Oral",
        documents: [
          {
            id: "doc4-1",
            filename: "Acta_Audiencia_Juzgamiento_01.pdf",
            uploadDate: "2023-08-10T09:00:00Z",
            category: "Actas",
          },
          {
            id: "doc4-2",
            filename: "Acta_Audiencia_Juzgamiento_02.pdf",
            uploadDate: "2023-08-17T09:00:00Z",
            category: "Actas",
          },
          {
            id: "doc4-3",
            filename: "Acta_Audiencia_Juzgamiento_03.pdf",
            uploadDate: "2023-08-24T09:00:00Z",
            category: "Actas",
          },
          {
            id: "doc4-4",
            filename: "Acta_Audiencia_Juzgamiento_04.pdf",
            uploadDate: "2023-08-31T09:00:00Z",
            category: "Actas",
          },
          {
            id: "doc4-5",
            filename: "Alegato_Final_Defensa.pdf",
            uploadDate: "2023-08-31T11:30:00Z",
            category: "Alegatos",
          },
          {
            id: "doc4-6",
            filename: "Sentencia_Absolutoria.pdf",
            uploadDate: "2023-09-15T15:00:00Z",
            category: "Sentencias",
          },
        ],
      },
      {
        stage: "apelacion" as const,
        label: "Apelación (2da Instancia)",
        documents: [
          {
            id: "doc5-1",
            filename: "Recurso_Apelacion_Fiscal.pdf",
            uploadDate: "2023-09-20T10:00:00Z",
            category: "Recursos",
          },
          {
            id: "doc5-2",
            filename: "Contestacion_Apelacion_Defensa.pdf",
            uploadDate: "2023-09-25T11:00:00Z",
            category: "Escritos Defensa",
          },
          {
            id: "doc5-3",
            filename: "Concesorio_Apelacion.pdf",
            uploadDate: "2023-09-28T14:00:00Z",
            category: "Autos",
          },
          {
            id: "doc5-4",
            filename: "Escrito_Fundamentacion_Apelacion_Fiscal.pdf",
            uploadDate: "2023-10-05T10:00:00Z",
            category: "Escritos Fiscalía",
          },
          {
            id: "doc5-5",
            filename: "Escrito_Absolucion_Grado_Defensa.pdf",
            uploadDate: "2023-10-10T09:00:00Z",
            category: "Escritos Defensa",
          },
          {
            id: "doc5-6",
            filename: "Sentencia_Vista_Segunda_Instancia.pdf",
            uploadDate: "2025-10-20T16:00:00Z",
            category: "Sentencias",
          },
        ],
      },
      {
        stage: "casacion" as const,
        label: "Casación (Corte Suprema)",
        documents: [],
      },
      {
        stage: "ejecucion" as const,
        label: "Ejecución",
        documents: [],
      },
    ],
    milestones: [
      {
        id: "m1",
        instance: "primera" as const,
        stage: "Denuncia",
        title: "Presentación de Denuncia ante Fiscalía",
        date: "2023-03-15",
        description: "Jorge Luis Paredes presenta denuncia por apropiación ilícita",
        isVerdict: false,
      },
      {
        id: "m2",
        instance: "primera" as const,
        stage: "Investigación",
        title: "Declaración Preliminar",
        date: "2023-03-22",
        description: "Carlos Mendoza rinde declaración preliminar",
        isVerdict: false,
      },
      {
        id: "m3",
        instance: "primera" as const,
        stage: "Investigación",
        title: "Formalización de Investigación",
        date: "2023-04-10",
        description: "Fiscalía formaliza la investigación preparatoria",
        isVerdict: false,
      },
      {
        id: "m4",
        instance: "primera" as const,
        stage: "Investigación",
        title: "Acusación Fiscal",
        date: "2023-06-15",
        description: "Fiscal presenta requerimiento de acusación",
        isVerdict: false,
      },
      {
        id: "m5",
        instance: "primera" as const,
        stage: "Intermedia",
        title: "Audiencia de Control de Acusación",
        date: "2023-07-05",
        description: "Juez admite acusación y ordena juicio oral",
        isVerdict: false,
      },
      {
        id: "m6",
        instance: "primera" as const,
        stage: "Juicio Oral",
        title: "Inicio de Juicio Oral - Sesión 1",
        date: "2023-08-10",
        description: "Primera sesión de juzgamiento",
        isVerdict: false,
      },
      {
        id: "m7",
        instance: "primera" as const,
        stage: "Juicio Oral",
        title: "Juicio Oral - Sesión 2",
        date: "2023-08-17",
        description: "Declaración del imputado Carlos Mendoza",
        isVerdict: false,
      },
      {
        id: "m8",
        instance: "primera" as const,
        stage: "Juicio Oral",
        title: "Juicio Oral - Sesión 3",
        date: "2023-08-24",
        description: "Actuación de pruebas: peritos y testigos",
        isVerdict: false,
      },
      {
        id: "m9",
        instance: "primera" as const,
        stage: "Juicio Oral",
        title: "Juicio Oral - Sesión 4 (Alegatos)",
        date: "2023-08-31",
        description: "Alegatos finales de fiscalía y defensa",
        isVerdict: false,
      },
      {
        id: "m10",
        instance: "primera" as const,
        stage: "Sentencia",
        title: "Sentencia de Primera Instancia",
        date: "2023-09-15",
        description: "Sentencia ABSOLUTORIA - Carlos Mendoza absuelto de cargos",
        isVerdict: true,
        verdictResult: "absolutoria" as const,
      },
      {
        id: "m11",
        instance: "segunda" as const,
        stage: "Apelación",
        title: "Sentencia de Vista (Segunda Instancia)",
        date: "2025-10-20",
        description: "Sala Superior CONFIRMA absolución de Carlos Mendoza",
        isVerdict: true,
        verdictResult: "confirma" as const,
      },
    ],
    strategy: {
      caseTheory: "Carlos Mendoza no cometió apropiación ilícita porque los materiales de construcción eran de su legítima propiedad, adquiridos mediante compra debidamente documentada. El denunciante confunde un préstamo de herramientas (que sí fueron devueltas) con la supuesta apropiación de materiales.",
      factsAnalisis: "1. Carlos adquirió 5 toneladas de acero el 10/01/2023 por S/ 85,000\n2. Cuenta con facturas y comprobantes de pago\n3. El agraviado prestó herramientas menores que fueron devueltas\n4. Existe confusión sobre qué bienes fueron prestados\n5. El perito contable confirmó la legitimidad de la compra",
      objectives: [
        "Demostrar la legítima propiedad de los materiales",
        "Desvirtuar la tipicidad del delito (no hay apropiación de bien ajeno)",
        "Obtener absolución por falta de responsabilidad penal",
      ],
      legalStrategy: "Presentar documentación completa de compra, testimonios del proveedor, pericia contable. Enfatizar en alegatos que sin 'bien ajeno' no hay apropiación ilícita. Solicitar absolución por atipicidad.",
      privateNotes: "El cliente está muy tranquilo porque tiene toda la documentación. El agraviado parece tener un problema de memoria o mala fe. Estrategia: inundar con prueba documental irrefutable. El fiscal tiene un caso débil y lo sabe.",
      attachments: [],
    },
    financial: {
      honorarios: 25000,
      gastos: 3500,
      reparacionCivil: 0,
      payments: [
        {
          date: "2023-03-20",
          amount: 10000,
          concept: "Anticipo de honorarios",
        },
        {
          date: "2023-06-15",
          amount: 7000,
          concept: "Pago parcial (acusación)",
        },
        {
          date: "2023-09-15",
          amount: 8000,
          concept: "Pago final (sentencia 1ra instancia)",
        },
      ],
    },
  };
}

// Importar datos completos de casos 2 y 3
import {
  getCaso2AndreaTorresDataComplete,
  getCaso3MiguelRodriguezDataComplete,
} from "./seed-demo-cases-data-2-3";

function getCaso2AndreaTorresData() {
  return getCaso2AndreaTorresDataComplete();
}

function getCaso3MiguelRodriguezData() {
  return getCaso3MiguelRodriguezDataComplete();
}

// Ejecutar
main();
