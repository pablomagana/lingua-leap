import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakBadge({ count, atRisk }: { count: number; atRisk?: boolean }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold",
        count > 0
          ? "bg-[color:var(--streak)]/15 text-[color:var(--streak)]"
          : "bg-muted text-muted-foreground",
        atRisk && "animate-pulse",
      )}
    >
      <Flame className="h-4 w-4" fill={count > 0 ? "currentColor" : "none"} />
      {count}
    </div>
  );
}
