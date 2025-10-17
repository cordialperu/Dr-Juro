import { Client, InsertClient, Case, InsertCase, User, Doctrina, InsertDoctrina } from "@shared/schema";

export type AuthProfile = Pick<User, "id" | "username" | "createdAt">;
export type LoginInput = { username: string; password: string };

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (typeof data === "object" && data !== null) {
        const errorMessage =
          typeof (data as { error?: unknown }).error === "string"
            ? (data as { error?: string }).error
            : undefined;
        if (errorMessage) {
          message = errorMessage;
        }
      }
    } catch {
      const text = await res.text().catch(() => "");
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  if (res.status === 204 || res.headers.get("Content-Length") === "0") {
    return undefined as T;
  }

  const contentType = res.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }

  const text = await res.text();
  return text as unknown as T;
}

const defaultHeaders = Object.freeze({
  "Content-Type": "application/json",
});

const withCredentials: RequestInit = Object.freeze({
  credentials: "include",
});

export async function getClients(): Promise<Client[]> {
  const res = await fetch("/api/clients", {
    ...withCredentials,
  });
  return handleResponse<Client[]>(res);
}

export async function createClient(input: InsertClient): Promise<Client> {
  const res = await fetch("/api/clients", {
    ...withCredentials,
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(input),
  });
  return handleResponse<Client>(res);
}

export async function getCases(): Promise<Case[]> {
  const res = await fetch("/api/cases", {
    ...withCredentials,
  });
  return handleResponse<Case[]>(res);
}

export async function createCase(input: InsertCase): Promise<Case> {
  const res = await fetch("/api/cases", {
    ...withCredentials,
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(input),
  });
  return handleResponse<Case>(res);
}

export type DoctrinaQuery = {
  caseTitle?: string;
  caseDescription?: string;
  search?: string;
  keywords?: string;
};

export async function getDoctrinas(params?: DoctrinaQuery): Promise<Doctrina[]> {
  const qs = new URLSearchParams();
  if (params) {
    if (params.caseTitle) qs.set("caseTitle", params.caseTitle);
    if (params.caseDescription) qs.set("caseDescription", params.caseDescription);
    if (params.search) qs.set("search", params.search);
    if (params.keywords) qs.set("keywords", params.keywords);
  }

  const url = qs.size > 0 ? `/api/doctrinas?${qs.toString()}` : "/api/doctrinas";
  const res = await fetch(url, {
    ...withCredentials,
  });
  return handleResponse<Doctrina[]>(res);
}

export async function createDoctrina(input: InsertDoctrina): Promise<Doctrina> {
  const res = await fetch("/api/doctrinas", {
    ...withCredentials,
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(input),
  });
  return handleResponse<Doctrina>(res);
}

export async function updateCase(
  id: string,
  input: Partial<Omit<InsertCase, "clientId"> & { clientId?: string }> & Record<string, unknown>,
): Promise<Case> {
  const res = await fetch(`/api/cases/${id}`, {
    ...withCredentials,
    method: "PATCH",
    headers: defaultHeaders,
    body: JSON.stringify(input),
  });
  return handleResponse<Case>(res);
}

export async function deleteCase(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/cases/${id}`, {
    ...withCredentials,
    method: "DELETE",
  });
  return handleResponse<{ success: boolean }>(res);
}

export async function getProfile(): Promise<AuthProfile> {
  const res = await fetch("/api/auth/profile", {
    ...withCredentials,
  });
  return handleResponse<AuthProfile>(res);
}

export async function login(input: LoginInput): Promise<AuthProfile> {
  const res = await fetch("/api/auth/login", {
    ...withCredentials,
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(input),
  });
  return handleResponse<AuthProfile>(res);
}

export async function register(input: LoginInput): Promise<AuthProfile> {
  const res = await fetch("/api/auth/register", {
    ...withCredentials,
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(input),
  });
  return handleResponse<AuthProfile>(res);
}

export async function logout(): Promise<void> {
  const res = await fetch("/api/auth/logout", {
    ...withCredentials,
    method: "POST",
  });
  if (!res.ok) {
    let message = `${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (typeof data === "object" && data !== null && "error" in data && typeof (data as { error?: unknown }).error === "string") {
        message = (data as { error: string }).error;
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
}
