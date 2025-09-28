import { CaseCard } from '../CaseCard'

// todo: remove mock functionality
const mockCases = [
  {
    id: "1",
    title: "Demanda por Daños y Perjuicios",
    client: "Constructora Lima SAC",
    status: "active" as const,
    priority: "high" as const,
    caseNumber: "EXP-2024-001234",
    court: "2º Juzgado Civil de Lima",
    nextHearing: "15 Oct 2024",
    lastActivity: "hace 2 horas",
    documentsCount: 23,
    precedentsFound: 8
  },
  {
    id: "2",
    title: "Proceso Laboral - Despido Arbitrario",
    client: "Carlos Mendoza",
    status: "pending" as const,
    priority: "medium" as const,
    caseNumber: "EXP-2024-005678",
    court: "5º Juzgado Laboral de Lima",
    lastActivity: "ayer",
    documentsCount: 15,
    precedentsFound: 12
  }
]

export default function CaseCardExample() {
  return (
    <div className="grid gap-4 p-6 max-w-2xl">
      {mockCases.map((case_) => (
        <CaseCard key={case_.id} {...case_} />
      ))}
    </div>
  )
}