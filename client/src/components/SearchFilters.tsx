import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, X, Search } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface SearchFiltersProps {
  onSearch: (filters: SearchFilters) => void
  onReset: () => void
}

export interface SearchFilters {
  query: string
  tribunal: string[]
  sala: string[]
  tipoResolucion: string[]
  fechaDesde?: Date
  fechaHasta?: Date
  articulos: string[]
  gradoVinculancia: string[]
}

const tribunales = [
  "Corte Suprema de Justicia",
  "Tribunal Constitucional",
  "Corte Superior de Lima",
  "Corte Superior de Arequipa",
  "Sala Penal Nacional"
]

const salas = [
  "Sala Civil Transitoria",
  "Sala Civil Permanente",
  "Sala Penal Transitoria",
  "Sala Penal Permanente",
  "Sala Constitucional y Social",
  "Primera Sala Civil",
  "Segunda Sala Civil"
]

const tiposResolucion = [
  "Sentencia",
  "Auto",
  "Resolución",
  "Acuerdo Plenario",
  "Ejecutoria Vinculante"
]

const gradosVinculancia = [
  "Ejecutoria Vinculante",
  "Acuerdo Plenario",
  "Jurisprudencia Uniforme",
  "Relevante"
]

export function SearchFilters({ onSearch, onReset }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    tribunal: [],
    sala: [],
    tipoResolucion: [],
    articulos: [],
    gradoVinculancia: []
  })
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [articleInput, setArticleInput] = useState("")

  const handleArrayFilterChange = (key: keyof SearchFilters, value: string, checked: boolean) => {
    setFilters(prev => {
      const currentArray = prev[key] as string[]
      if (checked) {
        return { ...prev, [key]: [...currentArray, value] }
      } else {
        return { ...prev, [key]: currentArray.filter(item => item !== value) }
      }
    })
  }

  const removeFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).filter(item => item !== value)
    }))
  }

  const addArticle = () => {
    if (articleInput.trim() && !filters.articulos.includes(articleInput.trim())) {
      setFilters(prev => ({
        ...prev,
        articulos: [...prev.articulos, articleInput.trim()]
      }))
      setArticleInput("")
    }
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleReset = () => {
    setFilters({
      query: "",
      tribunal: [],
      sala: [],
      tipoResolucion: [],
      articulos: [],
      gradoVinculancia: []
    })
    setSelectedDate(undefined)
    setArticleInput("")
    onReset()
  }

  const hasActiveFilters = filters.tribunal.length > 0 || filters.sala.length > 0 || 
                         filters.tipoResolucion.length > 0 || filters.articulos.length > 0 || 
                         filters.gradoVinculancia.length > 0 || filters.fechaDesde || filters.fechaHasta

  return (
    <Card className="w-full max-w-4xl" data-testid="search-filters">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Filtros de Búsqueda Avanzada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Query */}
        <div className="space-y-2">
          <Label htmlFor="search-query">Términos de búsqueda</Label>
          <Input
            id="search-query"
            placeholder="Ingrese palabras clave, hechos o conceptos jurídicos..."
            value={filters.query}
            onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            data-testid="input-search-query"
          />
        </div>

        {/* Tribunal Filter */}
        <div className="space-y-2">
          <Label>Tribunal</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tribunales.map((tribunal) => (
              <div key={tribunal} className="flex items-center space-x-2">
                <Checkbox
                  id={`tribunal-${tribunal}`}
                  checked={filters.tribunal.includes(tribunal)}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('tribunal', tribunal, checked as boolean)
                  }
                  data-testid={`filter-tribunal-${tribunal.toLowerCase().replace(/\s+/g, '-')}`}
                />
                <Label htmlFor={`tribunal-${tribunal}`} className="text-sm">
                  {tribunal}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Sala Filter */}
        <div className="space-y-2">
          <Label>Sala/Sección</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {salas.map((sala) => (
              <div key={sala} className="flex items-center space-x-2">
                <Checkbox
                  id={`sala-${sala}`}
                  checked={filters.sala.includes(sala)}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('sala', sala, checked as boolean)
                  }
                  data-testid={`filter-sala-${sala.toLowerCase().replace(/\s+/g, '-')}`}
                />
                <Label htmlFor={`sala-${sala}`} className="text-sm">
                  {sala}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Tipo de Resolución */}
        <div className="space-y-2">
          <Label>Tipo de Resolución</Label>
          <div className="flex flex-wrap gap-2">
            {tiposResolucion.map((tipo) => (
              <div key={tipo} className="flex items-center space-x-2">
                <Checkbox
                  id={`tipo-${tipo}`}
                  checked={filters.tipoResolucion.includes(tipo)}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('tipoResolucion', tipo, checked as boolean)
                  }
                  data-testid={`filter-tipo-${tipo.toLowerCase().replace(/\s+/g, '-')}`}
                />
                <Label htmlFor={`tipo-${tipo}`} className="text-sm">
                  {tipo}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Grado de Vinculancia */}
        <div className="space-y-2">
          <Label>Grado de Vinculancia</Label>
          <div className="flex flex-wrap gap-2">
            {gradosVinculancia.map((grado) => (
              <div key={grado} className="flex items-center space-x-2">
                <Checkbox
                  id={`grado-${grado}`}
                  checked={filters.gradoVinculancia.includes(grado)}
                  onCheckedChange={(checked) => 
                    handleArrayFilterChange('gradoVinculancia', grado, checked as boolean)
                  }
                  data-testid={`filter-grado-${grado.toLowerCase().replace(/\s+/g, '-')}`}
                />
                <Label htmlFor={`grado-${grado}`} className="text-sm">
                  {grado}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Artículos */}
        <div className="space-y-2">
          <Label>Artículos invocados</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Art. 1969 CC, Art. 27 Const."
              value={articleInput}
              onChange={(e) => setArticleInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addArticle()}
              data-testid="input-article"
            />
            <Button onClick={addArticle} variant="outline" data-testid="button-add-article">
              Agregar
            </Button>
          </div>
          {filters.articulos.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.articulos.map((articulo) => (
                <Badge key={articulo} variant="secondary" className="text-xs">
                  {articulo}
                  <button
                    onClick={() => removeFilter('articulos', articulo)}
                    className="ml-1 hover:text-destructive"
                    data-testid={`remove-article-${articulo}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Fecha desde</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-date-from"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.fechaDesde ? format(filters.fechaDesde, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.fechaDesde}
                  onSelect={(date) => setFilters(prev => ({ ...prev, fechaDesde: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>Fecha hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-date-to"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.fechaHasta ? format(filters.fechaHasta, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.fechaHasta}
                  onSelect={(date) => setFilters(prev => ({ ...prev, fechaHasta: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <Label className="text-sm font-medium">Filtros activos:</Label>
            <div className="flex flex-wrap gap-1">
              {[...filters.tribunal, ...filters.sala, ...filters.tipoResolucion, ...filters.gradoVinculancia].map((filter) => (
                <Badge key={filter} variant="outline" className="text-xs">
                  {filter}
                </Badge>
              ))}
              {filters.articulos.map((articulo) => (
                <Badge key={articulo} variant="secondary" className="text-xs">
                  {articulo}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSearch} className="flex-1" data-testid="button-search">
            <Search className="h-4 w-4 mr-2" />
            Buscar jurisprudencia
          </Button>
          <Button onClick={handleReset} variant="outline" data-testid="button-reset">
            Limpiar filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}