export type ElectronWindow = Window & {
  electronAPI?: { isElectron?: boolean; apiBase?: string };
};

const TOKEN_KEY = "eventhub_access_token";
const REFRESH_KEY = "eventhub_refresh_token";

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const w = window as ElectronWindow;
    if (w.electronAPI?.apiBase) {
      return w.electronAPI.apiBase.replace(/\/$/, "");
    }
  }
  const env = import.meta.env.VITE_API_BASE as string | undefined;
  return (env ?? "http://127.0.0.1:8000").replace(/\/$/, "");
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getStoredRefresh(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setStoredRefresh(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(REFRESH_KEY, token);
  else localStorage.removeItem(REFRESH_KEY);
}

export async function apiFetch<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const url = `${getApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers });

  if (
    res.status === 401 &&
    !retried &&
    !path.startsWith("/auth/login") &&
    !path.startsWith("/auth/refresh")
  ) {
    const rt = getStoredRefresh();
    if (rt) {
      const refreshRes = await fetch(`${getApiBase()}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (refreshRes.ok) {
        const body = (await refreshRes.json()) as {
          access_token: string;
          refresh_token?: string | null;
        };
        setStoredToken(body.access_token);
        if (body.refresh_token) setStoredRefresh(body.refresh_token);
        return apiFetch<T>(path, init, true);
      }
      setStoredRefresh(null);
      setStoredToken(null);
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Authenticated download (e.g. calendar ICS). */
export async function apiDownloadBlob(path: string): Promise<Blob> {
  const url = `${getApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  return res.blob();
}
