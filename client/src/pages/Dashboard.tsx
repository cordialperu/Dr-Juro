import { useClient } from '@/contexts/ClientContext';
import { LegalProcessV2 } from '@/components/LegalProcessV2';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  clientId: string;
}

/**
 * Dashboard V3 - CENTRADO EN EL PROCESO LEGAL
 * 
 * Filosofía:
 * - Cliente → Caso → 7 Etapas del Proceso Legal
 * - Todo gira alrededor del proceso de ganar el caso
 * - Herramientas de análisis, documentos, tareas, están integradas EN el proceso
 */
export function Dashboard({ clientId }: DashboardProps) {
  const { client } = useClient();

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header con info del cliente y contactos */}
      <div className="border-b pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-3">{client.name}</h1>
            
            {/* Contacto Principal del Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">📧 Email:</span>
                <span className="font-medium">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">💬 WhatsApp:</span>
                <span className="font-medium">{client.whatsappPrimary}</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 px-2 py-0"
                  onClick={() => window.open(`https://wa.me/${client.whatsappPrimary?.replace(/\D/g, '')}`, '_blank')}
                >
                  Enviar mensaje
                </Button>
              </div>
            </div>

            {/* Asistente (si existe) */}
            {(client.assistantName || client.whatsappAssistant) && (
              <div className="bg-muted/50 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">👤 Asistente</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {client.assistantName && (
                    <div>
                      <span className="text-muted-foreground">Nombre:</span> {client.assistantName}
                    </div>
                  )}
                  {client.whatsappAssistant && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">💬</span>
                      <span>{client.whatsappAssistant}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-5 px-2 py-0"
                        onClick={() => window.open(`https://wa.me/${client.whatsappAssistant?.replace(/\D/g, '')}`, '_blank')}
                      >
                        Enviar
                      </Button>
                    </div>
                  )}
                  {client.emailAssistant && (
                    <div className="text-xs text-muted-foreground">
                      📧 {client.emailAssistant}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Imputado (si es diferente del cliente) */}
            {client.imputadoName && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚖️ Imputado: {client.imputadoName}
                  {client.imputadoRelation && ` (${client.imputadoRelation})`}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                  {client.imputadoDni && <div>DNI: {client.imputadoDni}</div>}
                  {client.imputadoContact && <div>📱 {client.imputadoContact}</div>}
                  {client.imputadoEmail && <div>📧 {client.imputadoEmail}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PROCESO LEGAL COMPLETO - Centro de la aplicación */}
      <LegalProcessV2 />
    </div>
  );
}
