const fetch = require('node-fetch');

// Cambiar esta URL por la URL de producción de Render después del despliegue
const BASE_URL = process.env.APP_URL || 'http://localhost:5000';
const USERNAME = 'demo';
const PASSWORD = 'demo123456';

async function registerUser() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Usuario demo creado');
      return data.token;
    } else if (response.status === 409) {
      // Usuario ya existe, intentar login
      console.log('ℹ️  Usuario demo ya existe, iniciando sesión...');
      return await login();
    } else {
      throw new Error(`Register failed: ${response.statusText}`);
    }
  } catch (error) {
    console.log('⚠️  Error en registro, intentando login:', error.message);
    return await login();
  }
}

async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

async function getClients(token) {
  const response = await fetch(`${BASE_URL}/api/clients`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get clients: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

async function createCase(token, clientId, caseData) {
  const response = await fetch(`${BASE_URL}/api/clients/${clientId}/cases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(caseData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create case: ${response.statusText} - ${error}`);
  }

  const data = await response.json();
  return data.data;
}

async function createTask(token, clientId, taskData) {
  const response = await fetch(`${BASE_URL}/api/clients/${clientId}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create task: ${response.statusText} - ${error}`);
  }

  const data = await response.json();
  return data.data;
}

async function createChatMessage(token, clientId, messageData) {
  const response = await fetch(`${BASE_URL}/api/chat/${clientId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(messageData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create chat message: ${response.statusText} - ${error}`);
  }

  const data = await response.json();
  return data.data;
}

async function createLegalProcess(token, clientId, processData) {
  const response = await fetch(`${BASE_URL}/api/legal-process/${clientId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(processData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create legal process: ${response.statusText} - ${error}`);
  }

  const data = await response.json();
  return data.data;
}

async function createClient(token, clientData) {
  const response = await fetch(`${BASE_URL}/api/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(clientData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create client: ${response.statusText} - ${error}`);
  }

  const data = await response.json();
  return data;
}

