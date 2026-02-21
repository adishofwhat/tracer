"use client";

import {
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { PatientCase } from "@/app/lib/types";
import { cn, formatDate } from "@/app/lib/utils";

interface LoopTrackerProps {
  patientCase: PatientCase;
}

interface TimelineStep {
  label: string;
  detail: string;
  date?: string;
  status: "complete" | "pending" | "failed" | "warning";
}

function buildTimeline(pc: PatientCase): TimelineStep[] {
  const steps: TimelineStep[] = [];

  // Step 1 — Clinical encounter
  steps.push({
    label: "Clinical Encounter",
    detail: `${pc.clinical_note.provider}${pc.clinical_note.specialty ? ` — ${pc.clinical_note.specialty}` : ""}`,
    date: pc.visit_date,
    status: "complete",
  });

  // Step 2 — Orders placed
  steps.push({
    label: "Orders Placed",
    detail: `${pc.orders.length} test(s) ordered`,
    date: pc.visit_date,
    status: "complete",
  });

  // Step 3 — Results received (or partial)
  const completed = pc.orders.filter((o) => o.status === "completed");
  const pending = pc.orders.filter((o) => o.status === "pending");

  if (completed.length > 0 && pending.length === 0) {
    steps.push({
      label: "Results Received",
      detail: `All ${completed.length} results returned`,
      date: completed[completed.length - 1].result_date ?? undefined,
      status: "complete",
    });
  } else if (completed.length > 0 && pending.length > 0) {
    steps.push({
      label: "Partial Results",
      detail: `${completed.length} received, ${pending.length} pending`,
      date: completed[completed.length - 1].result_date ?? undefined,
      status: "warning",
    });
  } else {
    steps.push({
      label: "Awaiting Results",
      detail: `${pending.length} pending`,
      status: "pending",
    });
  }

  // Step 4 — Follow-up / Loop closure
  if (pending.length > 0) {
    const longestWait = Math.max(...pending.map((o) => o.days_pending ?? 0));
    const reason = pending[0].failure_reason ?? "Unknown delay";
    steps.push({
      label: "Follow-up Required",
      detail: `${reason} (${longestWait}d pending)`,
      status: longestWait > 14 ? "failed" : "warning",
    });
  } else {
    steps.push({
      label: "Loop Closed",
      detail: "All orders resolved",
      status: "complete",
    });
  }

  return steps;
}

const STATUS_ICON = {
  complete: CheckCircle2,
  pending: Clock,
  failed: XCircle,
  warning: AlertTriangle,
} as const;

const STATUS_STYLE = {
  complete: {
    ring: "border-green-500 bg-green-50",
    icon: "text-green-600",
    line: "bg-green-300",
  },
  pending: {
    ring: "border-slate-300 bg-slate-50",
    icon: "text-slate-400",
    line: "bg-slate-200",
  },
  failed: {
    ring: "border-red-500 bg-red-50",
    icon: "text-red-600",
    line: "bg-red-300",
  },
  warning: {
    ring: "border-amber-500 bg-amber-50",
    icon: "text-amber-600",
    line: "bg-amber-300",
  },
} as const;

export default function LoopTracker({ patientCase }: LoopTrackerProps) {
  const steps = buildTimeline(patientCase);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
        <Activity className="h-4 w-4 text-blue-600" />
        <span className="text-xs font-semibold text-slate-800">
          Diagnostic Loop Timeline
        </span>
      </div>

      <div className="px-4 py-3">
        {steps.map((step, i) => {
          const style = STATUS_STYLE[step.status];
          const Icon = STATUS_ICON[step.status];
          const isLast = i === steps.length - 1;

          return (
            <div key={i} className="flex gap-3">
              {/* Vertical timeline */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2",
                    style.ring
                  )}
                >
                  <Icon className={cn("h-3 w-3", style.icon)} />
                </div>
                {!isLast && (
                  <div className={cn("my-0.5 h-6 w-0.5 rounded-full", style.line)} />
                )}
              </div>

              {/* Content */}
              <div className={cn("pb-3", isLast && "pb-0")}>
                <p className="text-xs font-semibold text-slate-800">
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-500">{step.detail}</p>
                {step.date && (
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {formatDate(step.date)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Failure mode banner */}
      {patientCase.failure_mode && (
        <div className="flex items-start gap-2 border-t border-red-100 bg-red-50/50 px-4 py-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
          <div>
            <p className="text-[11px] font-semibold text-red-700">
              Failure Mode
            </p>
            <p className="text-[11px] text-red-600">
              {patientCase.failure_mode}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

