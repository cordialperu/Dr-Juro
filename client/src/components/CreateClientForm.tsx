import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus, Mail, Phone, IdCard, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCreateClientMutation } from '@/hooks/useClients';
import type { InsertClient } from '@shared/schema';

const createClientSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  imputadoDni: z.string().min(8, 'El DNI debe tener al menos 8 dígitos').optional().or(z.literal('')),
  whatsappPrimary: z.string().min(9, 'El número de WhatsApp debe tener al menos 9 dígitos'),
  email: z.string().email('Ingrese un correo electrónico válido'),
  assistantName: z.string().optional(),
  whatsappAssistant: z.string().optional(),
});

type CreateClientForm = z.infer<typeof createClientSchema>;

interface CreateClientFormProps {
  onSuccess?: (clientId: string) => void;
  onCancel?: () => void;
}

export function CreateClientForm({ onSuccess, onCancel }: CreateClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createClientMutation = useCreateClientMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateClientForm>({
    resolver: zodResolver(createClientSchema),
  });

  const onSubmit = async (data: CreateClientForm) => {
    setIsSubmitting(true);
    try {
      // Prepare client data according to schema
      const clientData: InsertClient = {
        name: data.name,
        email: data.email,
        whatsappPrimary: data.whatsappPrimary,
        imputadoDni: data.imputadoDni || undefined,
        assistantName: data.assistantName || undefined,
        whatsappAssistant: data.whatsappAssistant || undefined,
        // Optional fields with defaults
        contactInfo: `${data.email} | WhatsApp: ${data.whatsappPrimary}`,
        notifyClient: 'true',
        notifyAssistant: data.assistantName ? 'true' : 'false',
        notifyImputado: 'false',
      };

      const newClient = await createClientMutation.mutateAsync(clientData);
      reset();
      if (onSuccess) {
        onSuccess(newClient.id);
      }
    } catch (error: any) {
      console.error('Error creating client:', error);
      alert(error.message || 'Error al crear el cliente. Por favor, intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Crear Nuevo Cliente</CardTitle>
            <CardDescription>Complete la información básica del cliente</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Principal del Cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              Información del Cliente
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Nombre Completo *
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ej: Juan Carlos Pérez García"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imputadoDni" className="flex items-center gap-2">
                <IdCard className="h-4 w-4" />
                Número de DNI
              </Label>
              <Input
                id="imputadoDni"
                {...register('imputadoDni')}
                placeholder="Ej: 12345678"
                maxLength={8}
                className={errors.imputadoDni ? 'border-red-500' : ''}
              />
              {errors.imputadoDni && (
                <p className="text-sm text-red-500">{errors.imputadoDni.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="whatsappPrimary" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono WhatsApp *
                </Label>
                <Input
                  id="whatsappPrimary"
                  {...register('whatsappPrimary')}
                  placeholder="Ej: 987654321"
                  maxLength={15}
                  className={errors.whatsappPrimary ? 'border-red-500' : ''}
                />
                {errors.whatsappPrimary && (
                  <p className="text-sm text-red-500">{errors.whatsappPrimary.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Correo Electrónico *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="Ej: cliente@email.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Información Opcional del Asistente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
              <UserCircle className="h-5 w-5" />
              Información del Asistente (Opcional)
            </h3>
            <p className="text-sm text-muted-foreground">
              Si el cliente tiene un asistente, puede registrar su información aquí.
            </p>

            <div className="space-y-2">
              <Label htmlFor="assistantName" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Nombre del Asistente
              </Label>
              <Input
                id="assistantName"
                {...register('assistantName')}
                placeholder="Ej: María García López"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappAssistant" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono del Asistente
              </Label>
              <Input
                id="whatsappAssistant"
                {...register('whatsappAssistant')}
                placeholder="Ej: 912345678"
                maxLength={15}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Cliente
                </>
              )}
            </Button>
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
