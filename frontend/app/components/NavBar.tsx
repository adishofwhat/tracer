"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { loadPatients } from "@/app/lib/dataLoader";

const NAV_LINKS = [
  { href: "/", label: "Results Inbox" },
  { href: "/loop-tracker", label: "Loop Tracker" },
] as const;

const patients = loadPatients();
const openLoops = patients.reduce(
  (sum, p) => sum + p.orders.filter((o) => o.status === "pending").length,
  0
);

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center min-w-0">
        <Link href="/" className="font-bold text-lg text-gray-900 hover:text-gray-700 shrink-0">
          Tracer
        </Link>
        <span className="text-sm text-gray-400 ml-2 hidden sm:inline">
          · Diagnostic Tracer
        </span>
        <Link href="/loop-tracker" className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-3 py-1 ml-4 sm:ml-6 hover:bg-red-100 transition-colors shrink-0">
          {openLoops} open loops
        </Link>
      </div>
      <div className="flex gap-4 sm:gap-6 shrink-0">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm ${
                isActive
                  ? "text-blue-600 font-semibold border-b-2 border-blue-600 pb-0.5"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
