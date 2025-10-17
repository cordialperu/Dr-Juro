import "dotenv/config";
import { db } from "../server/db";
import { users, clients, cases, caseDocuments, caseProcessState } from "../shared/schema";
import { eq } from "drizzle-orm";

async function createCasoViolenciaFamiliar() {
  if (!db) {
    console.error("Base de datos no disponible");
    process.exit(1);
  }

  try {
    // 1. Buscar usuario de prueba
    const [testUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1);

    if (!testUser) {
      console.error("Usuario de prueba no encontrado. Ejecuta: npx tsx scripts/create-test-user.ts");
      process.exit(1);
    }

    console.log("✅ Usuario encontrado:", testUser.username);

    // 2. Crear cliente (víctima)
    const [client] = await db
      .insert(clients)
      .values({
        name: "María Elena Sánchez Gutiérrez",
        contactInfo: "Tel: 987654321 | Email: maria.sanchez@gmail.com | Dirección: Jr. Los Girasoles 245, Surco, Lima",
      })
      .returning();

    console.log("✅ Cliente creado:", client.name);

    // 3. Crear caso
    const [caso] = await db
      .insert(cases)
      .values({
        title: "Violencia Familiar y Medidas de Protección - Exp. N° 2024-1543",
        description: "Caso de violencia física y psicológica. La víctima solicita medidas de protección urgentes según Ley N° 30364.",
        status: "active",
        clientId: client.id,
        userId: testUser.id,
      })
      .returning();

    console.log("✅ Caso creado:", caso.title);

    // 4. Crear documentos del caso
    const documents = [
      {
        caseId: caso.id,
        filename: "Denuncia_Policial_N°2024-045678.pdf",
        fileType: "application/pdf",
        category: "police-report" as const,
        content: `DENUNCIA POLICIAL N° 2024-045678
COMISARÍA DE SURCO - LIMA

FECHA: 15 de Septiembre de 2024
HORA: 14:30 hrs

DENUNCIANTE: María Elena Sánchez Gutiérrez
DNI: 45678912
DOMICILIO: Jr. Los Girasoles 245, Surco, Lima
TELÉFONO: 987654321

DENUNCIADO: Carlos Alberto Mendoza Torres
DNI: 43567890
DOMICILIO: Jr. Los Girasoles 245, Surco, Lima (mismo domicilio)

RELATO DE LOS HECHOS:

La denunciante manifiesta que en la fecha 14 de septiembre de 2024, aproximadamente a las 22:00 horas, su conviviente Carlos Alberto Mendoza Torres llegó a su domicilio en aparente estado de ebriedad, procediendo a agredirla física y verbalmente.

AGRESIONES FÍSICAS:
- Golpes en el rostro con la mano abierta (cachetadas)
- Empujones que ocasionaron su caída al suelo
- Jalones de cabello
- Intento de estrangulamiento

AGRESIONES VERBALES:
El denunciado profirió insultos y amenazas tales como: "Te voy a matar", "Si me dejas, te encuentro donde estés", "Eres una inútil que no sirve para nada".

ANTECEDENTES:
La denunciante refiere que esta no es la primera vez que sufre violencia por parte del denunciado. Indica que desde hace 2 años viene sufriendo agresiones verbales constantes y hace 6 meses sufrió una agresión física similar, pero no denunció por temor.

TESTIGOS:
- Sra. Rosa Gutiérrez de Sánchez (madre de la denunciante) - DNI: 23456789
- Sr. Pedro Ramírez (vecino del inmueble) - DNI: 34567890

CERTIFICADO MÉDICO LEGAL:
Se entregó orden de Certificado Médico Legal N° CML-2024-12345 para ser evaluada en la División Médico Legal del Ministerio Público.

MEDIDAS ADOPTADAS:
Se procedió a registrar la denuncia y se comunicó al Juzgado de Familia de Turno para la evaluación de medidas de protección urgentes conforme a la Ley N° 30364.

FIRMADO:
SO3 PNP Juan Carlos Rodríguez López
Comisaría de Surco`,
        notes: "Revisar antecedentes de violencia. Verificar si hay denuncias previas. Solicitar medidas de protección inmediatas.",
      },
      {
        caseId: caso.id,
        filename: "Certificado_Medico_Legal_CML-2024-12345.pdf",
        fileType: "application/pdf",
        category: "additional" as const,
        content: `CERTIFICADO MÉDICO LEGAL N° CML-2024-12345
INSTITUTO DE MEDICINA LEGAL Y CIENCIAS FORENSES
DIVISIÓN MÉDICO LEGAL - LIMA

FECHA DE EVALUACIÓN: 15 de Septiembre de 2024
HORA: 09:00 hrs

DATOS DE LA EXAMINADA:
Nombre: María Elena Sánchez Gutiérrez
Edad: 34 años
DNI: 45678912
Dirección: Jr. Los Girasoles 245, Surco, Lima

MOTIVO DE EVALUACIÓN:
Violencia familiar - Agresión física

EXAMEN FÍSICO:

REGIÓN CEFÁLICA:
- Equimosis violácea en región malar izquierda de 5 x 4 cm
- Edema en región periorbitaria izquierda
- Excoriación lineal en cuero cabelludo (compatible con jalón de cabello)

REGIÓN CERVICAL:
- Equimosis múltiples en cara anterior del cuello (compatible con intento de estrangulamiento)
- Eritema en región cervical anterior

MIEMBROS SUPERIORES:
- Equimosis en antebrazo derecho de 3 x 2 cm (lesión de defensa)
- Excoriaciones superficiales en muñeca izquierda

REGIÓN DORSAL:
- Equimosis en región lumbar izquierda de 6 x 4 cm

VALORACIÓN DEL DAÑO:
Según el Art. 122° del Código Penal:
- Lesiones que requieren MENOS DE 10 DÍAS de asistencia o descanso médico

DÍAS DE ATENCIÓN FACULTATIVA: 06 días
DÍAS DE INCAPACIDAD MÉDICO LEGAL: 08 días

CONCLUSIONES:
1. Las lesiones descritas son compatibles con el relato de violencia física referido por la examinada
2. Se evidencian lesiones traumáticas recientes (menos de 24 horas)
3. Las lesiones en cuello sugieren riesgo de letalidad (intento de estrangulamiento)
4. Se recomienda evaluación psicológica complementaria

RECOMENDACIONES:
- Reposo relativo
- Analgésicos según indicación médica
- Control en 48 horas
- Evaluación psicológica inmediata
- Medidas de protección urgentes

Dr. Roberto Martínez Flores
Médico Legista
CMP 12345 / RNE 6789`,
        notes: "IMPORTANTE: Intento de estrangulamiento = Alto riesgo de femicidio. Solicitar medidas de protección urgentes. Programar evaluación psicológica.",
      },
      {
        caseId: caso.id,
        filename: "Notificacion_Audiencia_Medidas_Proteccion.pdf",
        fileType: "application/pdf",
        category: "notifications" as const,
        content: `PODER JUDICIAL DEL PERÚ
CORTE SUPERIOR DE JUSTICIA DE LIMA SUR
JUZGADO DE FAMILIA DE SURCO
EXPEDIENTE: 2024-1543

NOTIFICACIÓN DE AUDIENCIA ÚNICA

Lima, 18 de Septiembre de 2024

SEÑORA:
MARÍA ELENA SÁNCHEZ GUTIÉRREZ
PRESENTE.-

Es grato dirigirme a usted para NOTIFICARLE que el Juzgado de Familia de Surco ha ADMITIDO A TRÁMITE su solicitud de MEDIDAS DE PROTECCIÓN conforme a la Ley N° 30364 - Ley para prevenir, sancionar y erradicar la violencia contra las mujeres y los integrantes del grupo familiar.

DATOS DEL PROCESO:
Expediente N°: 2024-1543
Demandante: María Elena Sánchez Gutiérrez
Demandado: Carlos Alberto Mendoza Torres
Materia: Violencia Familiar - Medidas de Protección

AUDIENCIA ÚNICA:
FECHA: 25 de Septiembre de 2024
HORA: 10:00 AM
LUGAR: Sala de Audiencias N° 3 - Juzgado de Familia de Surco
         Av. Caminos del Inca 1150, Surco

MEDIDAS CAUTELARES DICTADAS (Art. 16° Ley 30364):

En aplicación del principio de protección inmediata, este Juzgado DISPONE las siguientes MEDIDAS DE PROTECCIÓN INMEDIATAS:

1. PROHIBICIÓN DE ACERCAMIENTO: Se prohíbe al denunciado Carlos Alberto Mendoza Torres acercarse o aproximarse a la víctima en cualquier forma, a una distancia mínima de 300 metros, incluyendo su domicilio, centro de trabajo y cualquier lugar donde aquella se encuentre.

2. PROHIBICIÓN DE COMUNICACIÓN: Se prohíbe al denunciado comunicarse con la víctima vía epistolar, telefónica, electrónica, mensajería instantánea o cualquier otro medio de comunicación, sea directo o mediante terceras personas.

3. RETIRO DEL AGRESOR DEL DOMICILIO: Se ordena el retiro inmediato del denunciado del domicilio conyugal ubicado en Jr. Los Girasoles 245, Surco, Lima, con el auxilio de la Policía Nacional del Perú de ser necesario.

4. IMPEDIMENTO DE DISPOSICIÓN DE BIENES: Se impide al denunciado realizar cualquier acto de disposición o gravamen sobre los bienes comunes del hogar.

5. INVENTARIO DE BIENES: Se ordena realizar inventario sobre los bienes muebles del hogar.

6. TRATAMIENTO PSICOLÓGICO: Se dispone que el denunciado se someta a tratamiento psicológico especializado en un establecimiento público de salud.

Las presentes medidas tienen CARÁCTER PROVISIONAL y estarán vigentes hasta la emisión de la sentencia definitiva.

La Policía Nacional del Perú queda ENCARGADA de la ejecución y cumplimiento de las medidas de protección dictadas.

IMPORTANTE:
- La audiencia es INAPLAZABLE
- Debe presentarse con su DNI original
- Puede asistir con abogado defensor (si no cuenta con uno, el Estado le asignará uno de oficio)
- El incumplimiento de las medidas de protección constituye DELITO de Resistencia o Desobediencia a la Autoridad (Art. 368° Código Penal)

Mgs. Carmen Rosa Valdivia Torres
JUEZA DE FAMILIA
Juzgado de Familia de Surco`,
        notes: "Medidas cautelares otorgadas. Confirmar asistencia a audiencia. Preparar argumentación para ratificar medidas y solicitar pensión alimenticia provisional.",
      },
    ];

    const insertedDocs = await db.insert(caseDocuments).values(documents).returning();
    console.log(`✅ ${insertedDocs.length} documentos creados`);

    // 5. Crear estado del proceso
    const [processState] = await db
      .insert(caseProcessState)
      .values({
        caseId: caso.id,
        currentPhase: "strategy",
        completionPercentage: "45",
        clientInfo: {
          name: client.name,
          phone: "987654321",
          email: "maria.sanchez@gmail.com",
          caseDescription: "Víctima de violencia familiar física y psicológica. Relación de convivencia de 5 años. Dos hijos menores de edad (7 y 4 años). Solicita medidas de protección urgentes y pensión alimenticia.",
          clientId: client.id,
        },
        investigationProgress: {
          notifications: `--- Notificacion_Audiencia_Medidas_Proteccion.pdf ---
Audiencia programada para el 25/09/2024 a las 10:00 AM. Medidas cautelares otorgadas: prohibición de acercamiento (300m), retiro del agresor del domicilio, impedimento de disposición de bienes.`,
          policeReport: `--- Denuncia_Policial_N°2024-045678.pdf ---
Denuncia presentada el 15/09/2024. Agresiones físicas: golpes, empujones, jalones de cabello, intento de estrangulamiento. Amenazas de muerte. Antecedentes de violencia desde hace 2 años. Testigos: madre y vecino.`,
          additionalDocuments: `--- Certificado_Medico_Legal_CML-2024-12345.pdf ---
8 días de incapacidad. Lesiones compatibles con violencia física. ALTO RIESGO: intento de estrangulamiento. Requiere evaluación psicológica urgente.`,
        },
        caseStrategy: {
          factsAnalysis: `ANÁLISIS DE LOS HECHOS:

1. CONTEXTO DE VIOLENCIA:
   - Relación de convivencia de 5 años
   - Dos hijos menores (7 y 4 años)
   - Patrón de violencia progresivo: verbal (2 años) → física (6 meses) → intento de femicidio (actual)
   
2. INCIDENTE CRÍTICO (14/09/2024):
   - Agresor en estado de ebriedad
   - Agresión física múltiple: golpes, empujones, jalones de cabello
   - INTENTO DE ESTRANGULAMIENTO (indicador #1 de riesgo femicida según estudios)
   - Amenazas de muerte: "Te voy a matar", "Si me dejas, te encuentro"

3. CONSECUENCIAS FÍSICAS:
   - Lesiones múltiples certificadas
   - 8 días de incapacidad médico-legal
   - Evidencia forense de estrangulamiento (equimosis cervical)

4. RIESGO ACTUAL:
   - ALTO RIESGO DE FEMICIDIO por intento de estrangulamiento
   - Amenazas persistentes y específicas
   - Control coercitivo económico y social
   - Víctima en situación de vulnerabilidad con menores a cargo

5. PRUEBAS DISPONIBLES:
   - Denuncia policial con testigos
   - Certificado médico legal
   - Notificación judicial con medidas cautelares
   - Testimonio de la víctima (consistente)`,
          caseTheory: `TEORÍA DEL CASO:

TESIS PRINCIPAL:
El señor Carlos Alberto Mendoza Torres ha ejercido violencia física y psicológica sistemática contra María Elena Sánchez Gutiérrez durante los últimos 2 años, culminando en un intento de femicidio el 14 de septiembre de 2024, conducta que configura:

1. DELITO DE LESIONES LEVES (Art. 122° CP) agravado por contexto de violencia familiar
2. VIOLENCIA CONTRA LA MUJER (Ley N° 30364) en sus modalidades física y psicológica
3. RIESGO INMINENTE para la vida de la víctima (intento de estrangulamiento)

ESTRATEGIA PROBATORIA:
1. Certificado Médico Legal → Acredita lesiones y riesgo de letalidad
2. Denuncia Policial → Establece cronología y testigos
3. Testimonios → Corroboran violencia sistemática
4. Evaluación psicológica → Demostrará afectación emocional y síndrome de la mujer maltratada

PRETENSIONES:
a) RATIFICACIÓN Y AMPLIACIÓN de medidas de protección
b) PROCESO PENAL por delito de lesiones y violencia familiar
c) PENSIÓN ALIMENTICIA provisional para los menores
d) INDEMNIZACIÓN por daños y perjuicios
e) TERAPIA PSICOLÓGICA para víctima y menores (a cargo del agresor)

FUNDAMENTO LEGAL:
- Ley N° 30364 (Ley de Violencia Familiar)
- D.S. N° 009-2016-MIMP (Reglamento)
- Código Penal: Arts. 122°, 368° (desobediencia)
- Constitución Política: Art. 2° (derecho a la integridad)`,
          objectives: [
            "Ratificar medidas de protección en audiencia del 25/09/2024",
            "Solicitar pensión alimenticia provisional de S/. 1,500 mensuales para los dos menores",
            "Presentar denuncia penal por delito de lesiones leves agravadas",
            "Obtener evaluación psicológica de la víctima (protocolo de violencia)",
            "Solicitar inventario y custodia de bienes del hogar",
            "Gestionar apoyo del CEM (Centro de Emergencia Mujer)",
            "Preparar demanda de indemnización civil por daños y perjuicios",
          ],
          legalStrategy: `ESTRATEGIA LEGAL INTEGRAL:

FASE 1 - PROTECCIÓN INMEDIATA (ACTUAL):
✅ Medidas cautelares otorgadas
⏳ Audiencia única: 25/09/2024
□ Preparar argumentación oral
□ Solicitar ratificación y ampliación de medidas
□ Presentar informe psicológico de víctima

FASE 2 - ACCIÓN PENAL (PARALELA):
□ Presentar denuncia penal ante Fiscalía de Familia
□ Solicitar prisión preventiva por riesgo de fuga y reiteración
□ Argumentar agravante: intento de estrangulamiento = tentativa de feminicidio
□ Citar jurisprudencia: Casación N° 1234-2022 sobre riesgo femicida

FASE 3 - ALIMENTOS (URGENTE):
□ Presentar demanda de alimentos para los menores
□ Solicitar pensión provisional: S/. 1,500 (S/. 750 c/u)
□ Acreditar necesidad de los menores y capacidad económica del obligado
□ Audiencia de alimentos en 15 días hábiles

FASE 4 - REPARACIÓN CIVIL:
□ Cuantificar daños: médicos, lucro cesante, daño moral
□ Preparar demanda indemnizatoria (vía proceso sumarísimo)
□ Estimar monto: S/. 30,000 por daño emergente y moral

ARGUMENTACIÓN CLAVE PARA AUDIENCIA:
1. URGENCIA: Intento de estrangulamiento = predictor #1 de femicidio
2. PRUEBA: CML evidencia riesgo de letalidad
3. REINCIDENCIA: Patrón de violencia ascendente
4. VULNERABILIDAD: Menores expuestos a violencia (Art. 3° Ley 30364)
5. JURISPRUDENCIA: Pleno Jurisdiccional Nacional Familia 2016

TESTIGOS A CITAR:
- Rosa Gutiérrez (madre) → Antecedentes de violencia
- Pedro Ramírez (vecino) → Testigo presencial del incidente
- Psicóloga del CEM → Evaluación de riesgo

PERITOS A SOLICITAR:
- Evaluación psicológica de víctima (trauma, TEPT)
- Evaluación psiquiátrica del agresor (control de impulsos)
- Evaluación de menores (exposición a violencia)`,
          aiAnalysisResult: "Análisis completado con IA legal el 18/09/2024",
          theoryDraft: "Borrador de teoría del caso revisado y validado",
        },
        clientMeeting: {
          date: "2024-09-23",
          time: "16:00",
          clientName: client.name,
          clientEmail: "maria.sanchez@gmail.com",
          clientPhone: "987654321",
          notes: `AGENDA DE REUNIÓN PRE-AUDIENCIA:

1. REVISIÓN DE DOCUMENTOS:
   - Verificar que cliente tenga DNI original
   - Revisar cronología de hechos
   - Preparar declaración para audiencia

2. ESTRATEGIA DE AUDIENCIA:
   - Explicar procedimiento de audiencia única
   - Ensayar posibles preguntas del juez
   - Instruir sobre lenguaje corporal y actitud

3. MEDIDAS DE SEGURIDAD:
   - Confirmar que agresor haya sido retirado del domicilio
   - Verificar cumplimiento de medidas cautelares
   - Entregar número de emergencia CEM: 100
   - Activar botón de pánico (app)

4. ASPECTOS ECONÓMICOS:
   - Discutir monto de pensión alimenticia
   - Inventariar bienes del hogar
   - Evaluar situación laboral del agresor

5. APOYO PSICOSOCIAL:
   - Coordinar terapia psicológica en CEM
   - Derivar a grupo de apoyo de sobrevivientes
   - Evaluar necesidad de acogida temporal

6. PRÓXIMOS PASOS:
   - Audiencia: 25/09 a las 10:00 AM
   - Acompañamiento del estudio al juzgado
   - Preparar denuncia penal posterior
   
RECORDATORIOS:
✓ Llevar copias de todos los documentos
✓ Confirmar asistencia 24h antes
✓ No tener contacto con el agresor`,
        },
      })
      .returning();

    console.log("✅ Estado del proceso creado");
    console.log("\n" + "=".repeat(80));
    console.log("✨ CASO DE VIOLENCIA FAMILIAR CREADO EXITOSAMENTE");
    console.log("=".repeat(80));
    console.log(`\n📋 Detalles del Caso:`);
    console.log(`   Expediente: ${caso.title}`);
    console.log(`   Cliente: ${client.name}`);
    console.log(`   Case ID: ${caso.id}`);
    console.log(`   Fase actual: Estrategia (45% completado)`);
    console.log(`   Documentos: ${insertedDocs.length} archivos adjuntos`);
    console.log(`\n🌐 Acceso:`);
    console.log(`   URL: http://localhost:3000/process/${caso.id}`);
    console.log(`   Usuario: admin`);
    console.log(`   Contraseña: admin123`);
    console.log("\n" + "=".repeat(80));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error al crear caso:", error);
    process.exit(1);
  }
}

createCasoViolenciaFamiliar();
