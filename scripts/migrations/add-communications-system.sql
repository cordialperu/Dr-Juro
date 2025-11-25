-- Migración: Sistema de Comunicaciones con Clientes
-- Fecha: 2025-11-12

-- 1. EXTENDER TABLA DE CLIENTES con información de contacto completa
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone_primary VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone_secondary VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_primary VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS whatsapp_assistant VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email_secondary VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS assistant_name VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20) DEFAULT 'whatsapp';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Lima';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es';

COMMENT ON COLUMN clients.phone_primary IS 'Teléfono principal del cliente';
COMMENT ON COLUMN clients.phone_secondary IS 'Teléfono secundario o de respaldo';
COMMENT ON COLUMN clients.whatsapp_primary IS 'WhatsApp principal del cliente';
COMMENT ON COLUMN clients.whatsapp_assistant IS 'WhatsApp del asistente personal';
COMMENT ON COLUMN clients.assistant_name IS 'Nombre del asistente personal';
COMMENT ON COLUMN clients.preferred_contact_method IS 'whatsapp, email, phone, sms';

-- 2. TABLA DE PLANTILLAS DE COMUNICACIÓN
CREATE TABLE IF NOT EXISTS communication_templates (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'reminder', 'update', 'request', 'notification', 'greeting'
    phase VARCHAR(50), -- 'investigation', 'strategy', 'meeting', 'followup', null para general
    channel VARCHAR(20) NOT NULL, -- 'email', 'whatsapp', 'sms'
    subject VARCHAR(500), -- Para emails
    body_template TEXT NOT NULL,
    variables JSONB, -- Variables disponibles: {clientName}, {lawyerName}, {caseTitle}, {date}, etc.
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false, -- Plantillas del sistema no editables
    created_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON communication_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_phase ON communication_templates(phase);
CREATE INDEX IF NOT EXISTS idx_templates_channel ON communication_templates(channel);

COMMENT ON TABLE communication_templates IS 'Plantillas reutilizables para comunicaciones con clientes';

-- 3. TABLA DE REGISTRO DE COMUNICACIONES
CREATE TABLE IF NOT EXISTS communications_log (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    case_id VARCHAR REFERENCES cases(id) ON DELETE CASCADE,
    client_id VARCHAR REFERENCES clients(id) ON DELETE CASCADE,
    template_id VARCHAR REFERENCES communication_templates(id) ON DELETE SET NULL,
    channel VARCHAR(20) NOT NULL, -- 'email', 'whatsapp', 'sms', 'phone'
    direction VARCHAR(10) NOT NULL, -- 'outbound', 'inbound'
    subject VARCHAR(500),
    body TEXT NOT NULL,
    recipient VARCHAR(255) NOT NULL, -- Email o número de teléfono
    sender VARCHAR(255), -- Email o número del remitente
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB, -- Información adicional (attachments, tracking, etc.)
    sent_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_case_id ON communications_log(case_id);
CREATE INDEX IF NOT EXISTS idx_comm_client_id ON communications_log(client_id);
CREATE INDEX IF NOT EXISTS idx_comm_status ON communications_log(status);
CREATE INDEX IF NOT EXISTS idx_comm_created_at ON communications_log(created_at DESC);

COMMENT ON TABLE communications_log IS 'Historial completo de comunicaciones con clientes';

-- 4. TABLA DE RECORDATORIOS PROGRAMADOS
CREATE TABLE IF NOT EXISTS scheduled_reminders (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    case_id VARCHAR REFERENCES cases(id) ON DELETE CASCADE,
    client_id VARCHAR REFERENCES clients(id) ON DELETE CASCADE,
    template_id VARCHAR REFERENCES communication_templates(id) ON DELETE SET NULL,
    reminder_type VARCHAR(50) NOT NULL, -- 'hearing', 'deadline', 'meeting', 'document_request', 'follow_up'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_for TIMESTAMP NOT NULL,
    channel VARCHAR(20) NOT NULL, -- 'email', 'whatsapp', 'sms', 'all'
    recurrence VARCHAR(20), -- 'once', 'daily', 'weekly', 'monthly'
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'sent', 'cancelled', 'failed'
    sent_at TIMESTAMP,
    error_message TEXT,
    created_by VARCHAR REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_case_id ON scheduled_reminders(case_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_for ON scheduled_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON scheduled_reminders(status);

COMMENT ON TABLE scheduled_reminders IS 'Recordatorios programados para clientes';

-- 5. TABLA DE EVENTOS DEL CASO (para disparar comunicaciones automáticas)
CREATE TABLE IF NOT EXISTS case_events (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    case_id VARCHAR REFERENCES cases(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'phase_completed', 'document_uploaded', 'hearing_scheduled', 'deadline_approaching', etc.
    event_data JSONB,
    should_notify_client BOOLEAN DEFAULT false,
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_case_id ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON case_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_notify ON case_events(should_notify_client) WHERE should_notify_client = true;

COMMENT ON TABLE case_events IS 'Eventos del caso que pueden disparar comunicaciones automáticas';

-- 6. INSERTAR PLANTILLAS DEL SISTEMA (ejemplos)

-- Plantilla: Confirmación de cita
INSERT INTO communication_templates (name, category, phase, channel, subject, body_template, variables, is_system) VALUES
('Confirmación de Cita', 'reminder', 'meeting', 'whatsapp', NULL, 
'Hola {clientName}, 

Le recordamos su cita con {lawyerName} para el día {meetingDate} a las {meetingTime}.

📍 Lugar: {location}
📋 Temas a tratar: {agenda}

Por favor, confirme su asistencia respondiendo a este mensaje.

Saludos cordiales,
{firmName}',
'{"clientName": "Nombre del cliente", "lawyerName": "Nombre del abogado", "meetingDate": "Fecha de la cita", "meetingTime": "Hora de la cita", "location": "Lugar de reunión", "agenda": "Agenda de temas", "firmName": "Nombre del despacho"}',
true);

-- Plantilla: Actualización de progreso
INSERT INTO communication_templates (name, category, phase, channel, subject, body_template, variables, is_system) VALUES
('Actualización de Progreso', 'update', null, 'email', 
'Actualización de su caso - {caseTitle}',
'Estimado/a {clientName},

Le escribimos para informarle sobre el avance de su caso "{caseTitle}".

📊 Progreso actual: {progressPercentage}%
📍 Fase: {currentPhase}
📅 Última actualización: {lastUpdate}

Resumen de avances:
{updateSummary}

Próximos pasos:
{nextSteps}

Si tiene alguna consulta, no dude en contactarnos.

Atentamente,
{lawyerName}
{firmName}',
'{"clientName": "Nombre del cliente", "caseTitle": "Título del caso", "progressPercentage": "Porcentaje de avance", "currentPhase": "Fase actual", "lastUpdate": "Fecha de última actualización", "updateSummary": "Resumen de avances", "nextSteps": "Próximos pasos", "lawyerName": "Nombre del abogado", "firmName": "Nombre del despacho"}',
true);

-- Plantilla: Solicitud de documentos
INSERT INTO communication_templates (name, category, phase, channel, subject, body_template, variables, is_system) VALUES
('Solicitud de Documentos', 'request', 'investigation', 'whatsapp', NULL,
'Hola {clientName},

Para avanzar con su caso, necesitamos que nos proporcione los siguientes documentos:

{documentList}

Por favor, puede enviarlos por este medio o a nuestro correo {firmEmail}.

Quedamos atentos.
{lawyerName}',
'{"clientName": "Nombre del cliente", "documentList": "Lista de documentos requeridos", "firmEmail": "Email del despacho", "lawyerName": "Nombre del abogado"}',
true);

-- Plantilla: Recordatorio de audiencia
INSERT INTO communication_templates (name, category, phase, channel, subject, body_template, variables, is_system) VALUES
('Recordatorio de Audiencia', 'reminder', 'followup', 'whatsapp', NULL,
'⚖️ RECORDATORIO DE AUDIENCIA

{clientName}, le recordamos:

📅 Fecha: {hearingDate}
⏰ Hora: {hearingTime}
📍 Lugar: {courtLocation}
👨‍⚖️ Juzgado: {courtName}

Documentos a llevar:
{requiredDocuments}

Nos vemos allí. Éxito!
{lawyerName}',
'{"clientName": "Nombre del cliente", "hearingDate": "Fecha de audiencia", "hearingTime": "Hora de audiencia", "courtLocation": "Ubicación del juzgado", "courtName": "Nombre del juzgado", "requiredDocuments": "Documentos requeridos", "lawyerName": "Nombre del abogado"}',
true);

-- Plantilla: Notificación de resolución
INSERT INTO communication_templates (name, category, phase, channel, subject, body_template, variables, is_system) VALUES
('Notificación de Resolución', 'notification', 'followup', 'email', 
'Resolución emitida en su caso - {caseTitle}',
'Estimado/a {clientName},

Le informamos que se ha emitido una resolución en su caso "{caseTitle}".

📄 Tipo: {resolutionType}
📅 Fecha: {resolutionDate}
✅ Resultado: {resolutionSummary}

Hemos analizado el documento y adjuntamos nuestras observaciones.

{observations}

Próximos pasos:
{nextActions}

Estamos a su disposición para cualquier consulta.

Atentamente,
{lawyerName}
{firmName}',
'{"clientName": "Nombre del cliente", "caseTitle": "Título del caso", "resolutionType": "Tipo de resolución", "resolutionDate": "Fecha de resolución", "resolutionSummary": "Resumen de la resolución", "observations": "Observaciones del abogado", "nextActions": "Próximas acciones", "lawyerName": "Nombre del abogado", "firmName": "Nombre del despacho"}',
true);

-- Plantilla: Bienvenida para nuevo cliente
INSERT INTO communication_templates (name, category, phase, channel, subject, body_template, variables, is_system) VALUES
('Bienvenida Nuevo Cliente', 'greeting', null, 'email', 
'Bienvenido/a a {firmName}',
'Estimado/a {clientName},

¡Bienvenido/a! Nos complace confirmar que su caso "{caseTitle}" ha sido registrado exitosamente en nuestro sistema.

👨‍⚖️ Abogado asignado: {lawyerName}
📧 Email de contacto: {lawyerEmail}
📱 WhatsApp: {lawyerPhone}

Durante el proceso, mantendremos comunicación constante y le informaremos sobre cada avance.

Puede consultar el progreso de su caso en cualquier momento a través de nuestro portal web.

¿Tiene alguna pregunta? Estamos aquí para ayudarle.

Saludos cordiales,
{firmName}',
'{"clientName": "Nombre del cliente", "caseTitle": "Título del caso", "firmName": "Nombre del despacho", "lawyerName": "Nombre del abogado", "lawyerEmail": "Email del abogado", "lawyerPhone": "Teléfono del abogado"}',
true);

-- 7. Función para reemplazar variables en plantillas
CREATE OR REPLACE FUNCTION replace_template_variables(
    template_text TEXT,
    variables JSONB
) RETURNS TEXT AS $$
DECLARE
    result TEXT := template_text;
    var_key TEXT;
    var_value TEXT;
BEGIN
    FOR var_key, var_value IN SELECT * FROM jsonb_each_text(variables)
    LOOP
        result := REPLACE(result, '{' || var_key || '}', COALESCE(var_value, ''));
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION replace_template_variables IS 'Reemplaza variables {key} en plantillas con valores del JSON';

-- 8. Vista para comunicaciones recientes por caso
CREATE OR REPLACE VIEW case_communications_summary AS
SELECT 
    c.case_id,
    c.client_id,
    COUNT(*) as total_communications,
    COUNT(*) FILTER (WHERE c.direction = 'outbound') as sent_count,
    COUNT(*) FILTER (WHERE c.direction = 'inbound') as received_count,
    MAX(c.created_at) as last_communication,
    COUNT(*) FILTER (WHERE c.status = 'failed') as failed_count
FROM communications_log c
GROUP BY c.case_id, c.client_id;

COMMENT ON VIEW case_communications_summary IS 'Resumen de comunicaciones por caso';
