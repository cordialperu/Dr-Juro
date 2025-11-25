// Script para crear datos de demostración usando la API de Vercel
import fetch from 'node-fetch';

const API_URL = 'https://dr-juro-v5.vercel.app';

async function createDemoData() {
  console.log('🌱 Creando datos de demostración en producción...\n');

  try {
    // 1. Crear usuario demo y obtener token
    console.log('1️⃣  Creando usuario demo...');
    let authToken;
    
    try {
      const loginResponse = await fetch(`${API_URL}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'demo',
          password: 'demo123456'
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        authToken = loginData.token;
        console.log('✅ Usuario demo ya existe, usando credenciales existentes');
      } else {
        throw new Error('Usuario no existe, creándolo...');
      }
    } catch {
      const registerResponse = await fetch(`${API_URL}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'demo',
          password: 'demo123456'
        })
      });

      if (!registerResponse.ok) {
        throw new Error('Error al crear usuario demo');
      }

      const registerData = await registerResponse.json();
      authToken = registerData.token;
      console.log('✅ Usuario demo creado exitosamente');
    }

    console.log(`   Usuario: demo`);
    console.log(`   Contraseña: demo123456\n`);

    // 2. Crear los 3 clientes
    console.log('2️⃣  Creando clientes de demostración...');
    
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
        notes: 'Cliente corporativo importante. Caso de responsabilidad civil por defectos en obra. Prioridad alta.'
      },
      {
        name: 'Carlos Antonio Mendoza Pérez',
        email: 'carlos.mendoza@email.com',
        whatsappPrimary: '998877665',
        imputadoDni: '12345678',
        imputadoName: 'Roberto Mendoza Torres',
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
        notes: 'Cliente con caso penal. El imputado es su hijo. Requiere seguimiento constante.'
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
        notes: 'Caso de despido arbitrario. Cliente muy colaboradora. Documentación completa.'
      }
    ];

    const createdClients = [];
    for (const clientData of clientsData) {
      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`❌ Error creando cliente ${clientData.name}:`, error);
        continue;
      }

      const client = await response.json();
      createdClients.push(client);
      console.log(`✅ Cliente creado: ${client.name}`);
    }

    console.log(`\n✅ Seed completado exitosamente!`);
    console.log(`\n📊 Resumen:`);
    console.log(`   - Usuario: demo / demo123456`);
    console.log(`   - Clientes creados: ${createdClients.length}`);
    console.log(`\n🌐 Accede en: ${API_URL}`);
    console.log(`\n🎉 ¡Los datos de demostración están listos para usar!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createDemoData();
