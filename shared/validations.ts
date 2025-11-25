import { z } from 'zod';

// Schema para cliente
export const clientSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  contactInfo: z.string()
    .optional()
    .refine((val) => !val || /^\d{9}$/.test(val), {
      message: 'El teléfono debe tener 9 dígitos'
    }),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Schema para fases del proceso
export const phaseRegistroSchema = z.object({
  name: z.string().min(3, 'Nombre requerido'),
  contactInfo: z.string().min(9, 'Teléfono requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  dni: z.string().optional(),
  notes: z.string().optional(),
});

export const phaseInvestigacionSchema = z.object({
  estadoInvestigacion: z.string().min(1, 'Estado de investigación requerido'),
  denunciaPolicial: z.string().optional(),
  notificaciones: z.string().optional(),
  documentosAdicionales: z.string().optional(),
  testimonios: z.string().optional(),
  evidenciaFotografica: z.string().optional(),
  fechaInicio: z.string().optional(),
});

export const phaseEstrategiaSchema = z.object({
  entenderHechos: z.string().min(10, 'Debe describir los hechos del caso'),
  teoriaDelCaso: z.string().min(10, 'Debe explicar la teoría del caso'),
  objetivos: z.string().min(10, 'Debe especificar los objetivos'),
  fundamentoLegal: z.string().optional(),
  estrategiaDefensa: z.string().optional(),
  riesgos: z.string().optional(),
});

export const phaseCitaSchema = z.object({
  meetingDate: z.string().min(1, 'Fecha requerida'),
  meetingTime: z.string().min(1, 'Hora requerida'),
  location: z.string().optional(),
  attendees: z.string().optional(),
  agenda: z.string().optional(),
  preparationNotes: z.string().optional(),
});

export const phaseSeguimientoSchema = z.object({
  currentStatus: z.string().min(1, 'Estado actual requerido'),
  lastUpdate: z.string().optional(),
  proximaAudiencia: z.string().optional(),
  resolucionesEmitidas: z.string().optional(),
  pendingTasks: z.string().optional(),
  observations: z.string().optional(),
});

// Schema para login
export const loginSchema = z.object({
  username: z.string().min(3, 'Usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Schema para tareas
export const taskSchema = z.object({
  title: z.string().min(3, 'Título requerido'),
  description: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
  caseId: z.string().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
