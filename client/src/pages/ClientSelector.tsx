import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useClient, type Client } from '@/contexts/ClientContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, User, Clock, ArrowRight, UserPlus } from 'lucide-react';
import { CreateClientForm } from '@/components/CreateClientForm';
import { getClientColor } from '@/lib/clientColors';

export function ClientSelector() {
  const { client, setClient } = useClient();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Limpiar cliente al entrar al selector (permite cambiar de cliente)
  useEffect(() => {
    setClient(null);
  }, [setClient]);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const result = await response.json();
      return result.data || [];
    },
  });

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectClient = (selectedClient: Client) => {
    setClient(selectedClient);
    // Save to recent clients
    const recent = JSON.parse(localStorage.getItem('drjuro_recent_clients') || '[]');
    const newRecent = [selectedClient.id, ...recent.filter((id: string) => id !== selectedClient.id)].slice(0, 5);
    localStorage.setItem('drjuro_recent_clients', JSON.stringify(newRecent));
    setLocation(`/client/${selectedClient.id}`);
  };

  const handleClientCreated = (clientId: string) => {
    // Refetch clients and navigate to the new client
    setShowCreateForm(false);
    // Wait a bit for the query to refetch
    setTimeout(() => {
      const newClient = clients.find(c => c.id === clientId);
      if (newClient) {
        handleSelectClient(newClient);
      }
    }, 500);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // If showing create form, display it
  if (showCreateForm) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <CreateClientForm
          onSuccess={handleClientCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-2xl p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">Seleccione un cliente o cree uno nuevo</h1>
          <p className="text-muted-foreground">
            Elija un cliente existente de la lista o registre uno nuevo
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Clients List */}
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando clientes...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-6">
                  {searchQuery ? 'No se encontraron clientes' : 'No hay clientes aún'}
                </div>
                {!searchQuery && (
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    size="lg"
                    className="gap-2"
                  >
                    <UserPlus className="h-5 w-5" />
                    Crear Cliente Nuevo
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors text-left"
                  >
                    <Avatar>
                      <AvatarFallback 
                        className="text-white font-medium"
                        style={{ backgroundColor: getClientColor(c.id).primary }}
                      >
                        {getInitials(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{c.name}</h4>
                      {c.email && (
                        <p className="text-sm text-muted-foreground truncate">{c.email}</p>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {/* Create New Client Button - Always visible when there are clients */}
            {filteredClients.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Crear Cliente Nuevo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
