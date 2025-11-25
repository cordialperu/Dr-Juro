import { useWorkflowMode } from '@/contexts/WorkflowModeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Hammer, LayoutGrid, Briefcase, Check } from 'lucide-react';

export function WorkflowToggle() {
  const { mode, setMode } = useWorkflowMode();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Hammer className="h-4 w-4" />
          <span className="hidden sm:inline">
            {mode === 'classic' ? 'Vista Global' : 'Por Cliente'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Hammer className="h-4 w-4" />
          Modo de Trabajo
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => setMode('classic')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <LayoutGrid className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Vista Clásica</div>
                <div className="text-xs text-muted-foreground">
                  Vista global de todos los datos
                </div>
              </div>
            </div>
            {mode === 'classic' && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setMode('client-centric')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Briefcase className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="font-semibold">Modo Client-Centric</div>
                <div className="text-xs text-muted-foreground">
                  Enfoque en un cliente a la vez
                </div>
              </div>
            </div>
            {mode === 'client-centric' && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          💡 Cambia entre workflows según tu preferencia
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
