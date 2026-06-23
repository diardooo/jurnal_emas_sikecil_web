import { cn } from "@/lib/utils";

const dayLabels = ["S", "S", "R", "K", "J", "S", "M"];

/**
 * Compact calendar heatmap of the last `weeks` weeks (default 4).
 * Rows = weeks (oldest → newest), columns = days (Sen–Min).
 */
export function HabitHeatmap({
  history,
  weeks = 4,
}: {
  history: boolean[];
  weeks?: number;
}) {
  const days = weeks * 7;
  const recent = history.slice(-days);
  const rows: boolean[][] = [];
  for (let i = 0; i < recent.length; i += 7) {
    rows.push(recent.slice(i, i + 7));
  }

  return (
    <div className="inline-block">
      <div className="mb-1 grid grid-cols-7 gap-1.5">
        {dayLabels.map((d, i) => (
          <span
            key={i}
            className="text-center text-[10px] font-semibold text-muted-foreground"
          >
            {d}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((done, di) => (
              <div
                key={di}
                className={cn(
                  "h-5 w-5 rounded-md transition-colors",
                  done ? "heat-4" : "heat-0",
                )}
                title={done ? "Dicentang ✓" : "Terlewat"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
