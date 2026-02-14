"use client";

import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Brain,
} from "lucide-react";
import type { PatientCase, UrgencyLevel } from "@/app/lib/types";
import { cn, formatDate } from "@/app/lib/utils";

interface ResultCardProps {
  patientCase: PatientCase;
  isSelected: boolean;
  onClick: () => void;
}

const URGENCY_CONFIG: Record<
  UrgencyLevel,
  { dot: string; border: string; label: string; icon: typeof AlertTriangle }
> = {
  high: {
    dot: "bg-red-500",
    border: "border-l-red-500",
    label: "High",
    icon: AlertTriangle,
  },
  medium: {
    dot: "bg-amber-400",
    border: "border-l-amber-400",
    label: "Medium",
    icon: Clock,
  },
  low: {
    dot: "bg-slate-400",
    border: "border-l-slate-300",
    label: "Low",
    icon: CheckCircle2,
  },
};

export default function ResultCard({
  patientCase,
  isSelected,
  onClick,
}: ResultCardProps) {
  const urgency = patientCase.ai_analysis?.urgency_level ?? "low";
  const config = URGENCY_CONFIG[urgency];
  const UrgencyIcon = config.icon;

  const pendingOrders = patientCase.orders.filter(
    (o) => o.status === "pending"
  );
  const completedOrders = patientCase.orders.filter(
    (o) => o.status === "completed"
  );
  const hasAIFlags =
    patientCase.ai_analysis != null &&
    patientCase.ai_analysis.flags.length > 0;

  // Show the first result's test name as the "test type" line
  const primaryTest =
    patientCase.results[0]?.test_name ??
    patientCase.orders[0]?.test_name ??
    "—";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col rounded-xl border border-transparent border-l-[3px] px-4 py-3 text-left transition-all duration-150",
        // Hover: lift + shadow
        "hover:-translate-y-[1px] hover:shadow-md hover:shadow-slate-200/60",
        // Selected state: blue left border + blue tint
        isSelected
          ? "border-l-blue-600 bg-blue-50/80 shadow-sm"
          : cn(config.border, "bg-white hover:bg-slate-50/80")
      )}
    >
      {/* Row 1: Name + urgency badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn("h-2 w-2 shrink-0 rounded-full", config.dot)}
          />
          <span className="truncate text-sm font-semibold text-slate-900">
            {patientCase.patient.demographics.name ?? "Unknown"}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            urgency === "high" && "bg-red-50 text-red-700",
            urgency === "medium" && "bg-amber-50 text-amber-700",
            urgency === "low" && "bg-slate-100 text-slate-500"
          )}
        >
          <UrgencyIcon className="h-3 w-3" />
          {config.label}
        </span>
      </div>

      {/* Row 2: Demographics + visit date */}
      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
        <span>
          {patientCase.patient.demographics.age}
          {patientCase.patient.demographics.sex}
        </span>
        <span className="text-slate-300">|</span>
        <span>{patientCase.patient.demographics.mrn}</span>
        <span className="ml-auto text-slate-400">
          {formatDate(patientCase.visit_date)}
        </span>
      </div>

      {/* Row 3: Test type + primary hypothesis */}
      <p className="mt-1.5 truncate text-xs font-medium text-slate-700">
        {primaryTest}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-slate-500">
        {patientCase.diagnostic_hypothesis.primary}
      </p>

      {/* Row 4: Status chips + AI Alert */}
      <div className="mt-2 flex items-center gap-1.5">
        {/* Order status summary */}
        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          {completedOrders.length}/{patientCase.orders.length} complete
        </span>

        {pendingOrders.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
            <Clock className="h-2.5 w-2.5" />
            {pendingOrders.length} pending
          </span>
        )}

        {/* AI Alert badge */}
        {hasAIFlags && (
          <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
            <Brain className="h-2.5 w-2.5" />
            AI Alert
          </span>
        )}

        <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}
