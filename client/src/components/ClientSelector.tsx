import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, User, Clock, ArrowRight, Briefcase } from 'lucide-react';
import { useClient } from '@/contexts/ClientContext';
import { useQuery } from '@tanstack/react-query';
import { getClientColor } from '@/lib/clientColors';

interface Client {
  id: string;
  name: string;
  email?: string;
  phonePrimary?: string;
  contactInfo?: string;
  createdAt: string;
}

interface ClientSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientSelector({ open, onOpenChange }: ClientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { setClient } = useClient();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const result = await response.json();
      return result.data || [];
    },
  });

  // Obtener clientes recientes desde localStorage
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  
  useEffect(() => {
    if (clients.length > 0) {
      const recentIds = JSON.parse(localStorage.getItem('drjuro_recent_clients') || '[]');
      const recent = recentIds
        .map((id: string) => clients.find(c => c.id === id))
        .filter(Boolean)
        .slice(0, 3);
      setRecentClients(recent);
    }
  }, [clients]);

  // Filtrar clientes por búsqueda
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectClient = (client: Client) => {
    // Actualizar recientes
    const recentIds = JSON.parse(localStorage.getItem('drjuro_recent_clients') || '[]');
    const updated = [client.id, ...recentIds.filter((id: string) => id !== client.id)].slice(0, 5);
    localStorage.setItem('drjuro_recent_clients', JSON.stringify(updated));
    
    setClient(client);
    onOpenChange(false);
    setSearchQuery('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Briefcase className="h-6 w-6 text-primary" />
            Seleccionar Cliente
          </DialogTitle>
          <DialogDescription>
            Elige un cliente para acceder a su workspace completo con todas las herramientas de análisis
          </DialogDescription>
        </DialogHeader>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-[400px] pr-4">
          {/* Clientes Recientes */}
          {!searchQuery && recentClients.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Recientes
                </h3>
              </div>
              <div className="space-y-2">
                {recentClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onSelect={handleSelectClient}
                    getInitials={getInitials}
                    isRecent
                  />
                ))}
              </div>
            </div>
          )}

          {/* Todos los Clientes */}
          <div>
            {!searchQuery && (
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Todos los Clientes
                </h3>
              </div>
            )}
            
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No se encontraron clientes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onSelect={handleSelectClient}
                    getInitials={getInitials}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface ClientCardProps {
  client: Client;
  onSelect: (client: Client) => void;
  getInitials: (name: string) => string;
  isRecent?: boolean;
}

function ClientCard({ client, onSelect, getInitials, isRecent }: ClientCardProps) {
  const clientColor = getClientColor(client.id);
  
  return (
    <button
      onClick={() => onSelect(client)}
      className="w-full p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md group flex items-center gap-4 text-left"
      style={{
        borderColor: clientColor.primary + '40',
        borderLeftWidth: '4px',
        borderLeftColor: clientColor.primary
      }}
    >
      <Avatar className="h-12 w-12 border-2 transition-colors" style={{ borderColor: clientColor.primary + '40' }}>
        <AvatarFallback className="font-semibold" style={{ backgroundColor: clientColor.light, color: clientColor.dark }}>
          {getInitials(client.name)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-base truncate">{client.name}</h4>
          {isRecent && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Reciente
            </Badge>
          )}
        </div>
        {client.email && (
          <p className="text-sm text-muted-foreground truncate">{client.email}</p>
        )}
      </div>
      
      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-all" style={{ color: clientColor.primary + '80' }} />
    </button>
  );
}
