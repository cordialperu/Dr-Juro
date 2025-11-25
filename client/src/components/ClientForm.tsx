import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, Phone, Mail, User, MessageCircle } from 'lucide-react';

// Schema de validación con campos OBLIGATORIOS
const clientFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido').min(1, 'El email es obligatorio'),
  whatsappPrimary: z.string().min(1, 'El WhatsApp es obligatorio').regex(/^\+?[0-9\s\-()]+$/, 'Formato de teléfono inválido'),
  // Campos opcionales
  emailAssistant: z.string().email('Email inválido').optional().or(z.literal('')),
  whatsappAssistant: z.string().regex(/^\+?[0-9\s\-()]+$/, 'Formato de teléfono inválido').optional().or(z.literal('')),
  assistantName: z.string().optional(),
  notifyClient: z.boolean().default(true),
  notifyAssistant: z.boolean().default(false),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  onSubmit: (values: ClientFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<ClientFormValues>;
  submitLabel?: string;
}

export function ClientForm({ 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  defaultValues,
  submitLabel = 'Guardar Cliente'
}: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      email: '',
      whatsappPrimary: '',
      emailAssistant: '',
      whatsappAssistant: '',
      assistantName: '',
      notifyClient: true,
      notifyAssistant: false,
      notes: '',
      ...defaultValues,
    },
  });

  const { watch, setValue } = form;
  const notifyAssistant = watch('notifyAssistant');
  const hasAssistantEmail = watch('emailAssistant');

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Información del Cliente Titular */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <User className="h-4 w-4" />
          Información del Cliente (OBLIGATORIO)
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">
            Nombre completo <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Ej: Juan Pérez García"
            {...form.register('name')}
            className={form.formState.errors.name ? 'border-red-500' : ''}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                Email <span className="text-red-500">*</span>
              </div>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="cliente@ejemplo.com"
              {...form.register('email')}
              className={form.formState.errors.email ? 'border-red-500' : ''}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappPrimary">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-3 w-3" />
                WhatsApp para coordinaciones <span className="text-red-500">*</span>
              </div>
            </Label>
            <Input
              id="whatsappPrimary"
              type="tel"
              placeholder="+51 999 999 999"
              {...form.register('whatsappPrimary')}
              className={form.formState.errors.whatsappPrimary ? 'border-red-500' : ''}
            />
            {form.formState.errors.whatsappPrimary && (
              <p className="text-xs text-red-500">{form.formState.errors.whatsappPrimary.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Número principal para enviar notificaciones y coordinar citas
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Información del Asistente (OPCIONAL) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Phone className="h-4 w-4" />
          Asistente o Contacto Secundario (Opcional)
        </div>

        <div className="space-y-2">
          <Label htmlFor="assistantName">Nombre del asistente</Label>
          <Input
            id="assistantName"
            placeholder="Ej: María López (asistente)"
            {...form.register('assistantName')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emailAssistant">
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                Email del asistente
              </div>
            </Label>
            <Input
              id="emailAssistant"
              type="email"
              placeholder="asistente@ejemplo.com"
              {...form.register('emailAssistant')}
              className={form.formState.errors.emailAssistant ? 'border-red-500' : ''}
            />
            {form.formState.errors.emailAssistant && (
              <p className="text-xs text-red-500">{form.formState.errors.emailAssistant.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappAssistant">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-3 w-3" />
                WhatsApp del asistente
              </div>
            </Label>
            <Input
              id="whatsappAssistant"
              type="tel"
              placeholder="+51 999 888 777"
              {...form.register('whatsappAssistant')}
              className={form.formState.errors.whatsappAssistant ? 'border-red-500' : ''}
              disabled={!notifyAssistant}
            />
            {form.formState.errors.whatsappAssistant && (
              <p className="text-xs text-red-500">{form.formState.errors.whatsappAssistant.message}</p>
            )}
            {!notifyAssistant && (
              <p className="text-xs text-muted-foreground">
                Aparece cuando se activa "Enviar notificaciones al asistente"
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Preferencias de Notificación */}
      <div className="space-y-4">
        <div className="text-sm font-semibold">Preferencias de Notificación</div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <Checkbox
              id="notifyClient"
              checked={form.watch('notifyClient')}
              onCheckedChange={(checked) => setValue('notifyClient', checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="notifyClient" className="cursor-pointer font-medium">
                Enviar notificaciones al cliente titular
              </Label>
              <p className="text-xs text-muted-foreground">
                Avisos de avances, citas y documentos al cliente principal
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <Checkbox
              id="notifyAssistant"
              checked={form.watch('notifyAssistant')}
              onCheckedChange={(checked) => setValue('notifyAssistant', checked as boolean)}
              disabled={!hasAssistantEmail && !form.watch('emailAssistant')}
            />
            <div className="flex-1">
              <Label htmlFor="notifyAssistant" className="cursor-pointer font-medium">
                Enviar notificaciones al asistente
              </Label>
              <p className="text-xs text-muted-foreground">
                Copiar avisos y comunicaciones al asistente o contacto secundario
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Notas adicionales */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas adicionales</Label>
        <Textarea
          id="notes"
          placeholder="Información adicional sobre el cliente, preferencias, observaciones..."
          {...form.register('notes')}
          className="min-h-[80px]"
        />
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>

      {/* Nota informativa */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          ℹ️ <strong>Campos obligatorios:</strong> Nombre, Email y WhatsApp del cliente son necesarios para poder gestionar el caso y enviar notificaciones.
        </p>
      </div>
    </form>
  );
}
