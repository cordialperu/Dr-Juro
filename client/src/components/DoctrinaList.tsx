import type { Doctrina } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface DoctrinaListProps {
  doctrinas: Doctrina[];
  emptyMessage?: string;
}

export function DoctrinaList({ doctrinas, emptyMessage = "No se encontraron doctrinas relacionadas." }: DoctrinaListProps) {
  if (!doctrinas.length) {
    return <p className="text-sm text-muted-foreground" data-testid="doctrina-empty">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-4" data-testid="doctrina-list">
      {doctrinas.map((doc) => (
        <Card key={doc.id} data-testid={`doctrina-${doc.id}`}>
          <CardHeader>
            <CardTitle className="flex flex-col gap-1">
              <span>{doc.obra ?? "Doctrina sin título"}</span>
              {doc.autor && (
                <span className="text-sm font-normal text-muted-foreground">{doc.autor}{doc.ano ? ` • ${doc.ano}` : ""}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {doc.extracto && <p>{doc.extracto}</p>}
            {Array.isArray(doc.palabras_clave) && doc.palabras_clave.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {doc.palabras_clave.map((keyword, index) => (
                  <Badge key={index} variant="outline">{keyword}</Badge>
                ))}
              </div>
            )}
            {doc.link_repositorio && (
              <div className="pt-2">
                <Button
                  asChild
                  variant="ghost"
                  className="h-auto p-0 text-primary"
                  data-testid={`doctrina-link-${doc.id}`}
                >
                  <a href={doc.link_repositorio} target="_blank" rel="noreferrer">
                    Consultar fuente
                    <ExternalLink className="ml-1 inline h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
