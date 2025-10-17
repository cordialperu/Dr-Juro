import { useQuery } from "@tanstack/react-query";

export type UnmsmSearchResult = {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  issued?: string;
  handle?: string;
  url: string;
  repositoryUrl: string;
  source: string;
};

export type UnmsmSearchResponse = {
  term: string;
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
  };
  results: UnmsmSearchResult[];
};

async function fetchUnmsmResults(params: { query: string; page?: number; size?: number }) {
  const searchParams = new URLSearchParams();
  searchParams.set("query", params.query);
  if (typeof params.page === "number") {
    searchParams.set("page", String(params.page));
  }
  if (typeof params.size === "number") {
    searchParams.set("size", String(params.size));
  }

  const response = await fetch(`/api/search/unmsm?${searchParams.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || "No se pudo consultar UNMSM");
  }

  return (await response.json()) as UnmsmSearchResponse;
}

export function useUnmsmSearch(query: string, options?: { enabled?: boolean; page?: number; size?: number }) {
  const enabled = options?.enabled ?? Boolean(query);
  const page = options?.page;
  const size = options?.size;

  return useQuery<UnmsmSearchResponse, Error>({
    queryKey: ["unmsm", { query, page, size }],
    queryFn: () => fetchUnmsmResults({ query, page, size }),
    enabled,
    staleTime: 1000 * 60,
  });
}
