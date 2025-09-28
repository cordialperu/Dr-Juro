import { SearchFilters } from '../SearchFilters'

// todo: remove mock functionality
export default function SearchFiltersExample() {
  const handleSearch = (filters: any) => {
    console.log('Buscar con filtros:', filters)
  }
  
  const handleReset = () => {
    console.log('Limpiar filtros')
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <SearchFilters onSearch={handleSearch} onReset={handleReset} />
    </div>
  )
}