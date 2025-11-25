import 'dotenv/config';
import { pool } from '../server/db';

async function setupRichDemoClients() {
  try {
    console.log('🎯 Configurando 3 clientes de demostración con HISTORIAL COMPLETO y ARCHIVOS...\n');

    if (!pool) {
      console.error('❌ DATABASE_URL no está configurado en .env');
      process.exit(1);
    }

    // Obtener usuario drjuro_v5
    const userResult = await pool.query(`
      SELECT id FROM users WHERE username = 'drjuro_v5'
    `);
    
    if (userResult.rows.length === 0) {
      console.error('❌ Usuario drjuro_v5 no encontrado');
      process.exit(1);
    }

    const userId = userResult.rows[0].id;
    console.log(`✅ Usuario drjuro_v5 encontrado: ${userId}\n`);

    // ==================================================================================
    // CLIENTE 1: CASO CONCLUIDO - María del Carmen Rodríguez (Laboral)
    // ==================================================================================
    console.log('📋 CLIENTE 1: CASO CONCLUIDO (Laboral)');
    
    const client1Result = await pool.query(`
      INSERT INTO clients (
        user_id, name, email, whatsapp_primary,
        notify_client, notify_assistant, notes
      ) VALUES (
        $1,
        'María del Carmen Rodríguez Pérez',
        'maria.rodriguez@corporativo.pe',
        '+51987123456',
        'true',
        'false',
        'Caso concluido exitosamente. Demanda laboral por despido arbitrario resuelto a favor del cliente. Sentencia firme con indemnización por S/45,000.'
      )
      RETURNING id
    `, [userId]);
    const client1Id = client1Result.rows[0].id;

    // Caso
    await pool.query(`
      INSERT INTO cases (
        id, client_id, user_id, title, description, 
        status, category, priority, tags
      ) VALUES (
        gen_random_uuid(), $1, $2,
        'Demanda Laboral - Despido Arbitrario',
        'Caso de despido injustificado en contra de Empresa Constructora ABC SAC. El cliente fue despedido sin causa justa después de 8 años de servicio.',
        'closed', 'laboral', 'high',
        '["concluido", "sentencia firme", "indemnización"]'::jsonb
      )
    `, [client1Id, userId]);

    // Carpetas y Archivos
    const folders1 = [
      { name: 'Documentos Generales', phase: 'general', type: 'general' },
      { name: 'Evidencia de Despido', phase: 'investigacion', type: 'evidencia' },
      { name: 'Escritos Judiciales', phase: 'juicio', type: 'legal' },
      { name: 'Sentencia y Ejecución', phase: 'sentencia', type: 'resoluciones' }
    ];

    for (const folder of folders1) {
      const folderRes = await pool.query(`
        INSERT INTO document_folders (id, client_id, name, phase, folder_type)
        VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id
      `, [client1Id, folder.name, folder.phase, folder.type]);
      
      const folderId = folderRes.rows[0].id;

      // Archivos simulados según carpeta
      let files: string[] = [];
      if (folder.phase === 'general') files = ['DNI_MariaRodriguez.pdf', 'Contrato_Laboral_2016.pdf', 'Boletas_Pago_2023.pdf'];
      if (folder.phase === 'investigacion') files = ['Carta_Despido_Notarial.pdf', 'Constatacion_Policial.pdf', 'Correos_Jefe_RRHH.msg'];
      if (folder.phase === 'juicio') files = ['Demanda_Laboral_Cargo.pdf', 'Contestacion_Demanda.pdf', 'Alegatos_Finales.docx'];
      if (folder.phase === 'sentencia') files = ['Sentencia_1ra_Instancia.pdf', 'Sentencia_Vista_Superior.pdf', 'Resolucion_Consentida.pdf', 'Cheque_Gerencia_Indemnizacion.jpg'];

      for (const file of files) {
        await pool.query(`
          INSERT INTO client_documents (
            id, folder_id, client_id, file_name, file_path, file_type, file_size, is_processed
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, 'application/pdf', '102400', 'true'
          )
        `, [folderId, client1Id, file, `/uploads/${client1Id}/${file}`]);
      }
    }

    // Legal Process V2
    await pool.query(`
      INSERT INTO legal_process_v2 (client_id, data)
      VALUES ($1, $2::jsonb)
    `, [client1Id, JSON.stringify({
      currentPhase: 'seguimiento',
      completionPercentage: 100,
      caseStatus: {
        caseNumber: "EXP-2023-0892-L-01",
        caseType: "Laboral",
        currentStage: "Ejecución de Sentencia",
        resolutionStatus: "casacion_infundada"
      },
      participants: [
        { id: 'p1', name: 'María Rodríguez', role: 'cliente', contact: '+51987123456' },
        { id: 'p2', name: 'Constructora ABC SAC', role: 'imputado', relation: 'Ex-empleador' },
        { id: 'p3', name: 'Dr. Jorge Luis', role: 'juez', notes: 'Juzgado Laboral 14' }
      ],
      milestones: [
        { id: 'm1', instance: 'primera', title: 'Admisión de Demanda', date: '2023-04-15', description: 'Juzgado admite a trámite la demanda.' },
        { id: 'm2', instance: 'primera', title: 'Audiencia de Conciliación', date: '2023-06-20', description: 'No hubo acuerdo. Se fijan puntos controvertidos.' },
        { id: 'm3', instance: 'primera', title: 'Sentencia 1ra Instancia', date: '2023-11-10', description: 'Fundada la demanda. Ordena pago de S/ 45,000.', isVerdict: true, verdictResult: 'fundado' },
        { id: 'm4', instance: 'segunda', title: 'Sentencia de Vista', date: '2024-03-05', description: 'Confirma sentencia de primera instancia.', isVerdict: true, verdictResult: 'confirma' }
      ],
      financial: {
        honorarios: 18000,
        gastos: 2500,
        reparacionCivil: 45000,
        payments: [
          { date: '2023-03-10', amount: 5000, concept: 'Adelanto inicial' },
          { date: '2023-07-15', amount: 5000, concept: 'Pago segunda armada' },
          { date: '2024-03-20', amount: 8000, concept: 'Pago final (éxito)' }
        ]
      },
      strategy: {
        caseTheory: "Despido incausado disfrazado de término de contrato.",
        legalStrategy: "Acreditar desnaturalización de contratos modales.",
        attachments: []
      }
    })]);


    // ==================================================================================
    // CLIENTE 2: CASO POR CONCLUIR - Carlos Alberto Mendoza (Penal)
    // ==================================================================================
    console.log('📋 CLIENTE 2: CASO POR CONCLUIR (Penal)');

    const client2Result = await pool.query(`
      INSERT INTO clients (
        user_id, name, email, whatsapp_primary,
        notify_client, notify_assistant, notes
      ) VALUES (
        $1,
        'Carlos Alberto Mendoza Silva',
        'carlos.mendoza@gmail.com',
        '+51998765432',
        'true',
        'false',
        'Caso en etapa final. Juicio Oral concluido, esperando lectura de sentencia. Pronóstico reservado pero optimista.'
      )
      RETURNING id
    `, [userId]);
    const client2Id = client2Result.rows[0].id;

    await pool.query(`
      INSERT INTO cases (
        id, client_id, user_id, title, description,
        status, category, priority, tags
      ) VALUES (
        gen_random_uuid(), $1, $2,
        'Proceso Penal - Apropiación Ilícita',
        'Defensa técnica en proceso por apropiación ilícita. Juicio oral finalizado.',
        'active', 'penal', 'critical',
        '["juicio oral", "sentencia pendiente", "urgente"]'::jsonb
      )
    `, [client2Id, userId]);

    // Carpetas
    const folders2 = [
      { name: 'Carpeta Fiscal', phase: 'investigacion', type: 'fiscalia' },
      { name: 'Etapa Intermedia', phase: 'intermedia', type: 'control' },
      { name: 'Juicio Oral', phase: 'juicio', type: 'audiencias' }
    ];

    for (const folder of folders2) {
      const folderRes = await pool.query(`
        INSERT INTO document_folders (id, client_id, name, phase, folder_type)
        VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id
      `, [client2Id, folder.name, folder.phase, folder.type]);
      const folderId = folderRes.rows[0].id;

      let files: string[] = [];
      if (folder.phase === 'investigacion') files = ['Disposicion_Formalizacion.pdf', 'Declaracion_Imputado.pdf', 'Pericia_Contable_Parte.pdf'];
      if (folder.phase === 'intermedia') files = ['Acusacion_Fiscal.pdf', 'Escrito_Absolucion_Traslado.docx', 'Auto_Enjuiciamiento.pdf'];
      if (folder.phase === 'juicio') files = ['Acta_Instalacion_Juicio.pdf', 'Interrogatorio_Perito.mp3', 'Alegatos_Clausura.docx'];

      for (const file of files) {
        await pool.query(`
          INSERT INTO client_documents (
            id, folder_id, client_id, file_name, file_path, file_type, file_size, is_processed
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, 'application/pdf', '204800', 'true'
          )
        `, [folderId, client2Id, file, `/uploads/${client2Id}/${file}`]);
      }
    }

    await pool.query(`
      INSERT INTO legal_process_v2 (client_id, data)
      VALUES ($1, $2::jsonb)
    `, [client2Id, JSON.stringify({
      currentPhase: 'juicio_oral',
      completionPercentage: 90,
      caseStatus: {
        caseNumber: "EXP-2022-4421-P-02",
        caseType: "Penal",
        currentStage: "Lectura de Sentencia",
        resolutionStatus: "en_tramite",
        nextDeadline: { date: "2025-11-25", description: "Lectura de Sentencia Integral" }
      },
      participants: [
        { id: 'p1', name: 'Carlos Mendoza', role: 'imputado', contact: '+51998765432' },
        { id: 'p2', name: 'Fiscalía 4ta Penal', role: 'fiscal' },
        { id: 'p3', name: 'Empresa Logística SA', role: 'agraviado' }
      ],
      milestones: [
        { id: 'm1', instance: 'primera', title: 'Formalización Investigación', date: '2022-05-10', description: 'Fiscalía formaliza investigación preparatoria.' },
        { id: 'm2', instance: 'primera', title: 'Control de Acusación', date: '2023-02-15', description: 'Se sanea la acusación y se admiten pruebas.' },
        { id: 'm3', instance: 'primera', title: 'Inicio Juicio Oral', date: '2023-08-20', description: 'Apertura de juicio oral.' },
        { id: 'm4', instance: 'primera', title: 'Alegatos de Clausura', date: '2023-11-15', description: 'Defensa solicitó absolución por insuficiencia probatoria.' }
      ],
      financial: {
        honorarios: 35000,
        gastos: 5000,
        reparacionCivil: 0,
        payments: [
          { date: '2022-05-01', amount: 10000, concept: 'Fase Investigación' },
          { date: '2023-01-10', amount: 10000, concept: 'Etapa Intermedia' },
          { date: '2023-08-01', amount: 10000, concept: 'Juicio Oral' }
        ]
      },
      strategy: {
        caseTheory: "Error contable administrativo, no existe dolo de apropiación.",
        legalStrategy: "Desacreditar pericia oficial mediante pericia de parte.",
        attachments: []
      }
    })]);


    // ==================================================================================
    // CLIENTE 3: CASO A MITAD DE PROCESO - Ana Sofía Torres (Civil)
    // ==================================================================================
    console.log('📋 CLIENTE 3: CASO A MITAD (Civil)');

    const client3Result = await pool.query(`
      INSERT INTO clients (
        user_id, name, email, whatsapp_primary,
        notify_client, notify_assistant, notes
      ) VALUES (
        $1,
        'Ana Sofía Torres Vega',
        'ana.torres@outlook.com',
        '+51987654321',
        'true',
        'false',
        'Caso activo en etapa probatoria. Demanda por vicios ocultos en inmueble. Peritaje judicial pendiente.'
      )
      RETURNING id
    `, [userId]);
    const client3Id = client3Result.rows[0].id;

    await pool.query(`
      INSERT INTO cases (
        id, client_id, user_id, title, description,
        status, category, priority, tags
      ) VALUES (
        gen_random_uuid(), $1, $2,
        'Demanda Civil - Vicios Ocultos',
        'Demanda contra inmobiliaria por grietas estructurales en departamento de estreno.',
        'active', 'civil', 'medium',
        '["pruebas", "peritaje", "vicios ocultos"]'::jsonb
      )
    `, [client3Id, userId]);

    // Carpetas
    const folders3 = [
      { name: 'Documentación Propiedad', phase: 'general', type: 'propiedad' },
      { name: 'Etapa Postulatoria', phase: 'investigacion', type: 'demandas' },
      { name: 'Medios Probatorios', phase: 'estrategia', type: 'pruebas' }
    ];

    for (const folder of folders3) {
      const folderRes = await pool.query(`
        INSERT INTO document_folders (id, client_id, name, phase, folder_type)
        VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id
      `, [client3Id, folder.name, folder.phase, folder.type]);
      const folderId = folderRes.rows[0].id;

      let files: string[] = [];
      if (folder.phase === 'general') files = ['Partida_Registral.pdf', 'Minuta_Compraventa.pdf', 'Memoria_Descriptiva.pdf'];
      if (folder.phase === 'investigacion') files = ['Demanda_Vicios_Ocultos.pdf', 'Auto_Admisorio.pdf', 'Contestacion_Inmobiliaria.pdf'];
      if (folder.phase === 'estrategia') files = ['Informe_Tecnico_Indeci.pdf', 'Fotos_Grietas_Sala.jpg', 'Fotos_Humedad_Techo.jpg', 'Presupuesto_Reparacion.xlsx'];

      for (const file of files) {
        await pool.query(`
          INSERT INTO client_documents (
            id, folder_id, client_id, file_name, file_path, file_type, file_size, is_processed
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, 'application/pdf', '512000', 'true'
          )
        `, [folderId, client3Id, file, `/uploads/${client3Id}/${file}`]);
      }
    }

    await pool.query(`
      INSERT INTO legal_process_v2 (client_id, data)
      VALUES ($1, $2::jsonb)
    `, [client3Id, JSON.stringify({
      currentPhase: 'investigacion',
      completionPercentage: 40,
      caseStatus: {
        caseNumber: "EXP-2024-1102-C-05",
        caseType: "Civil",
        currentStage: "Audiencia de Pruebas",
        resolutionStatus: "en_tramite",
        nextDeadline: { date: "2025-12-10", description: "Inspección Judicial" }
      },
      participants: [
        { id: 'p1', name: 'Ana Torres', role: 'cliente', contact: '+51987654321' },
        { id: 'p2', name: 'Inmobiliaria Sol y Mar', role: 'imputado', relation: 'Vendedor' },
        { id: 'p3', name: 'Ing. Roberto Campos', role: 'perito', notes: 'Perito de parte' }
      ],
      milestones: [
        { id: 'm1', instance: 'primera', title: 'Presentación Demanda', date: '2024-01-15', description: 'Se interpone demanda de obligación de hacer y daños.' },
        { id: 'm2', instance: 'primera', title: 'Contestación', date: '2024-04-20', description: 'Demandada contesta negando responsabilidad.' },
        { id: 'm3', instance: 'primera', title: 'Saneamiento Procesal', date: '2024-08-05', description: 'Juez declara saneado el proceso y fija puntos controvertidos.' }
      ],
      financial: {
        honorarios: 25000,
        gastos: 3000,
        reparacionCivil: 120000,
        payments: [
          { date: '2024-01-10', amount: 8000, concept: 'Inicio de proceso' },
          { date: '2024-06-15', amount: 5000, concept: 'Audiencia saneamiento' }
        ]
      },
      strategy: {
        caseTheory: "Vicios ocultos estructurales no detectables al momento de la compra.",
        legalStrategy: "Demostrar que daños aparecieron post-entrega pero por causa constructiva.",
        attachments: []
      }
    })]);

    console.log('\n✅ ¡3 clientes de demostración con HISTORIAL COMPLETO creados!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupRichDemoClients();
