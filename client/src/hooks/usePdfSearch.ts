import { useQuery } from "@tanstack/react-query";

export type PdfSearchMatch = {
  page: number;
  preview: {
    before: string;
    match: string;
    after: string;
  };
  url: string;
};

export type PdfSearchResponse = {
  matches: PdfSearchMatch[];
  totalMatches: number;
  truncated: boolean;
};

async function fetchPdfSearch(filename: string, query: string) {
  const params = new URLSearchParams();
  params.set("file", filename);
  params.set("query", query);

  const response = await fetch(`/api/pdf-search?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || "No se pudo buscar en el PDF");
  }

  return (await response.json()) as PdfSearchResponse;
}

export function usePdfSearch(filename: string | undefined, query: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? Boolean(filename && query.trim().length > 0);

  return useQuery<PdfSearchResponse, Error>({
    queryKey: ["pdf-search", { filename, query }],
    queryFn: () => {
      if (!filename) {
        throw new Error("Debes seleccionar un PDF");
      }
      return fetchPdfSearch(filename, query);
    },
    enabled,
  });
}
