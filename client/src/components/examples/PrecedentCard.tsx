import { PrecedentCard } from '../PrecedentCard'

// todo: remove mock functionality
const mockPrecedents = [
  {
    id: "1",
    title: "Responsabilidad Civil por Daños en Obras de Construcción",
    court: "Corte Suprema de Justicia",
    chamber: "Sala Civil Transitoria",
    date: "15 Mar 2023",
    caseNumber: "CAS-2023-1845",
    bindingLevel: "ejecutoria_vinculante" as const,
    summary: "Se establece que el contratista es responsable por los daños causados por defectos en la construcción, incluso después de la entrega de la obra, cuando estos se deben a negligencia en el cumplimiento de las normas técnicas.",
    confidence: 92,
    articlesMatched: ["Art. 1969 CC", "Art. 1970 CC", "Art. 1762 CC"],
    excerpt: "La responsabilidad del constructor no se extingue con la entrega de la obra, sino que subsiste por los daños que puedan manifestarse posteriormente por vicios ocultos o defectos en la construcción.",
    officialLink: "https://jurisprudencia.pj.gob.pe/example1"
  },
  {
    id: "2",
    title: "Acuerdo Plenario sobre Despido Arbitrario en el Sector Privado",
    court: "Corte Suprema de Justicia",
    chamber: "Sala de Derecho Constitucional y Social",
    date: "8 Nov 2022",
    caseNumber: "AP-2022-07",
    bindingLevel: "acuerdo_plenario" as const,
    summary: "Establece los criterios uniformes para determinar la procedencia de la reposición por despido arbitrario en el régimen laboral privado, incluyendo los supuestos de protección especial.",
    confidence: 88,
    articlesMatched: ["Art. 27 Const.", "Art. 22 Const."],
    excerpt: "El despido lesivo de derechos fundamentales procede cuando se acredita que la decisión de despedir se adoptó con motivo discriminatorio o en represalia por el ejercicio de derechos fundamentales.",
    officialLink: "https://jurisprudencia.pj.gob.pe/example2"
  }
]

export default function PrecedentCardExample() {
  return (
    <div className="space-y-4 p-6 max-w-4xl">
      {mockPrecedents.map((precedent) => (
        <PrecedentCard key={precedent.id} {...precedent} />
      ))}
    </div>
  )
}