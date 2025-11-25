import 'dotenv/config';
import { db } from '../server/db.js';
import { clients, cases, caseProcessState, caseDocuments } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function seedData() {
  if (!db) {
    console.error('❌ Database not available');
    process.exit(1);
  }

  try {
    console.log('🌱 Creando datos de ejemplo...\n');

    // Get admin user ID
    const adminUserId = '2b74c618-fcbf-43a0-84fd-f0ab3a45dcba';

    // Delete existing test data (optional - keep existing 3 clients)
    const existingClients = await db.select().from(clients);
    console.log(`📋 Clientes existentes: ${existingClients.length}`);

    // Create 10 diverse clients
    const clientsData = [
      { name: 'María García López', contactInfo: 'maria.garcia@email.com | +51 987 654 321', email: 'maria.garcia@email.com', whatsappPrimary: '+51987654321', userId: adminUserId },
      { name: 'Juan Carlos Mendoza', contactInfo: 'jc.mendoza@empresa.pe | +51 998 123 456', email: 'jc.mendoza@empresa.pe', whatsappPrimary: '+51998123456', userId: adminUserId },
      { name: 'Sofia Ramírez Vega', contactInfo: 'sofia.ramirez@tech.com | +51 991 234 567', email: 'sofia.ramirez@tech.com', whatsappPrimary: '+51991234567', userId: adminUserId },
      { name: 'Roberto Silva Torres', contactInfo: 'roberto.silva@negocios.pe | +51 989 876 543', email: 'roberto.silva@negocios.pe', whatsappPrimary: '+51989876543', userId: adminUserId },
      { name: 'Carmen Flores Huamán', contactInfo: 'carmen.flores@gmail.com | +51 987 765 432', email: 'carmen.flores@gmail.com', whatsappPrimary: '+51987765432', userId: adminUserId },
      { name: 'Diego Morales Castro', contactInfo: 'diego.morales@startup.io | +51 995 432 198', email: 'diego.morales@startup.io', whatsappPrimary: '+51995432198', userId: adminUserId },
      { name: 'Ana Lucía Perez', contactInfo: 'analucia.p@corporativo.pe | +51 992 345 678', email: 'analucia.p@corporativo.pe', whatsappPrimary: '+51992345678', userId: adminUserId },
      { name: 'Miguel Ángel Rojas', contactInfo: 'miguel.rojas@pyme.com | +51 988 123 987', email: 'miguel.rojas@pyme.com', whatsappPrimary: '+51988123987', userId: adminUserId },
      { name: 'Patricia Gonzales Díaz', contactInfo: 'patricia.gd@consultora.pe | +51 993 567 890', email: 'patricia.gd@consultora.pe', whatsappPrimary: '+51993567890', userId: adminUserId },
      { name: 'Fernando Vargas León', contactInfo: 'fernando.vargas@legal.pe | +51 990 234 567', email: 'fernando.vargas@legal.pe', whatsappPrimary: '+51990234567', userId: adminUserId },
    ];

    const createdClients = [];
    for (const clientData of clientsData) {
      const [newClient] = await db.insert(clients)
        .values(clientData)
        .returning();
      createdClients.push(newClient);
      console.log(`✅ Cliente creado: ${newClient.name}`);
    }

    console.log('\n📁 Creando casos y procesos...\n');

    // Create diverse cases with different phases and progress
    const casesData = [
      {
        clientId: createdClients[0].id,
        title: 'Demanda Laboral - Despido Arbitrario',
        description: 'Caso de despido sin causa justa. Cliente trabajó 5 años en empresa de retail.',
        status: 'active',
        phase: 'investigation',
        completion: 45,
        documents: ['Contrato de trabajo', 'Carta de despido', 'Boletas de pago']
      },
      {
        clientId: createdClients[1].id,
        title: 'Divorcio por Causal de Separación de Hecho',
        description: 'Separación de hecho por más de 2 años. Incluye régimen patrimonial.',
        status: 'active',
        phase: 'strategy',
        completion: 60,
        documents: ['Acta de matrimonio', 'Constancia de domicilio', 'Escritura de bienes']
      },
      {
        clientId: createdClients[2].id,
        title: 'Constitución de Empresa Tech Startup',
        description: 'Constitución de SAS para startup tecnológica con 3 socios.',
        status: 'active',
        phase: 'meeting',
        completion: 75,
        documents: ['Estatutos', 'Minuta', 'DNI socios']
      },
      {
        clientId: createdClients[3].id,
        title: 'Impugnación de Resolución Administrativa',
        description: 'Recurso contra SUNAT por reparos tributarios del ejercicio 2023.',
        status: 'review',
        phase: 'followup',
        completion: 85,
        documents: ['Resolución SUNAT', 'Estados financieros', 'Declaraciones juradas']
      },
      {
        clientId: createdClients[4].id,
        title: 'Desalojo por Ocupación Precaria',
        description: 'Recuperación de inmueble ocupado sin título. Propiedad en Miraflores.',
        status: 'active',
        phase: 'client-info',
        completion: 20,
        documents: ['Título de propiedad', 'Certificado registral']
      },
      {
        clientId: createdClients[5].id,
        title: 'Contrato de Inversión - Serie A',
        description: 'Negociación de inversión $500K USD para startup fintech.',
        status: 'active',
        phase: 'investigation',
        completion: 35,
        documents: ['Term sheet', 'Due diligence report', 'Cap table']
      },
      {
        clientId: createdClients[6].id,
        title: 'Acción de Amparo - Derechos Fundamentales',
        description: 'Vulneración de derecho al trabajo por actos discriminatorios.',
        status: 'pending',
        phase: 'strategy',
        completion: 50,
        documents: ['Memoriales', 'Pruebas documentales', 'Testimoniales']
      },
      {
        clientId: createdClients[7].id,
        title: 'Liquidación de Sociedad Conyugal',
        description: 'Liquidación patrimonial post-divorcio con 3 inmuebles.',
        status: 'closed',
        phase: 'followup',
        completion: 100,
        documents: ['Sentencia', 'Tasaciones', 'Acuerdo de liquidación']
      },
      {
        clientId: createdClients[8].id,
        title: 'Inscripción de Marca Comercial',
        description: 'Registro de marca "TechSolutions" en clase 35 y 42.',
        status: 'active',
        phase: 'meeting',
        completion: 70,
        documents: ['Solicitud INDECOPI', 'Logo', 'Comprobante de pago']
      },
      {
        clientId: createdClients[9].id,
        title: 'Proceso Penal - Estafa y Defraudación',
        description: 'Defensa en proceso penal. Cliente acusado de estafa agravada.',
        status: 'active',
        phase: 'investigation',
        completion: 40,
        documents: ['Denuncia', 'Declaración instructiva', 'Pruebas de descargo']
      },
    ];

    for (let i = 0; i < casesData.length; i++) {
      const caseData = casesData[i];
      
      // Create case
      const [newCase] = await db.insert(cases)
        .values({
          title: caseData.title,
          description: caseData.description,
          status: caseData.status,
          clientId: caseData.clientId,
          userId: adminUserId,
        })
        .returning();

      console.log(`✅ Caso creado: ${newCase.title}`);

      // Create process state
      const possiblePhases = ['client-info', 'investigation', 'strategy', 'meeting', 'followup'];
      await db.insert(caseProcessState)
        .values({
          caseId: newCase.id,
          currentPhase: possiblePhases[Math.floor(Math.random() * possiblePhases.length)],
          completionPercentage: String(Math.floor(Math.random() * 100)),
          clientInfo: {},
          investigationProgress: {},
          caseStrategy: {},
          clientMeeting: {},
        });

      // Create documents
      for (const docName of caseData.documents) {
        await db.insert(caseDocuments)
          .values({
            caseId: newCase.id,
            filename: docName,
            fileType: 'application/pdf',
            category: 'legal',
            uploadDate: new Date(),
          });
      }

      console.log(`   📄 ${caseData.documents.length} documentos agregados`);
    }

    console.log('\n✅ Datos de ejemplo creados exitosamente!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - ${createdClients.length} clientes creados`);
    console.log(`   - ${casesData.length} casos creados`);
    console.log(`   - Estados de proceso: client-info, investigation, strategy, meeting, followup`);
    console.log(`   - Completitud: 20% - 100%`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedData();
