/**
 * EditClientDialog - Modal para editar información del cliente
 * 
 * Permite actualizar:
 * - Nombre del cliente
 * - Email y WhatsApp (obligatorios)
 * - Datos del asistente
 * - Datos del imputado (si es diferente del cliente)
 * - Configuración de notificaciones
 */

import { useState, useEffect } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { useUpdateClientMutation } from '@/hooks/useClients';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditClientDialog({ open, onOpenChange }: EditClientDialogProps) {
  const { client, setClient } = useClient();
  const { toast } = useToast();
  const updateMutation = useUpdateClientMutation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsappPrimary: '',
    themeColor: '',
    assistantName: '',
    emailAssistant: '',
    whatsappAssistant: '',
    imputadoName: '',
    imputadoDni: '',
    imputadoRelation: '',
    imputadoContact: '',
    imputadoEmail: '',
    notes: '',
    notifyClient: true,
    notifyAssistant: false,
    notifyImputado: false,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        whatsappPrimary: client.whatsappPrimary || '',
        themeColor: client.themeColor || '#3b82f6',
        assistantName: client.assistantName || '',
        emailAssistant: client.emailAssistant || '',
        whatsappAssistant: client.whatsappAssistant || '',
        imputadoName: client.imputadoName || '',
        imputadoDni: client.imputadoDni || '',
        imputadoRelation: client.imputadoRelation || '',
        imputadoContact: client.imputadoContact || '',
        imputadoEmail: client.imputadoEmail || '',
        notes: client.notes || '',
        notifyClient: client.notifyClient === 'true' || client.notifyClient === true,
        notifyAssistant: client.notifyAssistant === 'true' || client.notifyAssistant === true,
        notifyImputado: client.notifyImputado === 'true' || client.notifyImputado === true,
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!client) return;

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Error',
        description: 'El email es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.whatsappPrimary.trim()) {
      toast({
        title: 'Error',
        description: 'El WhatsApp es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    const updatedData = {
      ...formData,
      notifyClient: formData.notifyClient ? 'true' : 'false',
      notifyAssistant: formData.notifyAssistant ? 'true' : 'false',
      notifyImputado: formData.notifyImputado ? 'true' : 'false',
    };

    updateMutation.mutate(
      {
        id: client.id,
        data: updatedData,
      },
      {
        onSuccess: (updatedClient: any) => {
          setClient(updatedClient);
          toast({
            title: 'Cliente actualizado',
            description: 'La información del cliente se actualizó correctamente',
          });
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast({
            title: 'Error al actualizar',
            description: error.message || 'No se pudo actualizar la información',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Información del Cliente</DialogTitle>
          <DialogDescription>
            Actualiza los datos de contacto y configuración del cliente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Principal */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Información Principal</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Cliente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nombre completo"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappPrimary">
                  WhatsApp <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="whatsappPrimary"
                  value={formData.whatsappPrimary}
                  onChange={(e) => handleChange('whatsappPrimary', e.target.value)}
                  placeholder="+51 999 999 999"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="themeColor">Color del Tema</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="themeColor"
                  type="color"
                  value={formData.themeColor || '#3b82f6'}
                  onChange={(e) => handleChange('themeColor', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <div className="flex gap-1">
                  {['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleChange('themeColor', color)}
                      className="w-8 h-8 rounded-full border-2 border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Este color se aplicará en el chat y elementos de la interfaz
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Notas adicionales sobre el cliente"
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Asistente */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Asistente (Opcional)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="assistantName">Nombre del Asistente</Label>
              <Input
                id="assistantName"
                value={formData.assistantName}
                onChange={(e) => handleChange('assistantName', e.target.value)}
                placeholder="Nombre del asistente"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emailAssistant">Email del Asistente</Label>
                <Input
                  id="emailAssistant"
                  type="email"
                  value={formData.emailAssistant}
                  onChange={(e) => handleChange('emailAssistant', e.target.value)}
                  placeholder="asistente@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappAssistant">WhatsApp del Asistente</Label>
                <Input
                  id="whatsappAssistant"
                  value={formData.whatsappAssistant}
                  onChange={(e) => handleChange('whatsappAssistant', e.target.value)}
                  placeholder="+51 999 999 999"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Imputado */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Imputado (Si es diferente del cliente)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imputadoName">Nombre del Imputado</Label>
                <Input
                  id="imputadoName"
                  value={formData.imputadoName}
                  onChange={(e) => handleChange('imputadoName', e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imputadoDni">DNI del Imputado</Label>
                <Input
                  id="imputadoDni"
                  value={formData.imputadoDni}
                  onChange={(e) => handleChange('imputadoDni', e.target.value)}
                  placeholder="12345678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imputadoRelation">Relación con el Cliente</Label>
              <Input
                id="imputadoRelation"
                value={formData.imputadoRelation}
                onChange={(e) => handleChange('imputadoRelation', e.target.value)}
                placeholder="Ej: Hijo, Cónyuge, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imputadoContact">Teléfono del Imputado</Label>
                <Input
                  id="imputadoContact"
                  value={formData.imputadoContact}
                  onChange={(e) => handleChange('imputadoContact', e.target.value)}
                  placeholder="+51 999 999 999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imputadoEmail">Email del Imputado</Label>
                <Input
                  id="imputadoEmail"
                  type="email"
                  value={formData.imputadoEmail}
                  onChange={(e) => handleChange('imputadoEmail', e.target.value)}
                  placeholder="imputado@ejemplo.com"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Configuración de Notificaciones */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Notificaciones</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyClient"
                  checked={formData.notifyClient}
                  onCheckedChange={(checked) => handleChange('notifyClient', checked)}
                />
                <Label htmlFor="notifyClient" className="font-normal cursor-pointer">
                  Notificar al cliente
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyAssistant"
                  checked={formData.notifyAssistant}
                  onCheckedChange={(checked) => handleChange('notifyAssistant', checked)}
                />
                <Label htmlFor="notifyAssistant" className="font-normal cursor-pointer">
                  Notificar al asistente
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyImputado"
                  checked={formData.notifyImputado}
                  onCheckedChange={(checked) => handleChange('notifyImputado', checked)}
                />
                <Label htmlFor="notifyImputado" className="font-normal cursor-pointer">
                  Notificar al imputado
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
