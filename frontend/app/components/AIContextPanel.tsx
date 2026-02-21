"use client";

import {
  Brain,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  FlaskConical,
  ShieldAlert,
} from "lucide-react";
import type { PatientCase } from "@/app/lib/types";
import { cn, formatDate } from "@/app/lib/utils";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Props — now receives the full PatientCase, not just AIAnalysis
// ---------------------------------------------------------------------------
interface AIContextPanelProps {
  patientCase: PatientCase;
}

// ---------------------------------------------------------------------------
// Timeline builder (embedded — mirrors LoopTracker logic)
// ---------------------------------------------------------------------------
interface TimelineStep {
  label: string;
  detail: string;
  date?: string;
  status: "complete" | "pending" | "failed" | "warning";
}

function buildTimeline(pc: PatientCase): TimelineStep[] {
  const steps: TimelineStep[] = [];

  // 1 — Clinical Encounter
  steps.push({
    label: "Clinical Encounter",
    detail: `${pc.clinical_note.provider}${pc.clinical_note.specialty ? ` — ${pc.clinical_note.specialty}` : ""}`,
    date: pc.visit_date,
    status: "complete",
  });

  // 2 — Orders Placed
  steps.push({
    label: "Orders Placed",
    detail: `${pc.orders.length} test(s) ordered`,
    date: pc.visit_date,
    status: "complete",
  });

  // 3 — Results
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

  // 4 — Follow-up / Failure
  if (pending.length > 0) {
    const longestWait = Math.max(...pending.map((o) => o.days_pending ?? 0));
    steps.push({
      label: "Follow-up Required",
      detail: pc.failure_mode,
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

const STEP_ICON = {
  complete: CheckCircle2,
  pending: Clock,
  failed: XCircle,
  warning: AlertTriangle,
} as const;

const STEP_STYLE = {
  complete: { node: "text-green-600", line: "border-green-300" },
  pending: { node: "text-slate-400", line: "border-slate-200" },
  failed: { node: "text-red-600", line: "border-red-300" },
  warning: { node: "text-amber-500", line: "border-amber-300" },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AIContextPanel({ patientCase }: AIContextPanelProps) {
  const analysis = patientCase.ai_analysis;
  if (!analysis) return null;

  const [expandedSection, setExpandedSection] = useState<string | null>(
    "flags"
  );

  const toggle = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  const isHigh = analysis.urgency_level === "high";
  const timelineSteps = buildTimeline(patientCase);

  const completedOrders = patientCase.orders.filter(
    (o) => o.status === "completed"
  );
  const pendingOrders = patientCase.orders.filter(
    (o) => o.status === "pending"
  );

  return (
    <div className="overflow-hidden rounded-lg border border-blue-200 bg-blue-50">
      {/* ── 1. High-urgency alert banner ── */}
      {isHigh && (
        <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2.5">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <span className="text-xs font-bold uppercase tracking-wide text-red-700">
            Diagnostic Loop Alert
          </span>
          <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
            ACTION REQUIRED
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-2 border-b border-blue-200 px-4 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600">
          <Brain className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-slate-800">
          AI Analysis
        </span>
        <span className="text-[10px] text-slate-400">MedGemma 1.5</span>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
            analysis.urgency_level === "high" && "bg-red-100 text-red-700",
            analysis.urgency_level === "medium" &&
              "bg-amber-100 text-amber-700",
            analysis.urgency_level === "low" && "bg-green-100 text-green-700"
          )}
        >
          {analysis.urgency_level.toUpperCase()} URGENCY
        </span>
      </div>

      {/* ── 2. Clinical Context — excerpt from the original note ── */}
      <div className="border-b border-blue-200 bg-white/60 px-4 py-3">
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Context from your note ({formatDate(patientCase.clinical_note.date)})
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {analysis.context_summary}
            </p>
          </div>
        </div>

        {/* Extracted hypothesis */}
        <div className="mt-3 flex items-start gap-2">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Extracted Hypothesis
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-800">
              {analysis.hypothesis_extracted.primary}
            </p>
            {analysis.hypothesis_extracted.differential &&
              analysis.hypothesis_extracted.differential.length > 0 && (
              <p className="mt-0.5 text-[11px] text-slate-500">
                DDx: {analysis.hypothesis_extracted.differential.join(", ")}
              </p>
            )}
            {analysis.hypothesis_extracted.confidence && (
              <span
                className={cn(
                  "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  analysis.hypothesis_extracted.confidence === "high" &&
                    "bg-green-50 text-green-700",
                  analysis.hypothesis_extracted.confidence === "medium" &&
                    "bg-amber-50 text-amber-700",
                  analysis.hypothesis_extracted.confidence === "low" &&
                    "bg-slate-100 text-slate-500"
                )}
              >
                {analysis.hypothesis_extracted.confidence} confidence
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Results Update — completed / pending tests with icons ── */}
      <div className="border-b border-blue-200 bg-white/60 px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <FlaskConical className="h-3.5 w-3.5 text-slate-500" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Results Update
          </p>
        </div>
        <div className="space-y-1">
          {completedOrders.map((order) => {
            // Find matching result — try order_id first, then fuzzy test name
            const result =
              patientCase.results.find(
                (r) => r.order_id && r.order_id === order.order_id
              ) ??
              patientCase.results.find((r) =>
                order.test_name.toLowerCase().includes(r.test_name.toLowerCase()) ||
                r.test_name.toLowerCase().includes(order.test_name.toLowerCase())
              );

            // Determine if abnormal: structured values, or interpretation text
            const hasAbnormal =
              (result?.values &&
                Object.values(result.values).some((v) => v.flag !== "N")) ||
              (result?.interpretation &&
                /abnormal|high|low|elevated|critical|positive/i.test(
                  result.interpretation
                ));
            const StatusIcon = hasAbnormal ? AlertTriangle : CheckCircle2;
            const iconColor = hasAbnormal
              ? "text-amber-500"
              : "text-green-600";

            return (
              <div
                key={order.order_id}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-[11px]"
              >
                <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", iconColor)} />
                <span className="flex-1 text-slate-700">{order.test_name}</span>
                <span className="text-[10px] text-slate-400">
                  {order.result_date ? formatDate(order.result_date) : ""}
                </span>
              </div>
            );
          })}
          {pendingOrders.map((order) => (
            <div
              key={order.order_id}
              className="flex items-center gap-2 rounded-md bg-amber-50/80 px-2 py-1 text-[11px]"
            >
              <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span className="flex-1 font-medium text-amber-800">
                {order.test_name}
              </span>
              <span className="text-[10px] font-semibold text-amber-600">
                {order.days_pending ?? 0}d overdue
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. AI Interpretation — why this matters ── */}
      <div className="border-b border-blue-200 bg-white/60 px-4 py-3">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Why This Matters
        </p>
        <p className="text-xs leading-relaxed text-slate-700">
          {analysis.hypothesis_extracted.reasoning}
        </p>
      </div>

      {/* ── 5a. Collapsible: Flags ── */}
      <div className="border-b border-blue-200">
        <button
          onClick={() => toggle("flags")}
          className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-blue-100/50"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          <span className="flex-1 text-xs font-semibold text-slate-700">
            Flags ({analysis.flags.length})
          </span>
          {expandedSection === "flags" ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>
        {expandedSection === "flags" && (
          <ul className="space-y-1 px-4 pb-2.5">
            {analysis.flags.map((flag, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded-md px-2 py-1 text-[11px]",
                  flag.startsWith("CRITICAL")
                    ? "bg-red-50 font-medium text-red-700"
                    : "text-slate-600"
                )}
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                {flag}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── 5b. Collapsible: Suggested Actions (as buttons) ── */}
      <div className="border-b border-blue-200">
        <button
          onClick={() => toggle("actions")}
          className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-blue-100/50"
        >
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          <span className="flex-1 text-xs font-semibold text-slate-700">
            Suggested Actions ({analysis.suggested_actions.length})
          </span>
          {expandedSection === "actions" ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>
        {expandedSection === "actions" && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-3">
            {analysis.suggested_actions.map((action, i) => (
              <button
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-[11px] font-medium text-blue-700 shadow-sm transition-colors hover:border-blue-400 hover:bg-blue-50"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700">
                  {i + 1}
                </span>
                {action}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 6. Diagnostic Loop Timeline ── */}
      <div className="px-4 py-3">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Diagnostic Loop Timeline
        </p>
        <div className="space-y-0">
          {timelineSteps.map((step, i) => {
            const style = STEP_STYLE[step.status];
            const Icon = STEP_ICON[step.status];
            const isLast = i === timelineSteps.length - 1;

            return (
              <div key={i} className="flex gap-3">
                {/* Vertical line + icon */}
                <div className="flex flex-col items-center">
                  <Icon className={cn("h-4 w-4 shrink-0", style.node)} />
                  {!isLast && (
                    <div
                      className={cn(
                        "h-full min-h-5 w-0 border-l-2",
                        style.line
                      )}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={cn("pb-2.5", isLast && "pb-0")}>
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

        {/* Failure mode call-out */}
        {patientCase.failure_mode && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div>
              <p className="text-[11px] font-bold text-red-700">
                Failure Mode
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-red-600">
                {patientCase.failure_mode}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
