import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Upload, 
  Brain, 
  Scale, 
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  Loader2,
  X
} from "lucide-react"
import { PrecedentCard } from "./PrecedentCard"
import { useToast } from "@/hooks/use-toast"

interface DocumentAnalysisResult {
  documentSummary: string
  keyLegalConcepts: string[]
  legalAreas: string[]
  relevantArticles: string[]
  precedentsFound: any[]
  recommendations: string[]
  risks: string[]
  confidence: number
}

export function DocumentAnalysis() {
  const [documentText, setDocumentText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo no soportado",
        description: "Por favor, suba archivos PDF, DOC, DOCX o TXT.",
        variant: "destructive"
      })
      return
    }

    setUploadedFile(file)
    
    // Read file content for text files
    if (file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setDocumentText(text)
      }
      reader.readAsText(file)
    } else {
      // For other file types, we'll need backend processing
      toast({
        title: "Archivo cargado",
        description: `${file.name} está listo para análisis.`,
      })
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (uploadedFile?.type === 'text/plain') {
      setDocumentText("")
    }
  }

  const analyzeDocument = async () => {
    if (!documentText.trim() && !uploadedFile) {
      toast({
        title: "Documento requerido",
        description: "Por favor, ingrese texto o suba un archivo para analizar.",
        variant: "destructive"
      })
      return
    }

    setIsAnalyzing(true)
    
    try {
      const formData = new FormData()
      
      if (uploadedFile) {
        formData.append('file', uploadedFile)
      } else {
        formData.append('text', documentText)
      }

      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        // Try to get specific error message from response
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error en el análisis del documento')
        } catch (parseError) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
      }

      const result = await response.json()
      setAnalysisResult(result)
      
      // Check if analysis includes a note about fallback usage
      if (result.note) {
        toast({
          title: "Análisis completado con sistema de respaldo",
          description: result.note,
          variant: "default"
        })
      } else {
        toast({
          title: "Análisis completado",
          description: `Se encontraron ${result.precedentsFound.length} precedentes relacionados.`
        })
      }
    } catch (error) {
      console.error('Error analyzing document:', error)
      
      // Default error messages
      let errorTitle = "Error en el análisis"
      let errorDescription = "No se pudo completar el análisis del documento. Intente nuevamente."
      
      // Check if the error response contains more specific information
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorTitle = "Error de conexión"
          errorDescription = "No se pudo conectar con el servidor. Verifique su conexión a internet."
        } else if (error.message.includes('quota') || error.message.includes('429')) {
          errorTitle = "Servicio temporalmente no disponible"
          errorDescription = "El servicio de IA ha alcanzado su límite. Se utilizará el sistema de análisis de respaldo."
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Texto copiado",
        description: "El texto ha sido copiado al portapapeles."
      })
    } catch (error) {
      console.error('Error copying text:', error)
    }
  }

  return (
    <div className="space-y-6" data-testid="document-analysis-main">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Análisis de Documentos</h1>
          <p className="text-muted-foreground">
            Analice documentos legales con IA y encuentre jurisprudencia peruana relacionada
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Input */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documento a Analizar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Subir archivo (PDF, DOC, DOCX, TXT)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium"
                    data-testid="input-file-upload"
                  />
                </div>
                {uploadedFile && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm flex-1">{uploadedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      data-testid="button-remove-file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Text Input */}
              <div className="space-y-2">
                <Label htmlFor="document-text">O ingrese el texto del documento</Label>
                <Textarea
                  id="document-text"
                  placeholder="Pegue aquí el contenido del documento legal que desea analizar...\n\nEjemplo:\n\nEn el presente caso, el demandante solicita el pago de daños y perjuicios por responsabilidad contractual derivada del incumplimiento de las obligaciones del contratista en la ejecución de la obra...\n\nLos hechos son los siguientes:\n1. El 15 de enero de 2023, las partes celebraron un contrato de construcción...\n2. El contratista incumplió con los plazos establecidos...\n3. Se produjeron defectos estructurales en la obra..."
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  className="min-h-[400px] resize-none"
                  data-testid="textarea-document-text"
                />
                <p className="text-xs text-muted-foreground">
                  {documentText.length} caracteres
                </p>
              </div>

              <Button 
                onClick={analyzeDocument} 
                disabled={isAnalyzing || (!documentText.trim() && !uploadedFile)}
                className="w-full"
                data-testid="button-analyze-document"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analizando documento...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analizar con IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results */}
        <div className="space-y-4">
          {!analysisResult && !isAnalyzing && (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Análisis Inteligente</h3>
                <p className="text-muted-foreground mb-4">
                  Suba un documento o ingrese texto para comenzar el análisis con IA
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Identificación automática de conceptos legales</p>
                  <p>• Búsqueda de jurisprudencia relacionada</p>
                  <p>• Análisis de riesgos y recomendaciones</p>
                  <p>• Extracción de artículos aplicables</p>
                </div>
              </CardContent>
            </Card>
          )}

          {isAnalyzing && (
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">Procesando documento...</h3>
                <p className="text-muted-foreground mb-4">
                  La IA está analizando el contenido y buscando jurisprudencia relacionada
                </p>
                <Progress value={66} className="w-64 mx-auto" />
                <p className="text-xs text-muted-foreground mt-2">
                  Esto puede tomar algunos momentos
                </p>
              </CardContent>
            </Card>
          )}

          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Resultado del Análisis
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Confianza:</span>
                  <Progress value={analysisResult.confidence} className="flex-1 max-w-32" />
                  <span className="text-sm font-medium">{analysisResult.confidence}%</span>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="summary">Resumen</TabsTrigger>
                    <TabsTrigger value="concepts">Conceptos</TabsTrigger>
                    <TabsTrigger value="precedents">Jurisprudencia</TabsTrigger>
                    <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="space-y-4">
                    <div className="space-y-3">
                      {/* Show note if analysis used fallback */}
                      {(analysisResult as any).note && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            ℹ️ {(analysisResult as any).note}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium mb-2">Resumen del Documento</h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                          {analysisResult.documentSummary}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Áreas Legales Identificadas</h4>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.legalAreas.map((area) => (
                            <Badge key={area} variant="secondary">{area}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Artículos Relevantes</h4>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.relevantArticles.map((article) => (
                            <Badge key={article} variant="outline">{article}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="concepts">
                    <div className="space-y-3">
                      <h4 className="font-medium">Conceptos Legales Clave</h4>
                      <div className="grid gap-2">
                        {analysisResult.keyLegalConcepts.map((concept, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                            <Scale className="h-4 w-4 text-primary" />
                            <span className="text-sm">{concept}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="precedents">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          Jurisprudencia Relacionada ({analysisResult.precedentsFound.length})
                        </h4>
                      </div>
                      <ScrollArea className="h-96">
                        <div className="space-y-3">
                          {analysisResult.precedentsFound.map((precedent) => (
                            <PrecedentCard key={precedent.id} {...precedent} />
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>

                  <TabsContent value="recommendations">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Recomendaciones Estratégicas
                        </h4>
                        <div className="space-y-2">
                          {analysisResult.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-xs font-medium text-white mt-0.5">
                                {index + 1}
                              </div>
                              <p className="text-sm">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          Riesgos Identificados
                        </h4>
                        <div className="space-y-2">
                          {analysisResult.risks.map((risk, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 border border-destructive/20 rounded-md">
                              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                              <p className="text-sm">{risk}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {analysisResult && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => handleCopy(JSON.stringify(analysisResult, null, 2))} data-testid="button-copy-analysis">
            <Copy className="h-4 w-4 mr-2" />
            Copiar análisis
          </Button>
          <Button variant="outline" data-testid="button-download-analysis">
            <Download className="h-4 w-4 mr-2" />
            Descargar reporte
          </Button>
        </div>
      )}
    </div>
  )
}