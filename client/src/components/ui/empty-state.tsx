import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Friendly, on-brand empty state — replaces bare "No X yet." gray text.
 * Use anywhere a list/table can be legitimately empty (new user, fresh project, etc.)
 * so the page never reads as broken or unfinished.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 rounded-xl border-2 border-dashed border-border bg-muted/30",
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
