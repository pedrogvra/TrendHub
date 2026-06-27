/**
 * EmptyState
 * ----------
 * Componente de estado vazio reutilizável.
 */
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-10 text-center dark:border-slate-700 dark:bg-slate-900/30",
        className
      )}
    >
      {icon && <div className="mb-3 text-cyan-500">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
