import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getStoredToken, setStoredRefresh, setStoredToken } from "@/lib/api";
import type { EmployeeMe, LoginResponse } from "@/types/api";

export type UserRole = "audience" | "speaker" | "organizer" | "admin";

function mapRole(r: string): UserRole | null {
  if (r === "platform_admin") return "admin";
  // Governance (PS stakeholder): campaign / comms surfaces — use organizer nav + campaigns
  if (r === "governance") return "organizer";
  if (r === "audience" || r === "speaker" || r === "organizer" || r === "admin") return r;
  return null;
}

export type AuthContextType = {
  user: EmployeeMe | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole;
  setRole: (r: UserRole) => void;
  availableRoles: UserRole[];
  loginDev: () => Promise<void>;
  loginPending: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [activeRole, setActiveRole] = useState<UserRole>("audience");

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<EmployeeMe>("/auth/me"),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.isError) {
      setStoredToken(null);
      setStoredRefresh(null);
      setToken(null);
    }
  }, [meQuery.isError]);

  const user = meQuery.data ?? null;

  const availableRoles = useMemo(() => {
    if (!user) return ["audience"] as UserRole[];
    const m = new Set<UserRole>();
    for (const r of user.roles) {
      const x = mapRole(r);
      if (x) m.add(x);
    }
    if (m.size === 0) m.add("audience");
    const order: UserRole[] = ["admin", "organizer", "speaker", "audience"];
    return order.filter((x) => m.has(x));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setActiveRole("audience");
      return;
    }
    if (!availableRoles.includes(activeRole)) {
      setActiveRole(availableRoles[0] ?? "audience");
    }
  }, [user, availableRoles, activeRole]);

  const loginMutation = useMutation({
    mutationFn: () =>
      apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          mode: "dev",
          email: "dev.user@example.com",
          first_name: "Dev",
          last_name: "User",
          roles: ["audience", "speaker", "organizer", "admin", "platform_admin"],
        }),
      }),
    onSuccess: (data) => {
      setStoredToken(data.access_token);
      setStoredRefresh(data.refresh_token);
      setToken(data.access_token);
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const loginDev = useCallback(async () => {
    await loginMutation.mutateAsync();
  }, [loginMutation]);

  const logout = useCallback(() => {
    setStoredToken(null);
    setStoredRefresh(null);
    setToken(null);
    qc.removeQueries({ queryKey: ["auth", "me"] });
    qc.invalidateQueries({ queryKey: ["events"] });
  }, [qc]);

  const setRoleSafe = useCallback(
    (r: UserRole) => {
      if (availableRoles.includes(r)) setActiveRole(r);
    },
    [availableRoles],
  );

  const value: AuthContextType = {
    user,
    token,
    isLoading: !!token && meQuery.isPending,
    isAuthenticated: !!user,
    role: user ? activeRole : "audience",
    setRole: setRoleSafe,
    availableRoles,
    loginDev,
    loginPending: loginMutation.isPending,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** @deprecated use useAuth — kept for sidebar imports */
export function useRole() {
  const { role, setRole } = useAuth();
  return { role, setRole };
}

export const RoleProvider = AuthProvider;
