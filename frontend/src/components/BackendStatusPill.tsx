import { useBackendHealth } from "@/hooks/useBackendHealth";
import { cn } from "@/lib/utils";
import { getApiBase } from "@/lib/api";

export function BackendStatusPill() {
  const { data, isError, isPending } = useBackendHealth();

  const label = (() => {
    if (isPending) return "API…";
    if (isError) return "API offline";
    if (data?.db === "connected") return "PostgreSQL";
    return `DB: ${data?.db ?? "?"}`;
  })();

  return (
    <div
      className={cn(
        "hidden xl:flex flex-col items-end text-[10px] leading-tight max-w-[8.5rem]",
        "text-white/80 font-medium",
      )}
      title={`${getApiBase()} · v${data?.version ?? "—"}`}
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
  );
}
