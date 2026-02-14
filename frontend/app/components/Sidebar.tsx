"use client";

import {
  Inbox,
  Activity,
  BarChart3,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

interface NavItem {
  label: string;
  icon: typeof Inbox;
  href: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Inbox", icon: Inbox, href: "/", badge: 3 },
  { label: "Loop Tracker", icon: Activity, href: "#loop-tracker" },
  { label: "Analytics", icon: BarChart3, href: "#analytics" },
  { label: "Settings", icon: Settings, href: "#settings" },
];

interface SidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
}

export default function Sidebar({ activePath, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <ShieldCheck className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight text-slate-900">
            LoopGuard
          </span>
          <span className="text-[11px] leading-tight text-slate-400">
            Diagnostic Tracker
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = activePath === item.href;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.href)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px]",
                  isActive ? "text-blue-600" : "text-slate-400"
                )}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
            SP
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-700">
              Dr. Sarah Patel
            </span>
            <span className="text-[11px] text-slate-400">Internal Medicine</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
