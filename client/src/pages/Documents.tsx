import { useState } from 'react';
import { useClient } from '@/contexts/ClientContext';
import { useCasesQuery } from '@/hooks/useCases';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Upload, FolderOpen, Search, Download, Trash2, Eye } from 'lucide-react';
import { FileUploadZone } from '@/components/FileUploadZone';
import { useToast } from '@/hooks/use-toast';

interface DocumentsProps {
  clientId: string;
}

export function Documents({ clientId }: DocumentsProps) {
  const { client } = useClient();
  const { data: cases = [] } = useCasesQuery();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'cases' | 'all'>('cases');

  // Placeholder document structure
  const documentsByCases = cases.map(caseItem => ({
    case: caseItem,
    documents: [], // Load from API in production
  }));

  const handleUploadSuccess = (files: File[]) => {
    toast({
      title: 'Documentos subidos',
      description: `${files.length} archivo(s) subido(s) exitosamente`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Documentos</h1>
        <p className="text-muted-foreground">
          Gestiona los documentos de {client?.name}
        </p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Documentos
          </CardTitle>
          <CardDescription>
            Arrastra archivos aquí o haz clic para seleccionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploadZone
            clientId={clientId}
            onUploadSuccess={handleUploadSuccess}
          />
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar documentos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
        <TabsList>
          <TabsTrigger value="cases">
            <FolderOpen className="mr-2 h-4 w-4" />
            Por Caso
          </TabsTrigger>
          <TabsTrigger value="all">
            <FileText className="mr-2 h-4 w-4" />
            Todos
          </TabsTrigger>
        </TabsList>

        {/* By Cases View */}
        <TabsContent value="cases" className="mt-6 space-y-4">
          {cases.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay casos aún</p>
              </CardContent>
            </Card>
          ) : (
            documentsByCases.map(({ case: caseItem, documents }) => (
              <Card key={caseItem.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{caseItem.title}</CardTitle>
                  <CardDescription>
                    {documents.length} documento(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay documentos en este caso</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Documents list would go here */}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* All Documents View */}
        <TabsContent value="all" className="mt-6">
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No hay documentos subidos</p>
                <p className="text-sm mt-2">
                  Los documentos aparecerán aquí una vez que los subas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
