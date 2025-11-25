import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MessageSquare, User, Globe, Clock } from "lucide-react";
import type { Client, InsertClient } from "@shared/schema";

interface ClientContactFormProps {
  client?: Client | null;
  onSave?: (data: Partial<InsertClient>) => Promise<void>;
  autoSave?: boolean;
}

export default function ClientContactForm({ 
  client, 
  onSave, 
  autoSave = true 
}: ClientContactFormProps) {
  const [formData, setFormData] = useState<Partial<InsertClient>>({
    name: client?.name || "",
    phonePrimary: client?.phonePrimary || "",
    phoneSecondary: client?.phoneSecondary || "",
    whatsappPrimary: client?.whatsappPrimary || "",
    whatsappAssistant: client?.whatsappAssistant || "",
    email: client?.email || "",
    emailSecondary: client?.emailSecondary || "",
    assistantName: client?.assistantName || "",
    preferredContactMethod: client?.preferredContactMethod || "whatsapp",
    timezone: client?.timezone || "America/Lima",
    language: client?.language || "es",
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        phonePrimary: client.phonePrimary || "",
        phoneSecondary: client.phoneSecondary || "",
        whatsappPrimary: client.whatsappPrimary || "",
        whatsappAssistant: client.whatsappAssistant || "",
        email: client.email || "",
        emailSecondary: client.emailSecondary || "",
        assistantName: client.assistantName || "",
        preferredContactMethod: client.preferredContactMethod || "whatsapp",
        timezone: client.timezone || "America/Lima",
        language: client.language || "es",
      });
    }
  }, [client]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleBlur = async () => {
    if (autoSave && hasChanges && onSave) {
      await onSave(formData);
      setHasChanges(false);
    }
  };

  const handleManualSave = async () => {
    if (onSave && hasChanges) {
      await onSave(formData);
      setHasChanges(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Básica
          </CardTitle>
          <CardDescription>
            Nombre completo del cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={handleBlur}
              placeholder="Juan Pérez García"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacto Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contacto Principal
          </CardTitle>
          <CardDescription>
            Información de contacto primaria del cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phonePrimary">Teléfono Principal</Label>
              <Input
                id="phonePrimary"
                value={formData.phonePrimary ?? ""}
                onChange={(e) => handleChange("phonePrimary", e.target.value)}
                onBlur={handleBlur}
                placeholder="+51 999 999 999"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappPrimary">WhatsApp Principal</Label>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <Input
                  id="whatsappPrimary"
                  value={formData.whatsappPrimary ?? ""}
                  onChange={(e) => handleChange("whatsappPrimary", e.target.value)}
                  onBlur={handleBlur}
                  placeholder="+51 999 999 999"
                  type="tel"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-600" />
              <Input
                id="email"
                value={formData.email ?? ""}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={handleBlur}
                placeholder="cliente@ejemplo.com"
                type="email"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacto Secundario */}
      <Card>
        <CardHeader>
          <CardTitle>Contacto Secundario</CardTitle>
          <CardDescription>
            Información de respaldo o alternativa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneSecondary">Teléfono Secundario</Label>
              <Input
                id="phoneSecondary"
                value={formData.phoneSecondary ?? ""}
                onChange={(e) => handleChange("phoneSecondary", e.target.value)}
                onBlur={handleBlur}
                placeholder="+51 999 999 999"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailSecondary">Correo Secundario</Label>
              <Input
                id="emailSecondary"
                value={formData.emailSecondary ?? ""}
                onChange={(e) => handleChange("emailSecondary", e.target.value)}
                onBlur={handleBlur}
                placeholder="alternativo@ejemplo.com"
                type="email"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asistente Personal */}
      <Card>
        <CardHeader>
          <CardTitle>Asistente Personal</CardTitle>
          <CardDescription>
            Información de contacto del asistente del cliente (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assistantName">Nombre del Asistente</Label>
              <Input
                id="assistantName"
                value={formData.assistantName ?? ""}
                onChange={(e) => handleChange("assistantName", e.target.value)}
                onBlur={handleBlur}
                placeholder="María López"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappAssistant">WhatsApp del Asistente</Label>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <Input
                  id="whatsappAssistant"
                  value={formData.whatsappAssistant ?? ""}
                  onChange={(e) => handleChange("whatsappAssistant", e.target.value)}
                  onBlur={handleBlur}
                  placeholder="+51 999 999 999"
                  type="tel"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Preferencias de Comunicación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Preferencias de Comunicación
          </CardTitle>
          <CardDescription>
            Canal de comunicación preferido y configuración regional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Método de Contacto Preferido *</Label>
            <RadioGroup
              value={formData.preferredContactMethod ?? "whatsapp"}
              onValueChange={(value) => handleChange("preferredContactMethod", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="whatsapp" id="whatsapp" />
                <Label htmlFor="whatsapp" className="font-normal cursor-pointer flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  WhatsApp
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email-radio" />
                <Label htmlFor="email-radio" className="font-normal cursor-pointer flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Correo Electrónico
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="phone" />
                <Label htmlFor="phone" className="font-normal cursor-pointer flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  Teléfono
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="sms" />
                <Label htmlFor="sms" className="font-normal cursor-pointer flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  SMS
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Zona Horaria
              </Label>
              <Select
                value={formData.timezone ?? "America/Lima"}
                onValueChange={(value) => handleChange("timezone", value)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Lima">Lima (GMT-5)</SelectItem>
                  <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                  <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                  <SelectItem value="America/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                  <SelectItem value="America/Santiago">Santiago (GMT-3)</SelectItem>
                  <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                  <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select
                value={formData.language ?? "es"}
                onValueChange={(value) => handleChange("language", value)}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {!autoSave && (
        <div className="flex justify-end">
          <Button 
            onClick={handleManualSave} 
            disabled={!hasChanges}
            className="w-full md:w-auto"
          >
            Guardar Cambios
          </Button>
        </div>
      )}

      {autoSave && hasChanges && (
        <p className="text-sm text-muted-foreground text-center">
          Guardado automático activado • Los cambios se guardan al salir de cada campo
        </p>
      )}
    </div>
  );
}
