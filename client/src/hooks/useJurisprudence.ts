import { useMutation } from "@tanstack/react-query";

export type JurisprudenceResponse = {
  term: string;
  answer: string;
  references?: string[];
};

export type JurisprudenceRequest = {
  query: string;
};

async function searchJurisprudence(request: JurisprudenceRequest): Promise<JurisprudenceResponse> {
  const res = await fetch("/api/jurisprudence/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || "No se pudo consultar la jurisprudencia.");
  }

  return res.json() as Promise<JurisprudenceResponse>;
}

export function useJurisprudenceSearch() {
  return useMutation<JurisprudenceResponse, Error, JurisprudenceRequest>({
    mutationFn: searchJurisprudence,
    mutationKey: ["jurisprudence-search"],
  });
}
