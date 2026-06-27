import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800",
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  activeValue: string;
  onSelect: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, activeValue, onSelect, children, className }: TabsTriggerProps) {
  const isActive = value === activeValue;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
        isActive
          ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white"
          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}
