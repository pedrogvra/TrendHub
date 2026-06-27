import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "cyan" | "blue" | "violet" | "gray" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    cyan: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
    blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    gray: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
    outline: "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
