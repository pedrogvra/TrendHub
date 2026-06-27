import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata data relativa ("agora", "há 5 min", etc.) sem dependências extras. */
export function formatRelativeTime(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;

  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/** Formata data completa em pt-BR. */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Detecta se uma URL aponta para vídeo baseado na extensão ou no type. */
export function detectMediaType(url: string | null | undefined): "image" | "video" | null {
  if (!url) return null;
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (/\.(mp4|webm|mov|ogg|mkv)(\?|#|$)/.test(pathname)) return "video";
    if (/\.(png|jpe?g|gif|webp|avif|bmp)(\?|#|$)/.test(pathname)) return "image";
  } catch {
    // URL inválida
  }
  return "image"; // fallback
}
