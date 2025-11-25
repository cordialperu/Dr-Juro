import { db } from '../server/db.ts';
import { users, clients, cases, tasks, notes, caseActivity } from '../shared/schema.ts';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seedDemoData() {
  console.log('🌱 Iniciando seed de datos de demostración...');

  try {
    // 1. Crear usuario demo si no existe
    const demoUsername = 'demo';
    const demoPassword = 'demo123456';
    
    let demoUser = await db.select().from(users).where(eq(users.username, demoUsername)).limit(1);
    
    if (demoUser.length === 0) {
      console.log('📝 Creando usuario demo...');
      const hashedPassword = await bcrypt.hash(demoPassword, 10);
      const [newUser] = await db.insert(users).values({
        username: demoUsername,
        password: hashedPassword,
        role: 'abogado'
      }).returning();
      demoUser = [newUser];
      console.log('✅ Usuario demo creado:', demoUsername);
    } else {
      console.log('✅ Usuario demo ya existe:', demoUsername);
    }

    const userId = demoUser[0].id;

    // 2. Crear 3 clientes completos
    const clientsData = [
      {
        name: 'María Elena Rodríguez Salazar',
        email: 'maria.rodriguez@constructora-limasa.com',
        whatsappPrimary: '987654321',
        imputadoDni: '45678912',
        assistantName: 'Carmen Patricia López',
        whatsappAssistant: '912345678',
        emailAssistant: 'carmen.lopez@constructora-limasa.com',
        contactInfo: 'Gerente General de Constructora Lima SAC',
        notifyClient: 'true',
        notifyAssistant: 'true',
        notifyImputado: 'false',
        notes: 'Cliente corporativo importante. Caso de responsabilidad civil por defectos en obra. Prioridad alta.',
        preferredContactMethod: 'whatsapp',
        timezone: 'America/Lima',
        language: 'es'
      },
      {
        name: 'Carlos Antonio Mendoza Pérez',
        email: 'carlos.mendoza@email.com',
        whatsappPrimary: '998877665',
        imputadoDni: '12345678',
        imputadoName: 'Roberto Mendoza Torres',
        imputadoDni: '23456789',
        imputadoRelation: 'Hijo',
        imputadoContact: '987123456',
        imputadoEmail: 'roberto.mendoza@email.com',
        assistantName: 'Ana María Flores',
        whatsappAssistant: '923456789',
        emailAssistant: 'ana.flores@email.com',
        contactInfo: 'Empresario textil. Caso penal familiar.',
        notifyClient: 'true',
        notifyAssistant: 'true',
        notifyImputado: 'true',
        notes: 'Cliente con caso penal. El imputado es su hijo. Requiere seguimiento constante.',
        preferredContactMethod: 'whatsapp',
        timezone: 'America/Lima',
        language: 'es'
      },
      {
        name: 'Patricia Sofía Valverde Castro',
        email: 'patricia.valverde@medicalcenter.pe',
        whatsappPrimary: '945678123',
        imputadoDni: '34567890',
        assistantName: 'Jorge Luis Ramírez',
        whatsappAssistant: '934567812',
        emailAssistant: 'jorge.ramirez@medicalcenter.pe',
        contactInfo: 'Directora de Clínica Médica. Caso laboral.',
        notifyClient: 'true',
        notifyAssistant: 'true',
        notifyImputado: 'false',
        notes: 'Caso de despido arbitrario. Cliente muy colaboradora. Documentación completa.',
        preferredContactMethod: 'email',
        timezone: 'America/Lima',
        language: 'es'
      }
    ];

    console.log('👥 Creando clientes de demostración...');
    const createdClients = [];

    for (const clientData of clientsData) {
      const [client] = await db.insert(clients).values({
        ...clientData,
        userId
      }).returning();
      createdClients.push(client);
      console.log(`✅ Cliente creado: ${client.name}`);
    }

    // 3. Crear casos para cada cliente
    const casesData = [
      {
        clientId: createdClients[0].id,
        userId,
        title: 'Responsabilidad Civil por Defectos en Construcción',
        description: 'Demanda por responsabilidad civil extracontractual debido a defectos estructurales graves en edificio residencial. Los habitantes reportan fisuras en muros y problemas de filtraciones. Se requiere peritaje técnico y evaluación de daños.',
        status: 'active',
        category: 'civil',
        priority: 'high',
        tags: JSON.stringify(['urgente', 'construcción', 'pericial'])
      },
      {
        clientId: createdClients[0].id,
        userId,
        title: 'Oposición a Medida Cautelar',
        description: 'La contraparte ha solicitado embargo preventivo sobre bienes de la empresa. Se prepara oposición fundamentada en falta de verosimilitud del derecho y ausencia de peligro en la demora.',
        status: 'active',
        category: 'civil',
        priority: 'critical',
        tags: JSON.stringify(['cautelar', 'urgente', 'embargo'])
      },
      {
        clientId: createdClients[1].id,
        userId,
        title: 'Defensa Penal - Delito Contra la Fe Pública',
        description: 'Proceso penal por presunta falsificación de documentos privados. El imputado (Roberto Mendoza Torres) fue acusado de alterar contratos comerciales. Se está preparando la estrategia de defensa basada en falta de dolo y error en la identificación del autor.',
        status: 'active',
        category: 'penal',
        priority: 'high',
        tags: JSON.stringify(['penal', 'falsificación', 'audiencia'])
      },
      {
        clientId: createdClients[2].id,
        userId,
        title: 'Despido Arbitrario - Reposición Laboral',
        description: 'Demanda de reposición por despido sin causa justa de trabajadora con fuero maternal. La empleada fue despedida estando embarazada sin seguir el procedimiento legal correspondiente. Se busca la reposición inmediata y el pago de remuneraciones dejadas de percibir.',
        status: 'active',
        category: 'laboral',
        priority: 'high',
        tags: JSON.stringify(['laboral', 'reposición', 'fuero maternal'])
      },
      {
        clientId: createdClients[2].id,
        userId,
        title: 'Cobro de Beneficios Sociales',
        description: 'Demanda adicional por cobro de CTS, gratificaciones y vacaciones no pagadas. Montos en litigio ascienden a S/ 85,000. Se cuenta con toda la documentación probatoria.',
        status: 'pending',
        category: 'laboral',
        priority: 'medium',
        tags: JSON.stringify(['laboral', 'CTS', 'beneficios'])
      }
    ];

    console.log('📁 Creando casos/expedientes...');
    const createdCases = [];

    for (const caseData of casesData) {
      const [case_] = await db.insert(cases).values(caseData).returning();
      createdCases.push(case_);
      console.log(`✅ Caso creado: ${case_.title}`);
    }

    // 4. Crear tareas para los casos
    const tasksData = [
      {
        title: 'Solicitar Peritaje Técnico Estructural',
        description: 'Contactar con ingeniero civil colegiado para peritaje del edificio. Programar visita de inspección.',
        status: 'pending',
        priority: 'high',
        caseId: createdCases[0].id,
        assignedTo: userId,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 días
      },
      {
        title: 'Preparar Oposición a Medida Cautelar',
        description: 'Redactar escrito de oposición fundamentado. Adjuntar estados financieros de la empresa.',
        status: 'pending',
        priority: 'critical',
        caseId: createdCases[1].id,
        assignedTo: userId,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 días
      },
      {
        title: 'Preparar Alegatos para Audiencia',
        description: 'Preparación de alegatos de apertura y cierre. Revisar jurisprudencia sobre falsificación documentaria.',
        status: 'in-progress',
        priority: 'high',
        caseId: createdCases[2].id,
        assignedTo: userId,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 días
      },
      {
        title: 'Reunión con Cliente y Testigos',
        description: 'Coordinar reunión preparatoria con cliente y dos testigos clave del caso laboral.',
        status: 'pending',
        priority: 'medium',
        caseId: createdCases[3].id,
        assignedTo: userId,
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 días
      },
      {
        title: 'Presentar Demanda de Beneficios Sociales',
        description: 'Elaborar y presentar demanda ante Juzgado Laboral. Adjuntar boletas y contratos.',
        status: 'pending',
        priority: 'medium',
        caseId: createdCases[4].id,
        assignedTo: userId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      }
    ];

    console.log('✅ Creando tareas...');
    for (const taskData of tasksData) {
      await db.insert(tasks).values(taskData);
      console.log(`✅ Tarea creada: ${taskData.title}`);
    }

    // 5. Crear notas para los casos
    const notesData = [
      {
        caseId: createdCases[0].id,
        title: 'Contacto con Perito Ingeniero',
        content: 'El Ing. José Torres (Cel: 987-654-123) confirmó disponibilidad para realizar el peritaje. Costo estimado: S/ 8,500. Plazo de entrega: 15 días hábiles.',
        tags: JSON.stringify(['peritaje', 'importante']),
        isPinned: 'true',
        createdBy: userId
      },
      {
        caseId: createdCases[1].id,
        title: 'Estrategia Procesal - Cautelar',
        content: 'Argumentos clave: 1) Falta de verosimilitud del derecho invocado, 2) Solvencia económica demostrada de la empresa, 3) Inexistencia de riesgo de insolvencia. Adjuntar estados financieros auditados de los últimos 3 años.',
        tags: JSON.stringify(['estrategia', 'urgente']),
        isPinned: 'true',
        createdBy: userId
      },
      {
        caseId: createdCases[2].id,
        title: 'Jurisprudencia Relevante',
        content: 'Cas. N° 1234-2022: Para configurar el delito de falsificación se requiere dolo específico y ánimo de perjudicar. La simple modificación sin intención defraudatoria no constituye delito. Usar como precedente en alegatos.',
        tags: JSON.stringify(['jurisprudencia', 'penal']),
        isPinned: 'true',
        createdBy: userId
      },
      {
        caseId: createdCases[3].id,
        title: 'Pruebas del Embarazo',
        content: 'Cliente presentó: 1) Certificado médico de embarazo (8 semanas), 2) Comunicación a empleador del estado de gestación, 3) Carta de despido (posterior a comunicación). Todo está en orden para fundamentar la protección del fuero maternal.',
        tags: JSON.stringify(['pruebas', 'fuero maternal']),
        isPinned: 'false',
        createdBy: userId
      }
    ];

    console.log('📝 Creando notas...');
    for (const noteData of notesData) {
      await db.insert(notes).values(noteData);
      console.log(`✅ Nota creada: ${noteData.title}`);
    }

    // 6. Crear actividad en los casos
    const activitiesData = [
      {
        caseId: createdCases[0].id,
        activityType: 'document_uploaded',
        description: 'Informe técnico preliminar subido',
        metadata: JSON.stringify({ fileName: 'informe_preliminar.pdf' }),
        performedBy: userId
      },
      {
        caseId: createdCases[0].id,
        activityType: 'note_added',
        description: 'Nota agregada: Contacto con Perito Ingeniero',
        performedBy: userId
      },
      {
        caseId: createdCases[2].id,
        activityType: 'phase_completed',
        description: 'Fase de investigación completada',
        performedBy: userId
      }
    ];

    console.log('🔔 Creando actividad en casos...');
    for (const activityData of activitiesData) {
      await db.insert(caseActivity).values(activityData);
    }

    console.log('\n🎉 ¡Seed completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Usuario: ${demoUsername} / ${demoPassword}`);
    console.log(`   - Clientes: ${createdClients.length}`);
    console.log(`   - Casos: ${createdCases.length}`);
    console.log(`   - Tareas: ${tasksData.length}`);
    console.log(`   - Notas: ${notesData.length}`);
    console.log(`   - Actividades: ${activitiesData.length}`);
    console.log('\n✅ La base de datos de producción ahora tiene datos de demostración completos.');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

// Ejecutar el seed
seedDemoData()
  .then(() => {
    console.log('✅ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
