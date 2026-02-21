"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadPatients } from "@/app/lib/dataLoader";
import type { UrgencyLevel } from "@/app/lib/types";
import ReasonCell from "@/app/components/ReasonCell";

// ── Build flat pending-loops array at module level ───────────────────────────

interface PendingLoop {
  patient_id: string;
  age: number;
  sex: "M" | "F";
  ground_truth_diagnosis: string;
  test_name: string;
  order_date: string;
  days_pending: number;
  urgency: UrgencyLevel;
  failure_reason: string;
  agent_review_flag: boolean | null;
  agent_confidence: number | null;
}

const pendingLoops: PendingLoop[] = loadPatients().flatMap((p) =>
  p.orders
    .filter((o) => o.status === "pending")
    .map((o) => ({
      patient_id: p.patient_id,
      age: p.demographics.age,
      sex: p.demographics.sex,
      ground_truth_diagnosis: p.ground_truth_diagnosis,
      test_name: o.test_name,
      order_date: o.order_date,
      days_pending: o.days_pending ?? 0,
      urgency: p.ai_analysis.urgency,
      failure_reason: o.failure_reason ?? "",
      agent_review_flag: p.ai_analysis.agent_review_flag,
      agent_confidence: p.ai_analysis.agent_confidence,
    }))
);

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const URGENCY_RANK: Record<UrgencyLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

// ── Component ────────────────────────────────────────────────────────────────

type UrgencyFilter = "all" | UrgencyLevel;
type SortField = "days" | "urgency";
type SortDir = "asc" | "desc";

export default function LoopTrackerPage() {
  const router = useRouter();
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");
  const [sortField, setSortField] = useState<SortField>("days");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Filter
  const filtered =
    urgencyFilter === "all"
      ? pendingLoops
      : pendingLoops.filter((l) => l.urgency === urgencyFilter);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === "days") {
      cmp = a.days_pending - b.days_pending;
    } else {
      cmp = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    }
    return sortDir === "desc" ? -cmp : cmp;
  });

  function handleSortClick(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const filterButtons: { value: UrgencyFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const sortButtons: { value: SortField; label: string }[] = [
    { value: "days", label: "Days Pending" },
    { value: "urgency", label: "Urgency" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <Link
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 block mb-1"
            >
              ← Results Inbox
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Loop Tracker</h1>
            <p className="text-sm text-gray-500">
              Pending diagnostic orders requiring follow-up
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-red-600">
              {sorted.length} open loops
            </p>
            <p className="text-xs text-gray-400">
              of {pendingLoops.length} total
            </p>
          </div>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-4 flex-wrap">
        {/* Urgency filter */}
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500 self-center">Urgency:</span>
          {filterButtons.map((f) => (
            <button
              key={f.value}
              onClick={() => setUrgencyFilter(f.value)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                urgencyFilter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort controls */}
        <div className="flex gap-2 items-center ml-auto">
          <span className="text-xs text-gray-500 self-center">Sort:</span>
          {sortButtons.map((s) => {
            const isActive = sortField === s.value;
            return (
              <button
                key={s.value}
                onClick={() => handleSortClick(s.value)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-600"
                }`}
              >
                {s.label}
                {isActive && (sortDir === "desc" ? " ↓" : " ↑")}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white mx-6 mt-4 rounded-lg border border-gray-200 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            No open loops for this filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Test</th>
                  <th className="px-4 py-3">Ordered</th>
                  <th className="px-4 py-3">Days Pending</th>
                  <th className="px-4 py-3">Urgency</th>
                  <th className="px-4 py-3">Flagged</th>
                  <th className="px-4 py-3">Failure Reason</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((loop, i) => (
                  <tr
                    key={`${loop.patient_id}-${loop.test_name}-${i}`}
                    onClick={() => router.push(`/patients/${loop.patient_id}`)}
                    className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer ${
                      loop.urgency === "high" ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs">{loop.patient_id}</span>
                      <span className="text-xs text-gray-500 block">
                        {loop.age}{loop.sex}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm text-gray-900">
                        {loop.test_name}
                      </span>
                      <span className="text-xs text-gray-400 block">
                        {loop.ground_truth_diagnosis}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {loop.order_date}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span
                        className={
                          loop.days_pending > 21
                            ? "text-red-600 font-bold"
                            : loop.days_pending >= 14
                              ? "text-orange-500 font-semibold"
                              : "text-gray-600"
                        }
                      >
                        {loop.days_pending} days
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {urgencyBadge(loop.urgency)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {loop.agent_review_flag === true ? (
                        <span className="text-yellow-500 text-base">⚠</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 max-w-xs">
                      <ReasonCell text={loop.failure_reason} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