async function deleteClientByName(token, clientName) {
  try {
    const response = await fetch(`${BASE_URL}/api/clients/by-name/${encodeURIComponent(clientName)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.ok) {
      console.log(`   🗑️  Cliente anterior eliminado: ${clientName}`);
    }
  } catch (error) {
    // Ignorar error si el cliente no existe
  }
}

async function main() {
  try {
    console.log('🔐 Creando usuario demo...');
    const token = await registerUser();
    console.log('✅ Autenticación exitosa\n');

    console.log('📋 Verificando clientes existentes...');
    let clients = await getClients(token);
    console.log(`   ${clients.length} clientes encontrados\n`);

    // Definir los 3 clientes demo específicos
    const demoClientsToCreate = [
      {
        name: 'María Elena Rodríguez Salazar',
        email: 'maria.rodriguez@constructora.pe',
        whatsappPrimary: '+51987654321',
        contactInfo: 'Representante Legal - Constructora Rodríguez SAC',
        notes: 'Caso de responsabilidad civil por defectos en obra. Monto en disputa: S/ 850,000'
      },
      {
        name: 'Carlos Antonio Mendoza Pérez',
        email: 'carlos.mendoza@gmail.com',
        whatsappPrimary: '+51998765432',
        contactInfo: 'Padre del imputado',
        imputadoName: 'Roberto Mendoza Fernández',
        imputadoDni: '45678901',
        imputadoRelation: 'hijo',
        imputadoContact: '+51965432109',
        notifyImputado: 'true',
        notes: 'Caso penal - investigación preparatoria por presunto delito de estafa'
      },
      {
        name: 'Patricia Sofía Valverde Castro',
        email: 'patricia.valverde@gmail.com',
        whatsappPrimary: '+51987123456',
        contactInfo: 'Médico Cirujano',
        notes: 'Despido arbitrario - 8 años de servicio en Clínica San Juan'
      }
    ];

    // Verificar si los clientes demo ya existen
    console.log('👥 Verificando clientes demo...\n');
    for (const demoClient of demoClientsToCreate) {
      const exists = clients.find(c => c.name === demoClient.name);
      if (!exists) {
        console.log(`   Creando: ${demoClient.name}`);
        const created = await createClient(token, demoClient);
        clients.push(created);
        console.log(`   ✅ Cliente creado`);
      } else {
        console.log(`   ✓ ${demoClient.name} ya existe`);
      }
    }

    console.log(`\n✅ ${clients.length} clientes disponibles para seed\n`);

    // Datos específicos para cada cliente
    const clientsData = {
      // María Elena Rodríguez Salazar - Constructora
      'María Elena Rodríguez Salazar': {
        cases: [
          {
            title: 'Responsabilidad Civil por Defectos en Obra',
            description: 'Demanda de responsabilidad civil por defectos estructurales en edificio construido. Monto en disputa: S/ 850,000',
            status: 'active',
            category: 'civil',
            priority: 'high',
            tags: ['construccion', 'responsabilidad-civil', 'urgente']
          }
        ],
        tasks: [
          {
            title: 'Revisar peritaje técnico de ingeniería',
            description: 'Analizar informe del perito independiente sobre defectos estructurales',
            status: 'in-progress',
            priority: 'high',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'Preparar contestación de demanda',
            description: 'Redactar contestación con argumentos técnicos y legales',
            status: 'pending',
            priority: 'high',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'Coordinar con aseguradora',
            description: 'Reunión con la aseguradora para cobertura de responsabilidad civil',
            status: 'pending',
            priority: 'medium',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        chatMessages: [
          {
            role: 'user',
            content: 'Buenos días, necesito orientación sobre el caso de la constructora. Nos han demandado por defectos en la obra.'
          },
          {
            role: 'assistant',
            content: 'Buenos días. He revisado su caso. Se trata de una demanda por responsabilidad civil en construcción. Necesitamos: 1) Informe técnico del perito, 2) Póliza de seguro de responsabilidad civil, 3) Contrato de obra original. ¿Cuenta con estos documentos?'
          },
          {
            role: 'user',
            content: 'Tengo el contrato y la póliza. El peritaje está en proceso.'
          },
          {
            role: 'assistant',
            content: 'Perfecto. Una vez tengamos el peritaje, prepararemos la contestación. El plazo es de 30 días. Le mantendré informada del progreso.'
          }
        ],
        legalProcess: {
          data: {
            currentPhase: 'investigation',
            phases: {
              'client-info': { status: 'completed', progress: 100 },
              'investigation': { status: 'in-progress', progress: 60 },
              'strategy': { status: 'not-started', progress: 0 },
              'meeting': { status: 'not-started', progress: 0 },
              'followup': { status: 'not-started', progress: 0 }
            }
          }
        }
      },
      // Carlos Antonio Mendoza Pérez - Caso Penal
      'Carlos Antonio Mendoza Pérez': {
        cases: [
          {
            title: 'Defensa Penal - Presunto Delito de Estafa',
            description: 'Defensa del hijo del cliente, imputado por presunto delito de estafa. Fase de investigación preparatoria.',
            status: 'active',
            category: 'penal',
            priority: 'critical',
            tags: ['penal', 'estafa', 'investigacion-preparatoria']
          }
        ],
        tasks: [
          {
            title: 'Presentar descargos ante fiscalía',
            description: 'Redactar y presentar descargos con pruebas de descargo',
            status: 'in-progress',
            priority: 'critical',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'Reunión con imputado',
            description: 'Coordinar reunión con Roberto Mendoza para declaración',
            status: 'pending',
            priority: 'high',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'Solicitar copias de actuaciones',
            description: 'Obtener copias completas de la carpeta fiscal',
            status: 'completed',
            priority: 'high',
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'Análisis de testigos de cargo',
            description: 'Revisar declaraciones de testigos y preparar contra interrogatorio',
            status: 'pending',
            priority: 'medium',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        chatMessages: [
          {
            role: 'user',
            content: 'Doctor, estoy muy preocupado. Mi hijo Roberto ha sido citado por la fiscalía.'
          },
          {
            role: 'assistant',
            content: 'Entiendo su preocupación, Sr. Mendoza. He revisado la documentación inicial. Se trata de una investigación por presunto delito de estafa. Roberto tiene derecho a guardar silencio y contar con defensa. Necesito reunirme urgentemente con él.'
          },
          {
            role: 'user',
            content: '¿Qué puede pasar? ¿Podrían detenerlo?'
          },
          {
            role: 'assistant',
            content: 'Estamos en fase de investigación preparatoria. La prisión preventiva solo se ordena si hay peligro de fuga o obstaculización. Roberto no tiene antecedentes, tiene trabajo estable y domicilio conocido. Esos son factores a nuestro favor. Prepararemos una sólida defensa técnica.'
          },
          {
            role: 'user',
            content: 'Gracias doctor. ¿Cuándo podemos reunirnos?'
          },
          {
            role: 'assistant',
            content: 'Tengo agendada una reunión para pasado mañana. Le enviaré la dirección por WhatsApp. Por favor, traiga toda la documentación relacionada con las transacciones comerciales en cuestión.'
          }
        ],
        legalProcess: {
          data: {
            currentPhase: 'strategy',
            phases: {
              'client-info': { status: 'completed', progress: 100 },
              'investigation': { status: 'completed', progress: 100 },
              'strategy': { status: 'in-progress', progress: 45 },
              'meeting': { status: 'not-started', progress: 0 },
              'followup': { status: 'not-started', progress: 0 }
            }
          }
        }
      },
      // Patricia Sofía Valverde Castro - Caso Laboral
      'Patricia Sofía Valverde Castro': {
        cases: [
          {
            title: 'Despido Arbitrario - Reposición Laboral',
            description: 'Demanda de reposición por despido arbitrario. La cliente fue despedida sin causa justificada después de 8 años de servicio.',
            status: 'active',
            category: 'laboral',
            priority: 'high',
            tags: ['laboral', 'despido-arbitrario', 'reposicion']
          }
        ],
        tasks: [
          {
            title: 'Presentar demanda de reposición',
            description: 'Redactar y presentar demanda ante juzgado laboral',
            status: 'completed',
            priority: 'high',
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'Preparar pruebas documentales',
            description: 'Organizar contratos, boletas de pago, correos y comunicaciones',
            status: 'completed',
            priority: 'high',
            dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'Audiencia de conciliación',
            description: 'Primera audiencia de conciliación con el empleador',
            status: 'pending',
            priority: 'critical',
            dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'Preparar testigos',
            description: 'Coordinar con ex compañeros de trabajo que servirán como testigos',
            status: 'in-progress',
            priority: 'medium',
            dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        chatMessages: [
          {
            role: 'user',
            content: 'Doctora, buenos días. Me han despedido sin ninguna justificación después de 8 años trabajando.'
          },
          {
            role: 'assistant',
            content: 'Buenos días, Dra. Valverde. Lamento mucho la situación. Trabajó 8 años en la clínica, ¿le dieron alguna carta de despido? ¿Le pagaron liquidación?'
          },
          {
            role: 'user',
            content: 'Sí, me dieron una carta diciendo "cese por necesidades de la empresa". Me pagaron liquidación pero creo que no calcularon bien los beneficios.'
          },
          {
            role: 'assistant',
            content: 'Ese es un despido arbitrario. En su caso, como personal de confianza con más de 5 años, tiene derecho a reposición. También revisaré el cálculo de beneficios sociales. ¿Tiene copia de sus boletas de pago y el contrato?'
          },
          {
            role: 'user',
            content: 'Tengo todo guardado. ¿Cuánto tiempo tomará el proceso?'
          },
          {
            role: 'assistant',
            content: 'En laboral los procesos son más rápidos. Entre 6 a 12 meses aproximadamente. Primero habrá audiencia de conciliación. Si no hay acuerdo, iremos a juicio. Su caso es muy sólido porque tiene documentación completa y testigos.'
          },
          {
            role: 'user',
            content: 'Perfecto. Quiero seguir adelante. ¿Cuándo presentamos la demanda?'
          },
          {
            role: 'assistant',
            content: 'Ya la presenté ayer. En 5 días aproximadamente nos notificarán la fecha de la audiencia de conciliación. Le mantendré informada de cada paso.'
          }
        ],
        legalProcess: {
          data: {
            currentPhase: 'meeting',
            phases: {
              'client-info': { status: 'completed', progress: 100 },
              'investigation': { status: 'completed', progress: 100 },
              'strategy': { status: 'completed', progress: 100 },
              'meeting': { status: 'in-progress', progress: 70 },
              'followup': { status: 'not-started', progress: 0 }
            }
          }
        }
      }
    };

    let totalCases = 0;
    let totalTasks = 0;
    let totalMessages = 0;

    for (const client of clients) {
      console.log(`\n📁 Procesando cliente: ${client.name}`);
      const clientData = clientsData[client.name];

      if (!clientData) {
        console.log(`   ⚠️  No hay datos demo para este cliente`);
        continue;
      }

      // Crear casos
      for (const caseData of clientData.cases) {
        const newCase = await createCase(token, client.id, caseData);
        console.log(`   ✅ Caso creado: ${newCase.title}`);
        totalCases++;

        // Crear tareas asociadas al caso
        for (const taskData of clientData.tasks) {
          const taskWithCase = { ...taskData, caseId: newCase.id };
          const newTask = await createTask(token, client.id, taskWithCase);
          console.log(`      ✅ Tarea creada: ${newTask.title}`);
          totalTasks++;
        }
      }

      // Crear mensajes de chat
      for (const message of clientData.chatMessages) {
        await createChatMessage(token, client.id, message);
        totalMessages++;
      }
      console.log(`   ✅ ${clientData.chatMessages.length} mensajes de chat creados`);

      // Crear proceso legal
      await createLegalProcess(token, client.id, clientData.legalProcess);
      console.log(`   ✅ Proceso legal inicializado`);

      // Pequeña pausa entre clientes
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n\n✅ ¡DATOS DEMO COMPLETOS!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Resumen:`);
    console.log(`   - Clientes procesados: ${clients.length}`);
    console.log(`   - Casos creados: ${totalCases}`);
    console.log(`   - Tareas creadas: ${totalTasks}`);
    console.log(`   - Mensajes de chat: ${totalMessages}`);
    console.log(`   - Procesos legales: ${clients.length}`);
    console.log('═══════════════════════════════════════');
    console.log('\n🌐 Acceso:');
    console.log(`   URL: ${BASE_URL}`);
    console.log(`   Usuario: ${USERNAME}`);
    console.log(`   Contraseña: ${PASSWORD}`);
    console.log('\n🎉 ¡La aplicación está lista para ser probada por los testers!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
