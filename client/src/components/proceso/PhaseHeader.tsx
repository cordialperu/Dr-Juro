import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface PhaseHeaderProps {
  title: string;
  description: string;
  color: string;
  icon: LucideIcon;
  completionPercentage: number;
  isSaving: boolean;
  onBack: () => void;
  onSave: (e?: React.FormEvent) => void;
}

export function PhaseHeader({
  title,
  description,
  color,
  icon: Icon,
  completionPercentage,
  isSaving,
  onBack,
  onSave,
}: PhaseHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            {completionPercentage}% completado
          </Badge>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Progreso
              </>
            )}
          </Button>
        </div>
      </div>

      <div className={`flex items-center gap-4 p-6 rounded-lg bg-${color}-50 dark:bg-${color}-950/20 border border-${color}-200 dark:border-${color}-800`}>
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
