export type ElectronWindow = Window & {
  electronAPI?: { isElectron?: boolean; apiBase?: string };
};

const TOKEN_KEY = "eventhub_access_token";

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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
