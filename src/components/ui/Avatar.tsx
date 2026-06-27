import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  seed?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-2xl",
};

export function getAvatarColorClass(seed?: string, fallback?: string, alt?: string) {
  const colors = ["bg-cyan-500", "bg-blue-600", "bg-violet-600"];
  const key = (seed || fallback || alt || "").toString();
  const hash = Array.from(key).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function Avatar({ src, alt = "", fallback, seed, size = "md", className, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false);
  const initials = React.useMemo(() => {
    if (fallback) return fallback.slice(0, 2).toUpperCase();
    return (alt || "?").slice(0, 1).toUpperCase();
  }, [fallback, alt]);

  const bgClass = React.useMemo(
    () => getAvatarColorClass(seed, fallback, alt),
    [seed, fallback, alt]
  );

  return (
    <div
      className={cn(
        "relative flex-shrink-0 overflow-hidden rounded-full text-white font-semibold flex items-center justify-center ring-2 ring-white dark:ring-slate-900",
        bgClass,
        sizeMap[size],
        className
      )}
      {...props}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          onError={() => setError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
