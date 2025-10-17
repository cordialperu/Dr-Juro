import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Brain, 
  Scale, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Copy,
  Download,
  Loader2 
} from "lucide-react"

interface AIAnalysisModalProps {
  caseTitle: string
  triggerButton?: React.ReactNode
}

interface AnalysisResult {
  confidence: number
  precedentsFound: number
  articlesMatched: string[]
  summary: string
  favorableArguments: string[]
  contraryArguments: string[]
  recommendations: string[]
  legalRisks: string[]
  citableExcerpts: string[]
}

// todo: remove mock functionality
const mockAnalysis: AnalysisResult = {
  confidence: 85,
  precedentsFound: 12,
  articlesMatched: ["Art. 1969 CC", "Art. 1970 CC", "Art. 1762 CC", "Art. 1321 CC"],
  summary: "El análisis indica una alta probabilidad de éxito en la demanda por daños y perjuicios. Se identificaron precedentes relevantes de la Corte Suprema que establecen la responsabilidad del constructor por defectos en la obra, incluso después de su entrega.",
  favorableArguments: [
    "Precedente vinculante CAS-2023-1845 establece responsabilidad objetiva del constructor",
    "Doctrina mayoritaria reconoce la extensión de garantía en contratos de obra",
    "Jurisprudencia uniforme sobre el deber de supervisión técnica",
    "Aplicación del Art. 1762 CC sobre responsabilidad por ruina de edificios"
  ],
  contraryArguments: [
    "Posible alegación de fuerza mayor por eventos sísmicos",
    "Cuestionamiento sobre el cumplimiento de normas técnicas vigentes",
    "Potencial responsabilidad compartida con el propietario por falta de mantenimiento"
  ],
  recommendations: [
    "Solicitar inspección técnica independiente para determinar causas del daño",
    "Recopilar documentación completa del proyecto y supervisión de obra",
    "Considerar demanda accesoria contra la compañía de seguros",
    "Evaluar inclusión de daño moral por afectación a la imagen empresarial"
  ],
  legalRisks: [
    "Prescripción de la acción (Art. 2001 CC - 10 años)",
    "Dificultad probatoria del nexo causal",
    "Posible reconvención por incumplimiento de pagos"
  ],
  citableExcerpts: [
    "La responsabilidad del constructor no se extingue con la entrega de la obra, sino que subsiste por los daños que puedan manifestarse posteriormente por vicios ocultos.",
    "El constructor responde por la solidez de la obra durante el plazo de diez años contados desde que concluyó la construcción.",
    "Se presume la culpa del constructor cuando se produce la ruina total o parcial del edificio por vicio de la construcción."
  ]
}

export function AIAnalysisModal({ caseTitle, triggerButton }: AIAnalysisModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [open, setOpen] = useState(false)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 3000))
    setAnalysis(mockAnalysis)
    setIsAnalyzing(false)
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  const generateMemo = () => {
    console.log('Generando memo legal...')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" data-testid="button-ai-analysis">
            <Brain className="h-4 w-4 mr-2" />
            Analizar caso
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Análisis: {caseTitle}
          </DialogTitle>
          <DialogDescription>
            Análisis inteligente de precedentes, doctrina y probabilidad de éxito
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!analysis && (
            <div className="text-center py-12">
              {!isAnalyzing ? (
                <div className="space-y-4">
                  <Brain className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Inicie el análisis para obtener recomendaciones
                    sobre precedentes, probabilidad de éxito y estrategia legal.
                  </p>
                  <Button onClick={handleAnalyze} size="lg" data-testid="button-start-analysis">
                    <Brain className="h-4 w-4 mr-2" />
                    Iniciar análisis
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Analizando caso...</p>
                    <p className="text-sm text-muted-foreground">
                      Procesando jurisprudencia, doctrina y precedentes relevantes
                    </p>
                    <Progress value={66} className="w-64 mx-auto" />
                  </div>
                </div>
              )}
            </div>
          )}

          {analysis && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="arguments">Argumentos</TabsTrigger>
                <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
                <TabsTrigger value="citations">Citas</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Confianza del Análisis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Progress value={analysis.confidence} className="flex-1" />
                        <span className="text-2xl font-bold text-primary">{analysis.confidence}%</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Precedentes Encontrados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{analysis.precedentsFound}</div>
                      <p className="text-sm text-muted-foreground">casos relevantes</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Artículos Aplicables</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{analysis.articlesMatched.length}</div>
                      <p className="text-sm text-muted-foreground">normas identificadas</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Resumen Ejecutivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed mb-4">{analysis.summary}</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.articlesMatched.map((article) => (
                        <Badge key={article} variant="outline" className="text-xs">
                          {article}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="arguments">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Argumentos Favorables
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {analysis.favorableArguments.map((arg, index) => (
                            <div key={index} className="flex gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs font-medium text-green-600 dark:text-green-400">
                                {index + 1}
                              </div>
                              <p className="text-sm leading-relaxed">{arg}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Argumentos Contrarios
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {analysis.contraryArguments.map((arg, index) => (
                            <div key={index} className="flex gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-xs font-medium text-amber-600 dark:text-amber-400">
                                {index + 1}
                              </div>
                              <p className="text-sm leading-relaxed">{arg}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="recommendations">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recomendaciones Estratégicas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysis.recommendations.map((rec, index) => (
                          <div key={index} className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium text-white">
                              {index + 1}
                            </div>
                            <p className="text-sm leading-relaxed">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-destructive">Riesgos Legales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysis.legalRisks.map((risk, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 border border-destructive/20 rounded-md">
                            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                            <p className="text-sm leading-relaxed">{risk}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="citations">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Extractos Citables</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Fragmentos listos para incorporar en escritos legales
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.citableExcerpts.map((excerpt, index) => (
                        <div key={index} className="space-y-2">
                          <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                            <p className="text-sm leading-relaxed italic">"{excerpt}"</p>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(excerpt)}
                              data-testid={`copy-excerpt-${index}`}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar cita
                            </Button>
                          </div>
                          {index < analysis.citableExcerpts.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {analysis && (
            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" onClick={generateMemo} data-testid="button-generate-memo">
                  <FileText className="h-4 w-4 mr-2" />
                  Generar memo
                </Button>
                <Button variant="outline" data-testid="button-download-analysis">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar análisis
                </Button>
              </div>
              <Button onClick={() => setOpen(false)} data-testid="button-close-analysis">
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}