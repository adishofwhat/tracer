import Link from "next/link";
import { loadPatients } from "@/app/lib/dataLoader";
import type { PatientData, UrgencyLevel } from "@/app/lib/types";
import RiskLine from "@/app/components/RiskLine";

function cardBorderClass(urgency: string) {
  if (urgency === "high")
    return "border border-gray-200 border-l-4 border-l-red-500 rounded-lg";
  if (urgency === "medium")
    return "border border-gray-200 border-l-4 border-l-yellow-400 rounded-lg";
  return "border border-gray-200 border-l-4 border-l-green-500 rounded-lg";
}

function urgencyBadge(level: UrgencyLevel) {
  const config = {
    high: { bg: "bg-red-100 text-red-700", label: "HIGH" },
    medium: { bg: "bg-yellow-100 text-yellow-700", label: "MED" },
    low: { bg: "bg-green-100 text-green-700", label: "LOW" },
  } as const;
  const c = config[level];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${c.bg}`}
    >
      {c.label}
    </span>
  );
}

export default function InboxPage() {
  const patients = loadPatients();
  const urgencyOrder = { high: 0, medium: 1, low: 2 } as const;

  const sorted = [...patients].sort((a, b) => {
    const urgencyDiff =
      urgencyOrder[a.ai_analysis.urgency] -
      urgencyOrder[b.ai_analysis.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;

    const aFlagged = a.ai_analysis.agent_review_flag ? 0 : 1;
    const bFlagged = b.ai_analysis.agent_review_flag ? 0 : 1;
    if (aFlagged !== bFlagged) return aFlagged - bFlagged;

    const aDays = Math.max(
      ...a.orders
        .filter((o) => o.status === "pending")
        .map((o) => o.days_pending ?? 0),
      0
    );
    const bDays = Math.max(
      ...b.orders
        .filter((o) => o.status === "pending")
        .map((o) => o.days_pending ?? 0),
      0
    );
    return bDays - aDays;
  });

  const totalFlagged = patients.filter(
    (p) => p.ai_analysis.agent_review_flag
  ).length;
  const totalHigh = patients.filter(
    (p) => p.ai_analysis.urgency === "high"
  ).length;
  const totalPending = patients.reduce(
    (sum, p) => sum + p.orders.filter((o) => o.status === "pending").length,
    0
  );
  const withConfidence = patients.filter(
    (p) => p.ai_analysis.agent_confidence !== null
  );
  const avgConfidence = (
    withConfidence.reduce(
      (sum, p) => sum + (p.ai_analysis.agent_confidence ?? 0),
      0
    ) / withConfidence.length
  ).toFixed(1);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Stats bar */}
      <div className="flex gap-8 px-6 py-4 bg-white border-b border-gray-200">
        <div>
          <span className="text-lg font-bold text-red-600">{totalFlagged}</span>
          <span className="text-xs text-gray-400 block">flagged for review</span>
        </div>
        <div>
          <span className="text-lg font-bold text-orange-500">{totalHigh}</span>
          <span className="text-xs text-gray-400 block">high urgency</span>
        </div>
        <div>
          <span className="text-lg font-bold text-blue-600">{totalPending}</span>
          <span className="text-xs text-gray-400 block">open loops</span>
        </div>
        <div>
          <span className="text-lg font-bold text-gray-900">{avgConfidence}/10</span>
          <span className="text-xs text-gray-400 block">avg AI confidence</span>
        </div>
      </div>

      {/* Patient grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 pb-10">
        {sorted.map((p) => (
          <PatientCard key={p.patient_id} patient={p} />
        ))}
      </div>
    </div>
  );
}

function PatientCard({ patient: p }: { patient: PatientData }) {
  const pendingCount = p.orders.filter((o) => o.status === "pending").length;
  const flagCount = p.ai_analysis.flags.length;

  return (
    <Link
      href={`/patients/${p.patient_id}`}
      className={`block bg-white ${cardBorderClass(p.ai_analysis.urgency)} p-4 hover:shadow-md transition-all cursor-pointer`}
    >
      {/* Row 1: ID + flag + confidence + urgency */}
      <div className="flex items-center">
        <span className="font-mono text-xs text-gray-400">
          {p.patient_id}
        </span>
        {p.ai_analysis.agent_review_flag === true && (
          <span className="ml-3 bg-yellow-50 border border-yellow-200 rounded px-2 py-0.5 text-[11px] text-yellow-800 font-medium whitespace-nowrap self-center">
            ⚠ Flagged for Agent Review
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {p.ai_analysis.agent_confidence !== null && (
            <span className="text-xs">
              <span className="text-gray-400">conf.</span>{" "}
              <span className="font-semibold text-gray-600">
                {p.ai_analysis.agent_confidence}/10
              </span>
            </span>
          )}
          {urgencyBadge(p.ai_analysis.urgency)}
        </div>
      </div>

      {/* Diagnosis */}
      <p className="font-semibold text-gray-900 text-sm truncate mt-2">
        {p.ground_truth_diagnosis}
      </p>

      {/* Demographics */}
      <p className="text-xs text-gray-500 mt-1">
        {p.demographics.age} {p.demographics.sex} ·{" "}
        {p.clinical_note.specialty ?? "General"}
      </p>

      {/* Stats row */}
      <div className="flex justify-between mt-2">
        {pendingCount > 0 ? (
          <span className="text-xs text-gray-500">
            🕐 {pendingCount} pending
          </span>
        ) : (
          <span className="text-xs text-green-600">✓ No pending orders</span>
        )}
        {flagCount > 0 && (
          <span className="text-xs text-red-600 font-medium">
            {flagCount} AI alerts
          </span>
        )}
      </div>

      {/* Failure mode */}
      <RiskLine text={p.failure_mode} />
    </Link>
  );
}
