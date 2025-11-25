import 'dotenv/config';
import { pool } from '../server/db';
import * as bcrypt from 'bcryptjs';

async function setupDemoClients() {
  try {
    console.log('🎯 Configurando 3 clientes de demostración completos...\n');

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

    // CLIENTE 1: CASO CONCLUIDO - María del Carmen Rodríguez
    console.log('📋 CLIENTE 1: CASO CONCLUIDO');
    console.log('============================');
    
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
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [userId]);

    const client1Id = client1Result.rows[0]?.id;
    if (client1Id) {
      console.log(`✅ Cliente creado: ${client1Id}`);
      
      // Crear caso concluido
      await pool.query(`
        INSERT INTO cases (
          id, client_id, user_id, title, description, 
          status, category, priority, tags
        ) VALUES (
          gen_random_uuid(),
          $1, $2,
          'Demanda Laboral - Despido Arbitrario',
          'Caso de despido injustificado en contra de Empresa Constructora ABC SAC. El cliente fue despedido sin causa justa después de 8 años de servicio. Se logró sentencia favorable con indemnización completa.',
          'closed',
          'laboral',
          'high',
          '["concluido", "sentencia firme", "indemnización"]'::jsonb
        )
        ON CONFLICT DO NOTHING
      `, [client1Id, userId]);
      
      // Crear proceso legal V2 completado
      await pool.query(`
        INSERT INTO legal_process_v2 (client_id, data)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (client_id) DO UPDATE SET data = $2::jsonb
      `, [client1Id, JSON.stringify({
        currentPhase: 'seguimiento',
        completionPercentage: 100,
        clientInfo: {
          name: 'María del Carmen Rodríguez Pérez',
          phone: '+51987123456',
          email: 'maria.rodriguez@corporativo.pe',
          caseType: 'laboral',
          caseDescription: 'Despido arbitrario - 8 años de antigüedad'
        },
        investigation: {
          policeReports: ['Acta de despido', 'Contratos laborales', 'Boletas de pago'],
          notifications: ['Carta de despido'],
          additionalDocs: ['Testimonio de testigos', 'Correos electrónicos'],
          summary: 'Se recopiló evidencia contundente del despido sin causa justa.'
        },
        strategy: {
          legalBasis: 'Ley de Productividad y Competitividad Laboral - Art. 38° (Despido Arbitrario)',
          arguments: [
            'Ausencia de causa justa de despido',
            'Incumplimiento del debido procedimiento',
            'Antigüedad de 8 años comprobada'
          ],
          precedents: ['Casación N° 1206-2018-Lima', 'Casación N° 988-2017-Callao'],
          estimatedDuration: '12 meses',
          estimatedCost: 'S/18,000'
        },
        meeting: {
          scheduledDate: '2024-03-15T10:00:00.000Z',
          location: 'Oficina Dr. Juro',
          agenda: 'Revisión de estrategia legal y documentación',
          completed: true
        },
        followup: {
          tasks: [
            { id: '1', title: 'Presentar demanda', completed: true, completedAt: '2024-03-20' },
            { id: '2', title: 'Audiencia de conciliación', completed: true, completedAt: '2024-05-10' },
            { id: '3', title: 'Audiencia de juzgamiento', completed: true, completedAt: '2024-08-15' },
            { id: '4', title: 'Sentencia primera instancia', completed: true, completedAt: '2024-09-30' },
            { id: '5', title: 'Sentencia firme', completed: true, completedAt: '2024-10-25' }
          ],
          hearings: [
            { date: '2024-05-10', type: 'Conciliación', result: 'Sin acuerdo' },
            { date: '2024-08-15', type: 'Juzgamiento', result: 'Declarado fundado' }
          ],
          outcome: 'SENTENCIA FAVORABLE - Indemnización S/45,000'
        },
        financial: {
          budget: 18000,
          paid: 18000,
          pending: 0,
          paymentHistory: [
            { date: '2024-03-10', amount: 5000, concept: 'Adelanto inicial' },
            { date: '2024-06-15', amount: 8000, concept: 'Pago intermedio' },
            { date: '2024-10-30', amount: 5000, concept: 'Pago final' }
          ]
        }
      })]);
      
      console.log('   ✅ Caso concluido creado');
      console.log('   📊 Estado: CONCLUIDO - Sentencia favorable');
      console.log('   💰 Presupuesto: S/18,000 (100% pagado)');
    }

    console.log('\n📋 CLIENTE 2: CASO EN PROCESO - FASE ESTRATEGIA');
    console.log('===============================================');
    
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
        'Caso activo. Proceso penal por apropiación ilícita. Actualmente en fase de estrategia de defensa.'
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [userId]);

    const client2Id = client2Result.rows[0]?.id;
    if (client2Id) {
      console.log(`✅ Cliente creado: ${client2Id}`);
      
      await pool.query(`
        INSERT INTO cases (
          id, client_id, user_id, title, description,
          status, category, priority, tags
        ) VALUES (
          gen_random_uuid(),
          $1, $2,
          'Proceso Penal - Apropiación Ilícita',
          'Proceso penal por presunta apropiación ilícita de S/120,000 en bienes de empresa. Cliente niega los cargos y presenta evidencia de su inocencia. En fase de preparación de estrategia de defensa.',
          'active',
          'penal',
          'critical',
          '["en proceso", "apropiación ilícita", "defensa"]'::jsonb
        )
        ON CONFLICT DO NOTHING
      `, [client2Id, userId]);
      
      await pool.query(`
        INSERT INTO legal_process_v2 (client_id, data)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (client_id) DO UPDATE SET data = $2::jsonb
      `, [client2Id, JSON.stringify({
        currentPhase: 'estrategia',
        completionPercentage: 45,
        clientInfo: {
          name: 'Carlos Alberto Mendoza Silva',
          phone: '+51998765432',
          email: 'carlos.mendoza@gmail.com',
          caseType: 'penal',
          caseDescription: 'Apropiación ilícita - Defensa penal'
        },
        investigation: {
          policeReports: ['Denuncia policial', 'Atestado policial'],
          notifications: ['Citación fiscal', 'Notificación de investigación'],
          additionalDocs: ['Contratos de trabajo', 'Correos corporativos', 'Extractos bancarios'],
          summary: 'Se ha recopilado evidencia documental que demuestra la buena fe del cliente y el uso legítimo de los fondos según su función empresarial.'
        },
        strategy: {
          legalBasis: 'Código Penal Art. 190° - Apropiación Ilícita / Estrategia de defensa por ausencia de dolo',
          arguments: [
            'Ausencia de ánimo de apropiación',
            'Autorización implícita para uso de fondos',
            'Errores contables de la empresa',
            'Buena fe del imputado'
          ],
          precedents: [
            'Casación N° 555-2018-Piura (Diferencia entre apropiación y error contable)',
            'R.N. N° 2425-2017-Lima Norte (Elemento subjetivo del tipo)'
          ],
          estimatedDuration: '18-24 meses',
          estimatedCost: 'S/35,000'
        },
        meeting: {
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
          location: 'Oficina Dr. Juro - Sala de reuniones',
          agenda: 'Revisión final de estrategia y preparación de escritos de defensa',
          completed: false
        },
        followup: {
          tasks: [
            { id: '1', title: 'Recopilación de pruebas documentales', completed: true, completedAt: new Date().toISOString() },
            { id: '2', title: 'Análisis de elementos del tipo penal', completed: true, completedAt: new Date().toISOString() },
            { id: '3', title: 'Preparación de teoría del caso', completed: false },
            { id: '4', title: 'Redacción de escrito de defensa', completed: false },
            { id: '5', title: 'Audiencia preliminar', completed: false }
          ],
          hearings: [],
          outcome: 'En proceso'
        },
        financial: {
          budget: 35000,
          paid: 15000,
          pending: 20000,
          paymentHistory: [
            { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), amount: 10000, concept: 'Adelanto inicial' },
            { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), amount: 5000, concept: 'Pago por avance de investigación' }
          ]
        }
      })]);
      
      console.log('   ✅ Caso activo creado');
      console.log('   📊 Estado: EN PROCESO - Fase de estrategia (45%)');
      console.log('   💰 Presupuesto: S/35,000 (S/15,000 pagado, S/20,000 pendiente)');
    }

    console.log('\n📋 CLIENTE 3: CASO EN PROCESO - FASE INVESTIGACIÓN');
    console.log('===================================================');
    
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
        'Caso nuevo. Demanda civil por responsabilidad contractual. En fase inicial de investigación y recopilación de pruebas.'
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [userId]);

    const client3Id = client3Result.rows[0]?.id;
    if (client3Id) {
      console.log(`✅ Cliente creado: ${client3Id}`);
      
      await pool.query(`
        INSERT INTO cases (
          id, client_id, user_id, title, description,
          status, category, priority, tags
        ) VALUES (
          gen_random_uuid(),
          $1, $2,
          'Demanda Civil - Responsabilidad Contractual',
          'Demanda civil contra constructora por incumplimiento de contrato de obra. Vivienda con defectos estructurales graves. Daños estimados en S/180,000. En proceso de recopilación de peritajes técnicos.',
          'active',
          'civil',
          'high',
          '["en proceso", "responsabilidad contractual", "construcción"]'::jsonb
        )
        ON CONFLICT DO NOTHING
      `, [client3Id, userId]);
      
      await pool.query(`
        INSERT INTO legal_process_v2 (client_id, data)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (client_id) DO UPDATE SET data = $2::jsonb
      `, [client3Id, JSON.stringify({
        currentPhase: 'investigacion',
        completionPercentage: 25,
        clientInfo: {
          name: 'Ana Sofía Torres Vega',
          phone: '+51987654321',
          email: 'ana.torres@outlook.com',
          caseType: 'civil',
          caseDescription: 'Responsabilidad contractual - Defectos en construcción'
        },
        investigation: {
          policeReports: [],
          notifications: ['Carta notarial a constructora', 'Respuesta de constructora (negativa)'],
          additionalDocs: [
            'Contrato de compra-venta',
            'Contrato de construcción',
            'Comprobantes de pago',
            'Fotografías de defectos',
            'Informe preliminar de ingeniero'
          ],
          summary: 'Se está recopilando evidencia técnica. Perito estructural confirmó deficiencias graves: fisuras en muros, filtraciones, instalaciones defectuosas. Se requiere peritaje oficial valuatorio.'
        },
        strategy: {
          legalBasis: 'Código Civil Art. 1321° - Responsabilidad Contractual / Art. 1762° - Saneamiento por vicios ocultos',
          arguments: [
            'Incumplimiento de especificaciones técnicas del contrato',
            'Defectos estructurales que afectan habitabilidad',
            'Daños materiales y morales al cliente',
            'Responsabilidad solidaria de constructora y supervisor'
          ],
          precedents: [
            'Casación N° 3871-2017-Lima (Vicios ocultos en construcción)',
            'Casación N° 1902-2016-Lima Norte (Responsabilidad del constructor)'
          ],
          estimatedDuration: '24-36 meses',
          estimatedCost: 'S/28,000'
        },
        meeting: {
          scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 días
          location: 'Oficina Dr. Juro',
          agenda: 'Revisión de avances de investigación y contratación de perito oficial',
          completed: false
        },
        followup: {
          tasks: [
            { id: '1', title: 'Recopilación de contratos y comprobantes', completed: true, completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
            { id: '2', title: 'Inspección ocular de inmueble', completed: true, completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { id: '3', title: 'Contratación de perito ingeniero estructural', completed: false },
            { id: '4', title: 'Peritaje valuatorio oficial', completed: false },
            { id: '5', title: 'Redacción y presentación de demanda', completed: false }
          ],
          hearings: [],
          outcome: 'En investigación'
        },
        financial: {
          budget: 28000,
          paid: 8000,
          pending: 20000,
          paymentHistory: [
            { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), amount: 8000, concept: 'Adelanto inicial para investigación' }
          ]
        }
      })]);
      
      console.log('   ✅ Caso activo creado');
      console.log('   📊 Estado: EN PROCESO - Fase de investigación (25%)');
      console.log('   💰 Presupuesto: S/28,000 (S/8,000 pagado, S/20,000 pendiente)');
    }

    console.log('\n✅ ¡3 clientes de demostración creados exitosamente!');
    console.log('\n📊 RESUMEN:');
    console.log('============');
    console.log('1️⃣  María del Carmen Rodríguez - CASO CONCLUIDO (100%)');
    console.log('   Laboral - Despido arbitrario - Sentencia favorable');
    console.log('');
    console.log('2️⃣  Carlos Alberto Mendoza - EN ESTRATEGIA (45%)');
    console.log('   Penal - Apropiación ilícita - Preparando defensa');
    console.log('');
    console.log('3️⃣  Ana Sofía Torres - EN INVESTIGACIÓN (25%)');
    console.log('   Civil - Responsabilidad contractual - Recopilando pruebas');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupDemoClients();
