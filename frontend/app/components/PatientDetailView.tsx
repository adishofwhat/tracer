"use client";

import Link from "next/link";
import type { PatientData, UrgencyLevel, OrderStatus } from "@/app/lib/types";
import MarkReviewedButton from "@/app/components/MarkReviewedButton";
import ReasonCell from "@/app/components/ReasonCell";
import { useTracer } from "@/app/context/TracerContext";

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

function statusBadge(status: OrderStatus) {
  const config = {
    pending: { bg: "bg-yellow-100 text-yellow-700", label: "Pending" },
    completed: { bg: "bg-green-100 text-green-700", label: "Completed" },
    cancelled: { bg: "bg-gray-100 text-gray-500", label: "Cancelled" },
  } as const;
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${c.bg}`}
    >
      {c.label}
    </span>
  );
}

function interpretationBadge(interp: string | undefined) {
  if (!interp) return null;
  const lower = interp.toLowerCase();
  let bg = "bg-gray-100 text-gray-600";
  if (lower.includes("critical")) bg = "bg-red-100 text-red-700";
  else if (lower.includes("abnormal")) bg = "bg-yellow-100 text-yellow-700";
  else if (lower.includes("normal")) bg = "bg-green-100 text-green-700";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${bg}`}
    >
      {interp}
    </span>
  );
}

function formatFlag(flag: string) {
  const parts = flag.split(
    /(\d[\d,]*\s*(?:U\/mL|ng\/mL|mg\/dL|days|mIU\/mL|g\/dL|%)|"[^"]+"|>\d+\s*\w+)/g
  );
  return parts.map((part, i) =>
    /\d|"/.test(part[0] ?? "") ? (
      <strong key={i} className="font-bold">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function daysPendingCell(days: number | undefined) {
  if (days == null) return null;
  let color = "text-gray-600";
  if (days > 21) color = "text-red-600 font-bold";
  else if (days >= 14) color = "text-orange-500";
  return <span className={color}>{days} days</span>;
}

interface Props {
  patient: PatientData;
}

export default function PatientDetailView({ patient: p }: Props) {
  const { tracerOn, setTracerOn } = useTracer();
  const ai = p.ai_analysis;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Link
          href="/"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Inbox
        </Link>
        <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-gray-400 text-sm">
              {p.patient_id}
            </span>
            <span className="text-gray-600 text-sm">
              {p.demographics.age} · {p.demographics.sex} · {p.demographics.mrn}
            </span>
            {tracerOn && urgencyBadge(ai.urgency)}
            {tracerOn && ai.agent_review_flag === true && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                ⚠ Flagged for Review
              </span>
            )}
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => setTracerOn(!tracerOn)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                tracerOn
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  tracerOn ? "bg-white" : "bg-gray-400"
                }`}
              />
              Tracer {tracerOn ? "ON" : "OFF"}
            </button>
            <MarkReviewedButton />
          </div>
        </div>
      </div>

      {!tracerOn && (
        <div className="px-6 py-2 bg-gray-100 border-b border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            Tracer off — showing standard chart view · toggle Tracer on to see
            AI context, flags, and confidence
          </p>
        </div>
      )}

      <div className="p-6 pb-10">
        <div
          className={`grid gap-6 items-start ${
            tracerOn ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
          }`}
        >
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Clinical Note</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {p.clinical_note.provider} ·{" "}
                {p.clinical_note.specialty ?? "General"} · {p.clinical_note.date}
              </p>
            </div>
            <div className="p-4">
              <div
                className={`overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap leading-7 p-4 bg-gray-50 rounded font-sans ${
                  tracerOn ? "max-h-96" : "max-h-none"
                }`}
              >
                {p.clinical_note.text}
              </div>
            </div>

            {tracerOn && (
              <div className="p-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Original Hypothesis
                </p>
                <p className="text-sm text-gray-900 font-medium mt-1">
                  {p.diagnostic_hypothesis.primary}
                </p>
                <p className="text-xs text-gray-600 italic mt-1">
                  {p.diagnostic_hypothesis.reasoning}
                </p>
              </div>
            )}

            <div className="p-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Working Diagnosis
              </p>
              <p className="text-sm font-semibold text-green-700 mt-1">
                {p.ground_truth_diagnosis}
              </p>
            </div>
          </div>

          {tracerOn && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-semibold text-gray-900">
                    AI Analysis
                  </span>
                  <div className="flex items-center gap-2">
                    {urgencyBadge(ai.urgency)}
                    {ai.agent_confidence !== null && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        Confidence: {ai.agent_confidence}/10
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fine-tuned MedGemma 1.5 (4B) · 4-agent quality pipeline
                </p>
              </div>

              {ai.agent_review_flag === true && (
                <div className="p-3 bg-yellow-50 border-b border-yellow-100">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠ Agent Flagged for Physician Review
                  </p>
                </div>
              )}

              <div className="p-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Primary Hypothesis
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {ai.primary_hypothesis}
                </p>
              </div>

              <div className="p-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Differential
                </p>
                <div className="flex flex-col gap-0.5 mt-1">
                  {ai.differential_diagnoses.map((d, i) => (
                    <span key={i} className="text-xs text-gray-600">
                      · {d}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Key Symptoms
                </p>
                <div className="flex flex-col gap-0.5 mt-1">
                  {ai.key_symptoms.map((s, i) => (
                    <span key={i} className="text-xs text-gray-600">
                      · {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-red-500 uppercase">
                  AI Alerts
                </p>
                {ai.flags.map((flag, i) => (
                  <div
                    key={i}
                    className="bg-red-50 border border-red-100 rounded px-3 py-2 text-xs text-red-800 mt-1"
                  >
                    {formatFlag(flag)}
                  </div>
                ))}
              </div>

              <div className="p-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  Reasoning
                </p>
                <p className="text-xs text-gray-600 italic leading-relaxed mt-1">
                  {ai.reasoning}
                </p>
              </div>

              <div className="p-4">
                {ai.loop_status === "open" ? (
                  <span className="text-xs font-bold text-red-600">
                    ● LOOP OPEN
                  </span>
                ) : (
                  <span className="text-xs font-bold text-green-600">
                    ● LOOP CLOSED
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 items-start">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                Orders ({p.orders.length})
              </h2>
            </div>
            <div>
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[34%]" />
                </colgroup>
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                    <th className="px-4 py-2">Test</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Ordered</th>
                    <th className="px-4 py-2">Days Pending</th>
                    <th className="px-4 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {p.orders.map((o, i) => (
                    <tr key={`${o.order_id}-${i}`}>
                      <td className="px-4 py-2 text-gray-900 text-xs">
                        {o.test_name}
                      </td>
                      <td className="px-4 py-2 pr-6">{statusBadge(o.status)}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {o.order_date}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {o.status === "pending"
                          ? daysPendingCell(o.days_pending)
                          : null}
                      </td>
                      <td className="px-4 py-2">
                        <ReasonCell text={o.failure_reason ?? ""} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                Results ({p.results.length})
              </h2>
            </div>
            {p.results.map((r, i) => (
              <div
                key={r.result_id}
                className={`p-4 ${
                  i < p.results.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">
                    {r.test_name}
                  </span>
                  <span className="text-xs text-gray-400">{r.result_date}</span>
                  {interpretationBadge(r.interpretation)}
                </div>
                {r.full_text && (
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    {r.full_text}
                  </p>
                )}
              </div>
            ))}
            {p.results.length === 0 && (
              <div className="p-4 text-xs text-gray-400">
                No results available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
