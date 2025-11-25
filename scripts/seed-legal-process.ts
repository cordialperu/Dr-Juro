/**
 * Script para crear tabla legal_process_v2 y poblar datos demo en Render
 */

import { neon } from "@neondatabase/serverless";
import 'dotenv/config';

// Usamos la DB de Render directamente vía env (o puedes poner la URL de Render)
const sql = neon(process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL!);

const API_URL = "https://dr-juro-lepn.onrender.com";

async function createTable() {
  console.log("1. Creando tabla legal_process_v2...");
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS legal_process_v2 (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id VARCHAR NOT NULL UNIQUE REFERENCES clients(id),
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        updated_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `;
    console.log("   ✅ Tabla creada/verificada");
  } catch (error: any) {
    console.log("   ⚠️ Error creando tabla:", error.message);
  }
}

async function seedLegalProcess() {
  console.log("\n2. Autenticando con API...");
  
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "demo", password: "demo123" })
  });

  if (!loginRes.ok) {
    console.error("   ❌ Error de autenticación:", await loginRes.text());
    return;
  }

  const { token } = await loginRes.json();
  console.log("   ✅ Autenticado");

  // Obtener clientes
  console.log("\n3. Obteniendo clientes...");
  const clientsRes = await fetch(`${API_URL}/api/clients`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  const clientsData = await clientsRes.json();
  const clients = clientsData.data || clientsData;
  console.log(`   ✅ ${clients.length} clientes encontrados`);

  // Datos de proceso legal para cada tipo de caso
  const processTemplates: Record<string, any> = {
    "María Elena Rodríguez Sánchez": {
      caso: {
        tipo: "penal",
        subtipo: "violencia_familiar",
        expediente: "00542-2024-0-1801-JR-PE-03",
        juzgado: "3° Juzgado Penal de Lima",
        fiscal: "Fiscalía Provincial Mixta de San Borja",
        estado: "sentenciado"
      },
      intervinientes: {
        participants: [
          { id: "1", tipo: "abogado", nombre: "Dr. Carlos Mendoza", rol: "Defensor", contacto: "+51 999 888 777" },
          { id: "2", tipo: "fiscal", nombre: "Dra. María Torres", rol: "Fiscal Provincial", contacto: "" },
          { id: "3", tipo: "agraviado", nombre: "María Elena Rodríguez", rol: "Víctima", contacto: "+51 987 654 321" },
          { id: "4", tipo: "imputado", nombre: "Roberto García Pérez", rol: "Agresor", contacto: "" }
        ]
      },
      hitos: {
        milestones: [
          { id: "1", fecha: "2024-06-15", instancia: "Fiscalía", titulo: "Denuncia presentada", descripcion: "Denuncia por violencia familiar ante Fiscalía", tipo: "denuncia", estado: "completado" },
          { id: "2", fecha: "2024-06-16", instancia: "Juzgado", titulo: "Medidas de protección", descripcion: "Se otorgan medidas de protección a favor de la víctima", tipo: "resolucion", estado: "completado" },
          { id: "3", fecha: "2024-06-20", instancia: "Fiscalía", titulo: "Declaración de víctima", descripcion: "Declaración en Cámara Gesell", tipo: "audiencia", estado: "completado" },
          { id: "4", fecha: "2024-07-01", instancia: "Medicina Legal", titulo: "Pericia psicológica", descripcion: "Evaluación psicológica determina afectación emocional", tipo: "pericia", estado: "completado" },
          { id: "5", fecha: "2024-08-15", instancia: "Fiscalía", titulo: "Acusación fiscal", descripcion: "Fiscalía formaliza acusación", tipo: "escrito", estado: "completado" },
          { id: "6", fecha: "2024-09-25", instancia: "Juzgado", titulo: "Audiencia de juicio", descripcion: "Juicio oral - Se presenta prueba testimonial y pericial", tipo: "audiencia", estado: "completado" },
          { id: "7", fecha: "2024-10-05", instancia: "Juzgado", titulo: "Sentencia condenatoria", descripcion: "Agresor condenado a 3 años de prisión suspendida + reparación civil S/.10,000", tipo: "sentencia", estado: "completado" }
        ]
      },
      financiero: {
        honorarios: 8000,
        pagado: 8000,
        pendiente: 0,
        payments: [
          { id: "1", fecha: "2024-06-15", monto: 3000, concepto: "Adelanto inicial", metodo: "Transferencia" },
          { id: "2", fecha: "2024-08-01", monto: 2500, concepto: "Segundo pago", metodo: "Efectivo" },
          { id: "3", fecha: "2024-10-10", monto: 2500, concepto: "Pago final", metodo: "Transferencia" }
        ]
      },
      documentos: {
        folders: ["Denuncia", "Pericias", "Escritos", "Resoluciones", "Sentencia"]
      },
      notas: {
        items: [
          { id: "1", fecha: "2024-10-05", contenido: "Caso concluido exitosamente. Cliente satisfecha con el resultado.", autor: "Dr. Mendoza" }
        ]
      }
    },
    "Jorge Luis Mendoza Torres": {
      caso: {
        tipo: "laboral",
        subtipo: "despido_arbitrario",
        expediente: "01234-2024-0-1801-JR-LA-01",
        juzgado: "1° Juzgado Especializado de Trabajo de Lima",
        estado: "en_tramite"
      },
      intervinientes: {
        participants: [
          { id: "1", tipo: "abogado", nombre: "Dr. Carlos Mendoza", rol: "Abogado demandante", contacto: "+51 999 888 777" },
          { id: "2", tipo: "demandante", nombre: "Jorge Luis Mendoza Torres", rol: "Trabajador despedido", contacto: "+51 956 789 012" },
          { id: "3", tipo: "demandado", nombre: "Corporación XYZ S.A.C.", rol: "Empleador", contacto: "" }
        ]
      },
      hitos: {
        milestones: [
          { id: "1", fecha: "2024-08-01", instancia: "Juzgado", titulo: "Demanda presentada", descripcion: "Demanda de indemnización por despido arbitrario - Monto: S/. 85,000", tipo: "demanda", estado: "completado" },
          { id: "2", fecha: "2024-08-10", instancia: "Juzgado", titulo: "Admisión de demanda", descripcion: "Auto admisorio - Se corre traslado a demandada", tipo: "resolucion", estado: "completado" },
          { id: "3", fecha: "2024-09-10", instancia: "Juzgado", titulo: "Audiencia de conciliación", descripcion: "No hubo acuerdo conciliatorio - Empresa ofrece S/. 15,000", tipo: "audiencia", estado: "completado" },
          { id: "4", fecha: "2024-10-20", instancia: "Juzgado", titulo: "Audiencia de juzgamiento (Parte 1)", descripcion: "Inicio de actuación probatoria - Declaración de parte", tipo: "audiencia", estado: "completado" },
          { id: "5", fecha: "2024-12-05", instancia: "Juzgado", titulo: "Continuación de audiencia", descripcion: "Pendiente - Exhibición de planillas y testigos", tipo: "audiencia", estado: "pendiente" }
        ]
      },
      financiero: {
        honorarios: 12000,
        pagado: 6000,
        pendiente: 6000,
        payments: [
          { id: "1", fecha: "2024-08-01", monto: 4000, concepto: "Adelanto inicial", metodo: "Transferencia" },
          { id: "2", fecha: "2024-09-15", monto: 2000, concepto: "Segundo pago", metodo: "Yape" }
        ]
      },
      documentos: {
        folders: ["Demanda", "Contestación", "Medios probatorios", "Resoluciones"]
      },
      notas: {
        items: [
          { id: "1", fecha: "2024-10-20", contenido: "Buen desempeño en primera parte de audiencia. Empresa mostró debilidad en documentación.", autor: "Dr. Mendoza" },
          { id: "2", fecha: "2024-11-01", contenido: "Preparar testigos para próxima audiencia. Coordinar con cliente horarios.", autor: "Dr. Mendoza" }
        ]
      }
    },
    "Ana Patricia Flores Gutiérrez": {
      caso: {
        tipo: "civil",
        subtipo: "divorcio",
        expediente: "02567-2024-0-1801-JR-FC-05",
        juzgado: "5° Juzgado de Familia de Lima",
        estado: "en_tramite"
      },
      intervinientes: {
        participants: [
          { id: "1", tipo: "abogado", nombre: "Dr. Carlos Mendoza", rol: "Abogado de la demandante", contacto: "+51 999 888 777" },
          { id: "2", tipo: "demandante", nombre: "Ana Patricia Flores Gutiérrez", rol: "Esposa", contacto: "+51 912 345 678" },
          { id: "3", tipo: "demandado", nombre: "Ricardo Antonio Vargas López", rol: "Esposo", contacto: "+51 945 678 901" }
        ]
      },
      hitos: {
        milestones: [
          { id: "1", fecha: "2024-11-01", instancia: "Juzgado", titulo: "Demanda de divorcio", descripcion: "Demanda por causal de separación de hecho (más de 2 años)", tipo: "demanda", estado: "completado" },
          { id: "2", fecha: "2024-11-08", instancia: "Juzgado", titulo: "Admisión de demanda", descripcion: "Auto admisorio - Traslado al demandado por 30 días", tipo: "resolucion", estado: "completado" },
          { id: "3", fecha: "2024-12-10", instancia: "Juzgado", titulo: "Contestación de demanda", descripcion: "Pendiente vencimiento de plazo para contestación", tipo: "escrito", estado: "pendiente" }
        ]
      },
      financiero: {
        honorarios: 5000,
        pagado: 2500,
        pendiente: 2500,
        payments: [
          { id: "1", fecha: "2024-11-01", monto: 2500, concepto: "Adelanto inicial", metodo: "Transferencia" }
        ]
      },
      documentos: {
        folders: ["Demanda", "Documentos civiles", "Bienes gananciales"]
      },
      notas: {
        items: [
          { id: "1", fecha: "2024-11-05", contenido: "Cliente prefiere resolver división de bienes de manera amigable si es posible.", autor: "Dr. Mendoza" }
        ]
      }
    }
  };

  // Crear proceso legal para cada cliente
  console.log("\n4. Creando procesos legales...\n");

  for (const client of clients) {
    const template = processTemplates[client.name];
    if (!template) {
      console.log(`   ⚠️ Sin template para: ${client.name}`);
      continue;
    }

    console.log(`   Creando proceso para: ${client.name}...`);

    const res = await fetch(`${API_URL}/api/legal-process/${client.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(template)
    });

    if (res.ok) {
      console.log(`   ✅ Proceso creado para ${client.name}`);
    } else {
      const error = await res.text();
      console.log(`   ❌ Error: ${error}`);
    }
  }

  console.log("\n🎉 ¡Seed de procesos legales completado!");
}

async function main() {
  try {
    // Primero intentamos crear via API directamente ya que no tenemos acceso a DB de Render
    await seedLegalProcess();
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
