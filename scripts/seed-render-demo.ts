/**
 * Script para crear datos demo en Render
 * Usa la API de producción directamente
 */

const API_URL = "https://dr-juro-lepn.onrender.com";

interface LegalProcessV2 {
  id: string;
  type: string;
  stages: {
    [key: string]: {
      name: string;
      status: 'pending' | 'in-progress' | 'completed';
      startDate?: string;
      endDate?: string;
      notes?: string[];
      documents?: { name: string; type: string; date: string }[];
      actions?: { action: string; date: string; result?: string }[];
    };
  };
  currentStage: string;
  progress: number;
  summary?: string;
}

// Data para clientes demo
const demoClients = [
  {
    name: "María Elena Rodríguez Sánchez",
    email: "maria.rodriguez@email.com",
    whatsappPrimary: "+51 987 654 321",
    contactInfo: "Av. Javier Prado Este 4200, San Borja, Lima",
    caseType: "penal",
    legalProcessV2: {
      id: "proc-1",
      type: "penal",
      currentStage: "audiencia",
      progress: 100,
      summary: "Caso de violencia familiar - Defensa completa exitosa",
      stages: {
        "denuncia": {
          name: "Denuncia/Demanda",
          status: "completed" as const,
          startDate: "2024-06-15",
          endDate: "2024-06-20",
          notes: ["Denuncia presentada ante la Fiscalía de Familia", "Medidas de protección otorgadas"],
          documents: [
            { name: "Denuncia Policial.pdf", type: "denuncia", date: "2024-06-15" },
            { name: "Certificado Médico Legal.pdf", type: "pericia", date: "2024-06-16" }
          ],
          actions: [
            { action: "Presentación de denuncia", date: "2024-06-15", result: "Admitida" },
            { action: "Solicitud de medidas de protección", date: "2024-06-16", result: "Otorgadas" }
          ]
        },
        "investigacion": {
          name: "Investigación Preparatoria",
          status: "completed" as const,
          startDate: "2024-06-21",
          endDate: "2024-08-15",
          notes: ["Declaraciones testimoniales recabadas", "Pericias psicológicas completadas"],
          documents: [
            { name: "Declaración Testimonial 1.pdf", type: "declaracion", date: "2024-07-01" },
            { name: "Pericia Psicológica.pdf", type: "pericia", date: "2024-07-20" }
          ],
          actions: [
            { action: "Declaración de víctima", date: "2024-07-01", result: "Registrada" },
            { action: "Pericia psicológica", date: "2024-07-20", result: "Daño moderado" }
          ]
        },
        "audiencia": {
          name: "Audiencia/Juicio",
          status: "completed" as const,
          startDate: "2024-09-10",
          endDate: "2024-10-05",
          notes: ["Sentencia favorable", "Agresor condenado a 3 años de prisión suspendida"],
          documents: [
            { name: "Sentencia.pdf", type: "resolucion", date: "2024-10-05" }
          ],
          actions: [
            { action: "Audiencia de juicio oral", date: "2024-09-25", result: "Sentencia condenatoria" }
          ]
        },
        "ejecucion": {
          name: "Ejecución de Sentencia",
          status: "pending" as const,
          notes: ["Pendiente ejecución de reparación civil"]
        }
      }
    }
  },
  {
    name: "Jorge Luis Mendoza Torres",
    email: "jorge.mendoza@empresa.com",
    whatsappPrimary: "+51 956 789 012",
    contactInfo: "Jr. Las Begonias 450, San Isidro, Lima",
    caseType: "laboral",
    legalProcessV2: {
      id: "proc-2",
      type: "laboral",
      currentStage: "audiencia",
      progress: 65,
      summary: "Despido arbitrario - Demanda en curso",
      stages: {
        "demanda": {
          name: "Demanda Laboral",
          status: "completed" as const,
          startDate: "2024-08-01",
          endDate: "2024-08-15",
          notes: ["Demanda de indemnización por despido arbitrario", "Monto demandado: S/. 85,000"],
          documents: [
            { name: "Demanda Laboral.pdf", type: "demanda", date: "2024-08-01" },
            { name: "Contrato de Trabajo.pdf", type: "contrato", date: "2024-08-01" },
            { name: "Boletas de Pago.pdf", type: "probatorio", date: "2024-08-01" }
          ],
          actions: [
            { action: "Presentación de demanda", date: "2024-08-01", result: "Admitida" }
          ]
        },
        "conciliacion": {
          name: "Conciliación",
          status: "completed" as const,
          startDate: "2024-09-01",
          endDate: "2024-09-15",
          notes: ["Audiencia de conciliación fallida", "Empresa no aceptó conciliar"],
          actions: [
            { action: "Audiencia de conciliación", date: "2024-09-10", result: "No hay acuerdo" }
          ]
        },
        "audiencia": {
          name: "Audiencia de Juzgamiento",
          status: "in-progress" as const,
          startDate: "2024-10-20",
          notes: ["Próxima audiencia programada para continuación"],
          actions: [
            { action: "Audiencia inicial", date: "2024-10-20", result: "Continuación programada" }
          ]
        },
        "sentencia": {
          name: "Sentencia",
          status: "pending" as const,
          notes: ["Pendiente resolución judicial"]
        }
      }
    }
  },
  {
    name: "Ana Patricia Flores Gutiérrez",
    email: "ana.flores@gmail.com",
    whatsappPrimary: "+51 912 345 678",
    contactInfo: "Av. La Marina 2500, San Miguel, Lima",
    caseType: "civil",
    legalProcessV2: {
      id: "proc-3",
      type: "civil",
      currentStage: "demanda",
      progress: 25,
      summary: "Divorcio por causal de separación de hecho",
      stages: {
        "demanda": {
          name: "Demanda de Divorcio",
          status: "in-progress" as const,
          startDate: "2024-11-01",
          notes: ["Demanda de divorcio presentada", "División de bienes gananciales pendiente"],
          documents: [
            { name: "Demanda de Divorcio.pdf", type: "demanda", date: "2024-11-01" },
            { name: "Acta de Matrimonio.pdf", type: "civil", date: "2024-11-01" },
            { name: "Partidas de Nacimiento Hijos.pdf", type: "civil", date: "2024-11-01" }
          ],
          actions: [
            { action: "Presentación de demanda", date: "2024-11-01", result: "Admitida" }
          ]
        },
        "contestacion": {
          name: "Contestación",
          status: "pending" as const,
          notes: ["Esperando contestación del demandado"]
        },
        "audiencia": {
          name: "Audiencia de Pruebas",
          status: "pending" as const
        },
        "sentencia": {
          name: "Sentencia",
          status: "pending" as const
        }
      }
    }
  }
];

