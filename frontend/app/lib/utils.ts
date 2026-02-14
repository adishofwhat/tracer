import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with clsx — single utility used across all components. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an ISO date string as "MMM d, yyyy" (e.g. "Jan 15, 2026"). */
export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00"); // avoid timezone shift
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
