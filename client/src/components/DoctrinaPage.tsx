import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useCasesQuery } from "@/hooks/useCases";
import { useDoctrinasQuery } from "@/hooks/useDoctrinas";
import { DoctrinaList } from "@/components/DoctrinaList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUnmsmSearch } from "@/hooks/useUnmsmSearch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePdfSearch } from "@/hooks/usePdfSearch";

type DoctrineSearchTarget = {
  id: string;
  name: string;
  source: "PUCP" | "UNMSM" | "PJ" | "Otros";
  description: string;
  scope: string;
  url: string;
};

type DoctrineResource = {
  id: string;
  title: string;
  authors: string;
  year: string;
  area: string;
  type: string;
  source: string;
  url: string;
  notes?: string;
  localPdf?: string;
};

const doctrineSearchTargets: DoctrineSearchTarget[] = [
  {
    id: "pucp-tesis",
    name: "Repositorio de Tesis PUCP",
    source: "PUCP",
    description:
      "Colección de tesis y trabajos académicos de la Facultad de Derecho. Ideal para doctrina contemporánea, procesos constitucionales y análisis comparados.",
    scope: "Tesis, artículos y trabajos de posgrado",
    url: "https://tesis.pucp.edu.pe/",
  },
  {
    id: "pucp-revista-themis",
    name: "Revista Thémis (PUCP)",
    source: "PUCP",
    description:
      "Revista jurídica de referencia en el Perú. Publica artículos de doctrina sobre derecho civil, constitucional, penal y corporativo.",
    scope: "Artículos arbitrados y comentarios jurisprudenciales",
    url: "https://revistas.pucp.edu.pe/index.php/themis/search",
  },
  {
    id: "pucp-iusetveritas",
    name: "Ius et Veritas (PUCP)",
    source: "PUCP",
    description:
      "Publicación estudiantil con análisis críticos, entrevistas y notas sobre debates actuales del derecho peruano e internacional.",
    scope: "Artículos y ensayos doctrinales",
    url: "https://revistas.pucp.edu.pe/index.php/iusetveritas/search",
  },
  {
    id: "unmsm-cybertesis",
    name: "Cybertesis UNMSM",
    source: "UNMSM",
    description:
      "Repositorio histórico con tesis digitalizadas. Requiere OCR para algunos documentos, pero es clave para doctrina clásica y fundamentos dogmáticos.",
    scope: "Tesis y monografías desde 1950+",
    url: "https://cybertesis.unmsm.edu.pe/",
  },
  {
    id: "pj-acuerdos-plenarios",
    name: "Acuerdos Plenarios – Corte Suprema",
    source: "PJ",
    description:
      "Doctrina jurisprudencial vinculante emitida por las Salas de la Corte Suprema. Esencial para módulos penal, civil y laboral.",
    scope: "Acuerdos plenarios y lineamientos jurisprudenciales",
    url: "https://www.pj.gob.pe/wps/wcm/connect/CorteSuprema/s_cortes_suprema_jurisprudencia/home/acuerdos_plenarios",
  },
  {
    id: "tc-resoluciones",
    name: "Resoluciones del Tribunal Constitucional",
    source: "PJ",
    description:
      "Repositorio oficial de sentencias del TC peruano. Permite vincular doctrina con precedentes en materia de derechos fundamentales.",
    scope: "Sentencias constitucionales y precedentes vinculantes",
    url: "https://www.tc.gob.pe/resolucion/publicadas-en-el-dia/",
  },
];

