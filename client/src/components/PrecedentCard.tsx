import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Scale, FileText, ExternalLink, Copy } from "lucide-react"
import { useState } from "react"

interface PrecedentCardProps {
  id: string
  title: string
  court: string
  chamber: string
  date: string
  caseNumber: string
  bindingLevel: "ejecutoria_vinculante" | "acuerdo_plenario" | "jurisprudencia_uniforme" | "relevante"
  summary: string
  confidence: number
  articlesMatched: string[]
  excerpt: string
  officialLink?: string
}

const bindingLabels = {
  ejecutoria_vinculante: "Ejecutoria Vinculante",
  acuerdo_plenario: "Acuerdo Plenario",
  jurisprudencia_uniforme: "Jurisprudencia Uniforme",
  relevante: "Relevante"
}

const bindingIcons = {
  ejecutoria_vinculante: "🔒",
  acuerdo_plenario: "🏦",
  jurisprudencia_uniforme: "✔️",
  relevante: "📝"
}

const bindingColors = {
  ejecutoria_vinculante: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  acuerdo_plenario: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  jurisprudencia_uniforme: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  relevante: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
}

export function PrecedentCard({
  id,
  title,
  court,
  chamber,
  date,
  caseNumber,
  bindingLevel,
  summary,
  confidence,
  articlesMatched,
  excerpt,
  officialLink
}: PrecedentCardProps) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    const citation = `${title} - ${court}, ${chamber} - ${date} - Exp. ${caseNumber}`
    await navigator.clipboard.writeText(citation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="hover-elevate" data-testid={`precedent-card-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h3 className="font-semibold text-card-foreground leading-tight">{title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Scale className="h-4 w-4" />
              <span>{court} - {chamber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={bindingColors[bindingLevel]}>
              {bindingIcons[bindingLevel]} {bindingLabels[bindingLevel]}
            </Badge>
            <div className="text-right">
              <div className="text-sm font-medium text-card-foreground">{confidence}%</div>
              <div className="text-xs text-muted-foreground">confianza</div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Fecha:</span>
            <span className="text-card-foreground">{date}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">Exp.:</span>
            <span className="text-card-foreground">{caseNumber}</span>
          </div>
          
          {articlesMatched.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Artículos:</span>
              <div className="flex gap-1 flex-wrap">
                {articlesMatched.map((article, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {article}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-card-foreground">Resumen</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
        </div>
        
        {excerpt && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-card-foreground">Extracto relevante</h4>
            <div className="bg-muted/50 p-3 rounded-md border-l-4 border-primary">
              <p className="text-sm text-card-foreground italic leading-relaxed">
                "{excerpt}"
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy}
              data-testid={`precedent-copy-${id}`}
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? "Copiado!" : "Citar"}
            </Button>
            {officialLink && (
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                data-testid={`precedent-link-${id}`}
              >
                <a href={officialLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver original
                </a>
              </Button>
            )}
          </div>
          <Button variant="secondary" size="sm" data-testid={`precedent-analyze-${id}`}>
            Analizar similitud
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}