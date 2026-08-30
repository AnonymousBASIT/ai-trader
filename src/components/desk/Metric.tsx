import type { ReactNode } from "react";
import { Tip } from "@/components/ui/tooltip";
import { TIPS } from "@/lib/desk/tooltips";
import { cn } from "@/lib/utils";

export function Metric({
  tip,
  label,
  value,
  sub,
  tone,
  mono = true,
}: {
  tip?: keyof typeof TIPS;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "up" | "down" | "warn" | "muted";
  mono?: boolean;
}) {
  const color =
    tone === "up"
      ? "text-up"
      : tone === "down"
        ? "text-down"
        : tone === "warn"
          ? "text-warn"
          : "text-fg";
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1">
        {tip ? (
          <Tip label={TIPS[tip]} className="text-label uppercase tracking-wider">
            <span>{label}</span>
            <span className="text-faint">i</span>
          </Tip>
        ) : (
          <span className="text-label uppercase tracking-wider text-faint">{label}</span>
        )}
      </div>
      <div className={cn("mt-0.5 truncate text-sm", mono && "font-mono tabular", color)}>{value}</div>
      {sub ? <div className="mt-0.5 truncate font-mono text-label text-muted">{sub}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  tip,
  children,
  className,
}: {
  title: string;
  tip?: keyof typeof TIPS;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("desk-enter flex min-h-0 flex-col rounded-md bg-surface/90 shadow-border backdrop-blur-[2px]", className)}>
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        {tip ? (
          <Tip label={TIPS[tip]} className="text-label uppercase tracking-widest text-muted">
            {title}
          </Tip>
        ) : (
          <h2 className="text-label uppercase tracking-widest text-muted">{title}</h2>
        )}
      </header>
      <div className="min-h-0 flex-1 p-3">{children}</div>
    </section>
  );
}
