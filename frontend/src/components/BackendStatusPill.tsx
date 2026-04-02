import { useBackendHealth } from "@/hooks/useBackendHealth";
import { cn } from "@/lib/utils";
import { getApiBase } from "@/lib/api";

export function BackendStatusPill() {
  const { data, isError, isPending } = useBackendHealth();

  const label = (() => {
    if (isPending) return "Checking…";
    if (isError) return "Offline";
    if (data?.db === "connected") return "DB OK";
    if (data?.db === "unreachable") return "No DB";
    return data?.db ? `DB: ${data.db}` : "Unknown";
  })();

  const title = `${getApiBase()} · ${isError ? "request failed" : `db=${data?.db ?? "—"} · v${data?.version ?? "—"}`}`;

  return (
    <>
      {/* Compact dot on very small screens (was fully hidden before xl — felt “blank”) */}
      <div
        className="sm:hidden flex items-center"
        title={title}
        aria-label={title}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full shrink-0",
            isPending && "bg-white/50 animate-pulse",
            isError && "bg-amber-300",
            !isPending && !isError && data?.db === "connected" && "bg-emerald-300",
            !isPending && !isError && data?.db !== "connected" && "bg-amber-300",
          )}
        />
      </div>
      <div
        className={cn(
          "hidden sm:flex flex-col items-end text-[10px] leading-tight max-w-[8.5rem]",
          "text-white/80 font-medium",
        )}
        title={title}
      >
        <span className="uppercase tracking-wide opacity-70">Backend</span>
        <span
          className={cn(
            "truncate",
            isError && "text-amber-200",
            data?.db === "connected" && "text-emerald-200",
          )}
        >
          {label}
        </span>
      </div>
    </>
  );
}
