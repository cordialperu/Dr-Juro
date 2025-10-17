import axios, { AxiosError } from "axios";
import { HttpError } from "../lib/http";

const UNMSM_BASE_URL = "https://cybertesis.unmsm.edu.pe/backend/api";

const unmsmClient = axios.create({
  baseURL: UNMSM_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "User-Agent": "DrJuro/1.0 (+https://drjuro.app)",
  },
});

type RawMetadataValue = {
  value?: string;
  language?: string | null;
};

type RawMetadata = Record<string, RawMetadataValue[]>;

type RawIndexableObject = {
  uuid?: string;
  id?: string;
  name?: string;
  handle?: string;
  metadata?: RawMetadata;
  _links?: {
    self?: { href?: string };
  };
};

type RawSearchObject = {
  _embedded?: {
    indexableObject?: RawIndexableObject;
  };
};

type RawSearchResponse = {
  _embedded?: {
    searchResult?: {
      _embedded?: {
        objects?: RawSearchObject[];
      };
    };
  };
  page?: {
    number?: number;
    size?: number;
    totalElements?: number;
    totalPages?: number;
  };
};

export type UnmsmSearchOptions = {
  query: string;
  page?: number;
  size?: number;
  sort?: string;
};

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

const getFirstMetadataValue = (metadata: RawMetadata | undefined, key: string) => {
  const values = metadata?.[key];
  if (!values || values.length === 0) {
    return undefined;
  }
  const entry = values.find((item) => typeof item?.value === "string" && item.value.trim().length > 0);
  return entry?.value?.trim();
};

const getAllMetadataValues = (metadata: RawMetadata | undefined, keys: string[]) => {
  const collected = new Set<string>();
  for (const key of keys) {
    const values = metadata?.[key];
    if (!values) {
      continue;
    }
    for (const item of values) {
      if (typeof item?.value === "string" && item.value.trim().length > 0) {
        collected.add(item.value.trim());
      }
    }
  }
  return Array.from(collected);
};

const buildHandleUrl = (handle?: string) => {
  if (!handle) {
    return undefined;
  }
  if (handle.startsWith("http")) {
    return handle;
  }
  return `https://cybertesis.unmsm.edu.pe/handle/${handle}`;
};

export async function searchUnmsm(options: UnmsmSearchOptions): Promise<UnmsmSearchResponse> {
  const trimmedQuery = options.query.trim();
  if (!trimmedQuery) {
    throw new HttpError(400, "Debes proporcionar un término de búsqueda válido.");
  }

  const params: Record<string, string | number> = {
    query: trimmedQuery,
    page: Math.max(0, options.page ?? 0),
    size: Math.max(1, Math.min(options.size ?? 10, 50)),
  };

  if (options.sort && options.sort.trim()) {
    params.sort = options.sort.trim();
  }

  try {
    const response = await unmsmClient.get<RawSearchResponse>("/discover/search/objects", { params });
    const data = response.data ?? {};
    const rawObjects =
      data._embedded?.searchResult?._embedded?.objects ?? [];

    const results: UnmsmSearchResult[] = rawObjects.map((entry) => {
      const indexable = entry._embedded?.indexableObject;
      const metadata = indexable?.metadata;

      const uuid = indexable?.uuid ?? indexable?.id ?? "";
      const handle = getFirstMetadataValue(metadata, "dc.identifier.uri") ?? buildHandleUrl(indexable?.handle);
      const repositoryUrl = indexable?._links?.self?.href
        ? new URL(indexable._links.self.href, UNMSM_BASE_URL).toString()
        : `${UNMSM_BASE_URL}/core/items/${uuid}`;
      const url = handle ?? repositoryUrl;

      const title =
        getFirstMetadataValue(metadata, "dc.title") ??
        indexable?.name ??
        "Recurso sin título";

      const authors = getAllMetadataValues(metadata, [
        "dc.contributor.author",
        "dc.creator",
        "dc.contributor",
      ]);

      const abstract = getFirstMetadataValue(metadata, "dc.description.abstract");
      const issued = getFirstMetadataValue(metadata, "dc.date.issued");

      return {
        id: uuid || url,
        title,
        authors,
        abstract,
        issued,
        handle,
        url,
        repositoryUrl,
        source: "UNMSM",
      } satisfies UnmsmSearchResult;
    });

    const pageInfo = data.page ?? {};
    const page = typeof pageInfo.number === "number" ? pageInfo.number : params.page;
    const size = typeof pageInfo.size === "number" ? pageInfo.size : params.size;
    const totalElements = typeof pageInfo.totalElements === "number" ? pageInfo.totalElements : results.length;
    const totalPages = typeof pageInfo.totalPages === "number"
      ? pageInfo.totalPages
      : Math.max(1, Math.ceil(totalElements / Number(size || 1)));
    const hasNext = (Number(page) + 1) < Number(totalPages);

    return {
      term: trimmedQuery,
      pagination: {
        page: Number(page),
        size: Number(size),
        totalElements: Number(totalElements),
        totalPages: Number(totalPages),
        hasNext,
      },
      results,
    };
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const message =
      status && status >= 400 && status < 600
        ? `Cybertesis UNMSM respondió con un estado ${status}.`
        : "No se pudo consultar Cybertesis UNMSM en este momento.";
    throw new HttpError(status ?? 502, message);
  }
}