const initialDoctrineResources: DoctrineResource[] = [
  {
    id: "d001",
    title: "El sistema jurídico: Introducción al Derecho (Título Preliminar)",
    authors: "Marcial Rubio Correa",
    year: "2024",
    area: "Derecho Civil",
    type: "Libro – Fondo Editorial PUCP",
    source: "PUCP",
    url: "https://universo.pe/introduccion-al-derecho-marcial-rubio.html",
    notes:
      "Obra fundacional que comenta artículo por artículo el Título Preliminar del Código Civil. Requiere licencia/editorial para uso completo.",
  },
  {
    id: "d003",
    title: "Acuerdo Plenario N.º 02-2021/CIJ-116",
    authors: "Corte Suprema de Justicia",
    year: "2021",
    area: "Derecho Penal",
    type: "Acuerdo Plenario",
    source: "Poder Judicial",
    url: "https://img.lpderecho.pe/wp-content/uploads/2022/03/Acuerdos-plenarios-Segundo-pleno-jurisdiccional-2021-LPDerecho.pdf",
    localPdf: "Acuerdos-plenarios-Segundo-pleno-jurisdiccional-2021-LPDerecho.pdf",
    notes:
      "Doctrina jurisprudencial vinculante sobre la responsabilidad penal de personas jurídicas. Dominio público por su naturaleza oficial.",
  },
  {
    id: "d004",
    title: "Responsabilidad penal de las personas jurídicas en el ordenamiento jurídico peruano",
    authors: "Tatiana Marlene Llaguento Medina",
    year: "2023",
    area: "Derecho Penal",
    type: "Tesis de Pregrado",
    source: "UNMSM",
    url: "https://hdl.handle.net/20.500.12672/20918",
    notes:
      "Ejemplo de tesis moderna en acceso abierto sobre el Nuevo Código Procesal Penal y compliance corporativo.",
  },
  {
    id: "d005",
    title: "Tratado de Derecho Administrativo – Tomo I",
    authors: "Gustavo Bacacorzo",
    year: "1998",
    area: "Derecho Administrativo",
    type: "Manual digitalizado",
    source: "UNMSM / Colecciones digitalizadas",
    url: "https://es.scribd.com/document/513901795/Tratado-de-Derecho-Administrativo-Tomo-I-gustavo-Bacacorzo",
    notes:
      "PDF escaneado que requiere OCR y revisión manual. Fundamental para principios y potestades administrativas.",
  },
  {
    id: "d011",
    title: "Código Civil Comentado por los 100 mejores especialistas – Tomo I",
    authors: "Varios autores",
    year: "2020",
    area: "Derecho Civil",
    type: "Libro comentado",
    source: "Gaceta Jurídica",
    url: "https://andrescusi.files.wordpress.com/2020/06/codigo-civil-comentado-tomo-i.pdf",
    localPdf: "codigo-civil-comentado-tomo-i.pdf",
    notes:
      "Compilación crítica de especialistas. Uso bajo licencia académica; consultar editorial para distribución comercial.",
  },
  {
    id: "d010",
    title: "Los criterios de imputación de la responsabilidad civil a través de una panorámica de las tendencias europeas",
    authors: "Olenka Deniss Woolcott Oyague",
    year: "2018",
    area: "Derecho Civil",
    type: "Artículo / Capítulo",
    source: "Universidad de Lima",
    url: "https://repositorio.ulima.edu.pe/handle/20.500.12724/6770",
    notes:
      "Acceso abierto. Excelente apoyo para responsabilidad civil comparada y teoría del riesgo.",
  },
];

const parseQuery = (location: string) => {
  const [, search = ""] = location.split("?");
  const params = new URLSearchParams(search);
  const caseId = params.get("caseId") ?? undefined;
  return { caseId };
};

const buildDoctrinaPath = (caseId?: string) => {
  if (!caseId) return "/doctrine";
  const params = new URLSearchParams();
  params.set("caseId", caseId);
  return `/doctrine?${params.toString()}`;
};