async function main() {
  console.log("🚀 Iniciando seed de datos demo en Render...\n");

  // 1. Login para obtener token
  console.log("1. Autenticando...");
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "demo", password: "demo123" })
  });

  if (!loginRes.ok) {
    console.error("❌ Error de autenticación:", await loginRes.text());
    process.exit(1);
  }

  const { token, id: userId } = await loginRes.json();
  console.log("✅ Autenticado como demo, userId:", userId);

  // 2. Crear clientes
  console.log("\n2. Creando clientes demo...\n");

  for (const clientData of demoClients) {
    console.log(`   Creando: ${clientData.name}...`);
    
    const createRes = await fetch(`${API_URL}/api/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name: clientData.name,
        email: clientData.email,
        whatsappPrimary: clientData.whatsappPrimary,
        contactInfo: clientData.contactInfo,
        caseType: clientData.caseType,
        legalProcessV2: clientData.legalProcessV2
      })
    });

    if (!createRes.ok) {
      const error = await createRes.text();
      console.error(`   ❌ Error creando ${clientData.name}:`, error);
      continue;
    }

    const created = await createRes.json();
    console.log(`   ✅ ${clientData.name} creado (ID: ${created.id})`);
  }

  // 3. Verificar clientes creados
  console.log("\n3. Verificando clientes...");
  const clientsRes = await fetch(`${API_URL}/api/clients`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (clientsRes.ok) {
    const clients = await clientsRes.json();
    console.log(`   ✅ Total clientes para demo: ${clients.data?.length || clients.length}`);
  }

  console.log("\n🎉 ¡Seed completado!");
  console.log("\n📋 Credenciales Demo:");
  console.log("   Usuario: demo");
  console.log("   Contraseña: demo123");
  console.log(`   URL: ${API_URL}`);
}

main().catch(console.error);
