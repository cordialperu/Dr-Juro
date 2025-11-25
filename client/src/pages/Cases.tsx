import { useState } from 'react';
import { Link } from 'wouter';
import { useClient } from '@/contexts/ClientContext';
import { useCasesQuery, useCreateCaseMutation } from '@/hooks/useCases';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, FolderOpen, Calendar, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface CasesProps {
  clientId: string;
}

export function Cases({ clientId }: CasesProps) {
  const { client, getActiveCases } = useClient();
  const { data: cases = [], isLoading } = useCasesQuery();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewCaseDialogOpen, setIsNewCaseDialogOpen] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({
    title: '',
    description: '',
    caseType: '',
    status: 'active',
  });

  const createCaseMutation = useCreateCaseMutation();

  const filteredCases = cases.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCase = () => {
    if (!newCaseForm.title.trim()) {
      toast({ title: 'El título es requerido', variant: 'destructive' });
      return;
    }
    createCaseMutation.mutate(
      { 
        title: newCaseForm.title, 
        description: newCaseForm.description || null,
        status: newCaseForm.status 
      },
      {
        onSuccess: () => {
          toast({ title: 'Caso creado exitosamente' });
          setIsNewCaseDialogOpen(false);
          setNewCaseForm({ title: '', description: '', caseType: '', status: 'active' });
        },
        onError: () => {
          toast({ title: 'Error al crear caso', variant: 'destructive' });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Casos</h1>
          <p className="text-muted-foreground">
            Gestiona los casos de {client?.name}
          </p>
        </div>
        
        <Dialog open={isNewCaseDialogOpen} onOpenChange={setIsNewCaseDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Caso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Caso</DialogTitle>
              <DialogDescription>
                Ingresa los detalles del nuevo caso para {client?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título del Caso *</Label>
                <Input
                  id="title"
                  value={newCaseForm.title}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                  placeholder="Ej: Caso de Defensa Penal"
                />
              </div>
              <div>
                <Label htmlFor="caseType">Tipo de Caso</Label>
                <Select
                  value={newCaseForm.caseType}
                  onValueChange={(value) => setNewCaseForm({ ...newCaseForm, caseType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="penal">Penal</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="laboral">Laboral</SelectItem>
                    <SelectItem value="familia">Familia</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newCaseForm.description}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                  placeholder="Breve descripción del caso..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewCaseDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCase} disabled={createCaseMutation.isPending}>
                {createCaseMutation.isPending ? 'Creando...' : 'Crear Caso'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar casos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cases Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredCases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No se encontraron casos' : 'No hay casos aún'}
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchQuery 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Crea tu primer caso para comenzar'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsNewCaseDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Caso
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map((caseItem) => (
            <Link key={caseItem.id} href={`/client/${clientId}/cases/${caseItem.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {caseItem.title}
                    </CardTitle>
                    <Badge variant={
                      caseItem.status === 'active' ? 'default' :
                      caseItem.status === 'closed' ? 'secondary' :
                      'outline'
                    }>
                      {caseItem.status}
                    </Badge>
                  </div>
                  {caseItem.description && (
                    <CardDescription className="line-clamp-3">
                      {caseItem.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Creado {formatDistanceToNow(new Date(caseItem.createdAt), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span className="capitalize">{caseItem.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
