import { useClient, type Client } from '@/contexts/ClientContext';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getClientColor } from '@/lib/clientColors';
import { useLocation } from "wouter";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';

interface ClientSwitcherProps {
  className?: string;
}

export function ClientSwitcher({ className }: ClientSwitcherProps) {
  const { client: selectedClient, setClient } = useClient();
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const result = await response.json();
      return result.data || [];
    },
  });

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSelectClient = (client: Client) => {
    setClient(client);
    setOpen(false);

    // Si estamos en una ruta de cliente, navegar al nuevo cliente manteniendo la sub-ruta
    if (location.includes('/client/')) {
      const parts = location.split('/');
      // parts[0] = "", parts[1] = "client", parts[2] = "oldId", ...
      if (parts[1] === 'client' && parts[2]) {
        parts[2] = client.id;
        const newPath = parts.join('/');
        setLocation(newPath);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedClient ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar className="h-6 w-6">
                <AvatarFallback 
                  className="text-xs text-white"
                  style={{ backgroundColor: getClientColor(selectedClient.id).primary }}
                >
                  {getInitials(selectedClient.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate font-medium">{selectedClient.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Seleccionar cliente...</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar cliente..." />
          <CommandEmpty>No se encontraron clientes.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {clients.map((client) => (
              <CommandItem
                key={client.id}
                value={client.name}
                onSelect={() => handleSelectClient(client)}
                className="flex items-center gap-2"
              >
                <Check
                  className={cn(
                    'h-4 w-4',
                    selectedClient?.id === client.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <Avatar className="h-7 w-7">
                  <AvatarFallback 
                    className="text-xs text-white"
                    style={{ backgroundColor: getClientColor(client.id).primary }}
                  >
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate font-medium text-sm">{client.name}</span>
                  {client.email && (
                    <span className="truncate text-xs text-muted-foreground">
                      {client.email}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