export function DoctrinaPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { caseId } = parseQuery(location);

  const {
    data: cases = [],
    isLoading: isLoadingCases,
    error: casesError,
  } = useCasesQuery();

  const selectedCase = useMemo(
    () => cases.find((entry) => entry.id === caseId) ?? (cases.length > 0 && !caseId ? cases[0] : undefined),
    [cases, caseId],
  );

  const [unmsmFormQuery, setUnmsmFormQuery] = useState("");
  const [unmsmSearchTerm, setUnmsmSearchTerm] = useState("");
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [pdfSearchResource, setPdfSearchResource] = useState<DoctrineResource | undefined>(undefined);
  const [pdfFormTerm, setPdfFormTerm] = useState("");
  const [pdfSearchTerm, setPdfSearchTerm] = useState("");

  useEffect(() => {
    if (selectedCase) {
      const seed = selectedCase.title?.slice(0, 120) ?? "";
      setUnmsmFormQuery(seed);
      setUnmsmSearchTerm(seed);
      if (!pdfFormTerm) {
        setPdfFormTerm(seed);
        setPdfSearchTerm(seed);
      }
    }
  }, [selectedCase?.id, selectedCase?.title, pdfFormTerm]);

  const {
    data: unmsmData,
    isLoading: isLoadingUnmsm,
    error: unmsmError,
  } = useUnmsmSearch(unmsmSearchTerm, {
    enabled: Boolean(unmsmSearchTerm.trim()),
  });

  useEffect(() => {
    if (unmsmError) {
      toast({
        description: unmsmError.message,
        variant: "destructive",
      });
    }
  }, [toast, unmsmError]);

  const {
    data: pdfSearchData,
    isFetching: isFetchingPdf,
    error: pdfSearchError,
  } = usePdfSearch(pdfSearchResource?.localPdf, pdfSearchTerm, {
    enabled: isPdfDialogOpen && Boolean(pdfSearchResource?.localPdf && pdfSearchTerm.trim()),
  });

  useEffect(() => {
    if (pdfSearchError) {
      toast({
        description: pdfSearchError.message,
        variant: "destructive",
      });
    }
  }, [pdfSearchError, toast]);

  useEffect(() => {
    if (!isLoadingCases && !casesError && cases.length > 0 && !caseId) {
      navigate(buildDoctrinaPath(cases[0].id), { replace: true });
    }
  }, [cases, caseId, casesError, isLoadingCases, navigate]);

  const {
    data: doctrinas = [],
    isLoading: isLoadingDoctrinas,
    error: doctrinasError,
  } = useDoctrinasQuery(
    selectedCase
      ? {
          caseTitle: selectedCase.title ?? undefined,
          caseDescription: selectedCase.description ?? undefined,
        }
      : undefined,
    { enabled: Boolean(selectedCase) },
  );

  const handleCaseChange = (nextCaseId: string) => {
    navigate(buildDoctrinaPath(nextCaseId));
  };

  const handleUnmsmSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTerm = unmsmFormQuery.trim();
    if (!nextTerm) {
      toast({
        description: "Ingresa un término para buscar en Cybertesis UNMSM.",
        variant: "destructive",
      });
      return;
    }
    setUnmsmSearchTerm(nextTerm);
  };

  const handleOpenPdfSearch = (resource: DoctrineResource) => {
    setPdfSearchResource(resource);
    const initialTerm = resource.title.slice(0, 120);
    setPdfFormTerm(initialTerm);
    setPdfSearchTerm(initialTerm);
    setIsPdfDialogOpen(true);
  };

  const handlePdfSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTerm = pdfFormTerm.trim();
    if (!nextTerm) {
      toast({
        description: "Ingresa un término para buscar en el PDF.",
        variant: "destructive",
      });
      return;
    }
    setPdfSearchTerm(nextTerm);
  };

  const handlePdfDialogChange = (open: boolean) => {
    setIsPdfDialogOpen(open);
    if (!open) {
      setPdfSearchResource(undefined);
      setPdfFormTerm("");
      setPdfSearchTerm("");
    }
  };

  if (casesError) {
    return <div className="p-6 text-red-500">No se pudieron cargar los expedientes: {casesError.message}</div>;
  }

  if (doctrinasError) {
    return <div className="p-6 text-red-500">No se pudieron cargar las doctrinas: {doctrinasError.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Biblioteca de Doctrina</h1>
          <p className="text-muted-foreground">Selecciona un expediente para ver doctrina doctrinal relacionada y explora los repositorios nacionales más relevantes.</p>
        </div>
        <div className="w-full max-w-md">
          {isLoadingCases ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedCase?.id ?? caseId ?? ""}
              onValueChange={handleCaseChange}
              disabled={cases.length === 0}
            >
              <SelectTrigger data-testid="doctrina-case-select">
                <SelectValue placeholder="Selecciona un expediente" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((caseEntry) => (
                  <SelectItem key={caseEntry.id} value={caseEntry.id}>
                    {caseEntry.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {selectedCase ? (
        <Card>
          <CardHeader>
            <CardTitle>Resumen del expediente seleccionado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">ID: {selectedCase.id}</Badge>
                <Badge variant="outline">Estado: {selectedCase.status}</Badge>
              </div>
              <Textarea
                value={selectedCase.description ?? "Sin descripción disponible."}
                readOnly
                className="min-h-[120px] resize-none text-sm"
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Selecciona un expediente</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Aún no se ha seleccionado ningún expediente. Usa el selector para comenzar.
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Resultados doctrinales</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDoctrinas ? (
            <div className="space-y-3" data-testid="doctrina-loading">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <DoctrinaList
              doctrinas={doctrinas}
              emptyMessage={selectedCase ? "No se encontraron doctrinas vinculadas a este expediente." : "Selecciona un expediente para ver resultados."}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cybertesis UNMSM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleUnmsmSubmit}>
            <Input
              value={unmsmFormQuery}
              onChange={(event) => setUnmsmFormQuery(event.target.value)}
              placeholder="Ingresa palabras clave o título"
              aria-label="Buscar en Cybertesis UNMSM"
            />
            <Button type="submit" disabled={isLoadingUnmsm && unmsmFormQuery.trim() === unmsmSearchTerm.trim()}>
              Buscar
            </Button>
          </form>

          {isLoadingUnmsm ? (
            <div className="space-y-3" data-testid="unmsm-loading">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : unmsmData && unmsmData.results.length > 0 ? (
            <div className="space-y-3" data-testid="unmsm-results">
              {unmsmData.results.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="flex flex-col gap-1 text-base">
                      <span>{item.title}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {item.authors.length > 0 ? item.authors.join(", ") : "Autor no especificado"}
                        {item.issued ? ` • ${item.issued}` : ""}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    {item.abstract && <p>{item.abstract}</p>}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Fuente: {item.source}</Badge>
                      <Button asChild variant="ghost" className="h-auto p-0 text-primary">
                        <a href={item.url} target="_blank" rel="noreferrer" data-testid={`unmsm-link-${item.id}`}>
                          Ver recurso
                          <ExternalLink className="ml-1 inline h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {unmsmData.pagination.hasNext && (
                <div className="text-sm text-muted-foreground">
                  Mostrando {unmsmData.results.length} resultados de {unmsmData.pagination.totalElements}. Ajusta el término de búsqueda para refinar.
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" data-testid="unmsm-empty">
              {unmsmSearchTerm ? "No se encontraron resultados en Cybertesis UNMSM." : "Ingresa un término para buscar en Cybertesis UNMSM."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buscadores externos recomendados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {doctrineSearchTargets.map((target) => (
            <div
              key={target.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{target.name}</h3>
                  <p className="text-sm text-muted-foreground">{target.description}</p>
                </div>
                <Badge variant="outline" className="w-max">Fuente: {target.source}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="w-max">Cobertura: {target.scope}</Badge>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  data-testid={`doctrina-search-${target.id}`}
                >
                  <a href={target.url} target="_blank" rel="noreferrer">
                    Abrir buscador
                    <ExternalLink className="ml-2 inline h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recursos doctrinales prioritarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialDoctrineResources.map((resource) => (
            <div
              key={resource.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 shadow-sm"
              data-testid={`doctrina-resource-${resource.id}`}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {resource.authors} • {resource.year}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="w-max">Área: {resource.area}</Badge>
                  <Badge variant="outline" className="w-max">Tipo: {resource.type}</Badge>
                  <Badge variant="outline" className="w-max">Fuente: {resource.source}</Badge>
                </div>
              </div>
              {resource.notes && (
                <p className="text-sm text-muted-foreground">{resource.notes}</p>
              )}
              <Button
                asChild
                size="sm"
                variant="default"
                className="w-fit"
                data-testid={`doctrina-resource-link-${resource.id}`}
              >
                <a href={resource.url} target="_blank" rel="noreferrer">
                  Consultar recurso
                  <ExternalLink className="ml-2 inline h-3.5 w-3.5" />
                </a>
              </Button>
              {resource.localPdf && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-fit"
                  data-testid={`doctrina-resource-local-${resource.id}`}
                  onClick={() => handleOpenPdfSearch(resource)}
                >
                  Buscar en PDF
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={isPdfDialogOpen} onOpenChange={handlePdfDialogChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Buscar en PDF local</DialogTitle>
            <DialogDescription>
              {pdfSearchResource ? `Recurso: ${pdfSearchResource.title}` : "Selecciona un recurso para iniciar la búsqueda."}
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handlePdfSearchSubmit}>
            <Input
              value={pdfFormTerm}
              onChange={(event) => setPdfFormTerm(event.target.value)}
              placeholder="Ingresa palabras clave"
              aria-label="Buscar en PDF"
            />
            <Button type="submit" disabled={isFetchingPdf && pdfFormTerm.trim() === pdfSearchTerm.trim()}>
              Buscar
            </Button>
          </form>

          <div className="max-h-[420px] space-y-4 overflow-y-auto">
            {isFetchingPdf && (
              <div className="space-y-3" data-testid="pdf-search-loading">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}

            {!isFetchingPdf && pdfSearchTerm && pdfSearchData && pdfSearchData.matches.length === 0 && (
              <p className="text-sm text-muted-foreground" data-testid="pdf-search-empty">
                No se encontraron coincidencias en este PDF.
              </p>
            )}

            {!isFetchingPdf && pdfSearchData && pdfSearchData.matches.length > 0 && (
              <div className="space-y-3" data-testid="pdf-search-results">
                {pdfSearchData.matches.map((match, index) => (
                  <Card key={`${match.page}-${index}`}>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Página {match.page}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        <span>{match.preview.before}</span>
                        <span className="bg-primary/20 px-1 font-semibold text-primary">{match.preview.match}</span>
                        <span>{match.preview.after}</span>
                      </p>
                      <Button asChild variant="ghost" className="h-auto p-0 text-primary">
                        <a href={match.url} target="_blank" rel="noreferrer">
                          Abrir en PDF
                          <ExternalLink className="ml-1 inline h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {pdfSearchData.truncated && (
                  <p className="text-xs text-muted-foreground">
                    Mostrando las primeras coincidencias. Afinar el término para resultados más precisos.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handlePdfDialogChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
