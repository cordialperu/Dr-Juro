import { db } from "../server/db";
import { users, clients, caseProcessState } from "../shared/schema";
import { hashPassword } from "../server/auth/service";
import { eq } from "drizzle-orm";

async function createDemoUser() {
  console.log("🚀 Creando usuario demo con clientes de prueba...\n");

  if (!db) {
    console.error("❌ Base de datos no disponible");
    process.exit(1);
  }

  try {
    // 1. Crear usuario demo
    const demoUsername = "demo";
    const demoPassword = "demo123";
    
    // Verificar si ya existe
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, demoUsername))
      .limit(1);

    let userId: string;

    if (existingUser.length > 0) {
      console.log("ℹ️  Usuario demo ya existe, usando el existente...");
      userId = existingUser[0].id;
      
      // Eliminar procesos y clientes antiguos
      const oldClients = await db.select().from(clients);
      
      for (const client of oldClients) {
        await db.delete(caseProcessState).where(eq(caseProcessState.caseId, client.id));
      }
      await db.delete(clients);
      
      console.log(`   ✅ Limpieza completada`);
    } else {
      console.log("📧 Creando usuario demo...");
      const hashedPassword = await hashPassword(demoPassword);
      const [newUser] = await db
        .insert(users)
        .values({
          username: demoUsername,
          password: hashedPassword,
        })
        .returning();
      
      userId = newUser.id;
      console.log(`   ✅ Usuario creado: ${demoUsername}`);
      console.log(`   🔑 Contraseña: ${demoPassword}`);
    }

    // 2. Crear 4 clientes
    const clientsData = [
      {
        name: "Carlos Mendoza Quispe",
        contactInfo: "+51 987 654 321",
        caseType: "Laboral",
        completionPercentage: 100,
        currentPhase: "completed",
        description: "Despido arbitrario - Caso resuelto exitosamente con reposición laboral"
      },
      {
        name: "Ana María Rodríguez Torres",
        contactInfo: "ana.rodriguez@email.com",
        caseType: "Civil",
        completionPercentage: 100,
        currentPhase: "completed",
        description: "Divorcio con liquidación de sociedad conyugal - Proceso culminado"
      },
      {
        name: "Luis Alberto Fernández Huamán",
        contactInfo: "+51 912 345 678",
        caseType: "Penal",
        completionPercentage: 100,
        currentPhase: "completed",
        description: "Defensa penal por apropiación ilícita - Sentencia absolutoria"
      },
      {
        name: "Patricia Huamán Ccahuana",
        contactInfo: "patricia.huaman@email.com",
        caseType: "Familiar",
        completionPercentage: 50,
        currentPhase: "strategy",
        description: "Tenencia y régimen de visitas - En proceso de negociación"
      }
    ];

    console.log("\n👥 Creando clientes...");
    
    for (let i = 0; i < clientsData.length; i++) {
      const clientData = clientsData[i];
      
      // Crear cliente
      const [newClient] = await db
        .insert(clients)
        .values({
          name: clientData.name,
          contactInfo: clientData.contactInfo,
        })
        .returning();

      console.log(`   ${i + 1}. ${clientData.name} (${clientData.caseType})`);

      // Crear estado del proceso según el nivel de completitud
      let processData: any = {
        caseId: newClient.id,
        currentPhase: clientData.currentPhase,
        completionPercentage: clientData.completionPercentage,
        clientInfo: {
          clientId: newClient.id,
          clientName: clientData.name,
          contactInfo: clientData.contactInfo,
          caseType: clientData.caseType,
          description: clientData.description,
        }
      };

      // Llenar datos según el porcentaje
      if (clientData.completionPercentage >= 35) {
        processData.investigationProgress = {
          notificaciones: `NOTIFICACIÓN JUDICIAL N° 001-2024
          
Lima, 15 de marzo de 2024

Exp. N° 12345-2024-0-1801-JR-LA-01
Demandante: ${clientData.name}
Demandado: Empresa XYZ S.A.C.

Se notifica al demandado que debe comparecer ante este juzgado dentro del plazo de 5 días hábiles para contestar la demanda interpuesta en su contra.

Caso: ${clientData.description}`,
          denuncia: `ESCRITO DE DEMANDA

I. DATOS GENERALES
Demandante: ${clientData.name}
Domicilio: Av. Principal 123, Lima
Tipo de proceso: ${clientData.caseType}

II. PETITORIO
Se solicita al juzgado:
1. Declarar fundada la demanda
2. Ordenar el cumplimiento de las obligaciones
3. Pago de costas y costos del proceso

III. FUNDAMENTOS DE HECHO
${clientData.description}

IV. FUNDAMENTOS DE DERECHO
Base legal según normativa peruana vigente.`,
          documentosAdicionales: `DOCUMENTOS ANEXOS:
- DNI del demandante
- Contrato de trabajo (casos laborales)
- Boletas de pago
- Notificaciones previas
- Cartas notariales
- Declaraciones testimoniales`
        };
      }

      if (clientData.completionPercentage >= 60) {
        processData.caseStrategy = {
          analisisJuridico: `ANÁLISIS JURÍDICO DEL CASO

1. SITUACIÓN ACTUAL:
${clientData.description}

2. FUNDAMENTO LEGAL:
- Constitución Política del Perú: Art. 22, 23
- Código Civil: Art. 1351, 1362
- Jurisprudencia aplicable

3. ESTRATEGIA PROCESAL:
- Presentar demanda con pruebas documentales
- Solicitar medidas cautelares si es necesario
- Preparar testigos clave
- Anticipar argumentos de la contraparte

4. PROBABILIDAD DE ÉXITO: ALTA
El caso cuenta con sólido respaldo documental y jurisprudencial.`,
          documentosGenerados: `DOCUMENTOS ELABORADOS:
✓ Demanda principal
✓ Anexos probatorios
✓ Solicitud de medidas cautelares
✓ Escrito de ofrecimiento de pruebas
✓ Minuta de conciliación (si aplica)`,
          proximosPasos: `PRÓXIMOS PASOS:
1. Presentar demanda ante el juzgado competente
2. Esperar notificación de admisión
3. Seguimiento del expediente
4. Preparar audiencia preliminar`
        };
      }

      if (clientData.completionPercentage >= 85) {
        processData.clientMeeting = {
          fechaReunion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días adelante
          temas: `AGENDA DE REUNIÓN:
1. Revisión del estado actual del caso
2. Análisis de últimas actuaciones procesales
3. Preparación para audiencia
4. Estrategia de argumentación
5. Documentos pendientes
6. Próximos plazos y fechas importantes`,
          notas: `NOTAS DE LA REUNIÓN:
- Cliente informado del avance del proceso
- Se acordó presentar documentación adicional
- Preparación para declaración testimonial
- Cliente satisfecho con el progreso
- Coordinación para próxima cita según calendario judicial`
        };
      }

      // Crear registro en caseProcessState
      await db.insert(caseProcessState).values(processData);
      
      console.log(`      ✓ Progreso: ${clientData.completionPercentage}% - Fase: ${clientData.currentPhase}`);
    }

    console.log("\n✅ ¡Usuario demo creado exitosamente!");
    console.log("\n📊 RESUMEN:");
    console.log(`   Username: demo`);
    console.log(`   Contraseña: demo123`);
    console.log(`   Clientes creados: ${clientsData.length}`);
    console.log(`     - 3 casos completados (100%)`);
    console.log(`     - 1 caso en progreso (50%)`);
    console.log("\n🔗 Inicia sesión y selecciona un cliente para ver la bitácora completa.");

  } catch (error) {
    console.error("❌ Error al crear usuario demo:", error);
    process.exit(1);
  }
}

createDemoUser();
