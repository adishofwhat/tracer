"use client";

import {
  User,
  FileText,
  FlaskConical,
  ClipboardList,
  X,
} from "lucide-react";
import type { PatientCase, LabFlag } from "@/app/lib/types";
import { cn, formatDate } from "@/app/lib/utils";
import AIContextPanel from "./AIContextPanel";

interface ResultDetailProps {
  patientCase: PatientCase;
  onClose: () => void;
}

const FLAG_STYLE: Record<LabFlag, string> = {
  N: "text-slate-600",
  L: "text-blue-700 bg-blue-50 font-semibold",
  H: "text-red-700 bg-red-50 font-semibold",
  C: "text-red-800 bg-red-100 font-bold",
};

const FLAG_LABEL: Record<LabFlag, string> = {
  N: "",
  L: "LOW",
  H: "HIGH",
  C: "CRIT",
};

export default function ResultDetail({
  patientCase,
  onClose,
}: ResultDetailProps) {
  const { patient, clinical_note, orders, results, ai_analysis } = patientCase;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      {/* Sticky header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {(patient.demographics.name ?? "?")
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {patient.demographics.name ?? "Unknown Patient"}
            </h2>
            <p className="text-[11px] text-slate-500">
              {patient.demographics.age}
              {patient.demographics.sex} &middot; MRN{" "}
              {patient.demographics.mrn} &middot; Visit{" "}
              {formatDate(patientCase.visit_date)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-5">
          {/* ── AI Analysis + Loop Timeline ── */}
          <AIContextPanel patientCase={patientCase} />

          {/* ── Clinical Note ── */}
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-800">
                Clinical Note
              </span>
            </div>
            <div className="px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] text-slate-500">
                <span>{clinical_note.provider}</span>
                {clinical_note.specialty && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span>{clinical_note.specialty}</span>
                  </>
                )}
                <span className="text-slate-300">|</span>
                <span>{formatDate(clinical_note.date)}</span>
              </div>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                {clinical_note.text}
              </p>
            </div>
          </section>

          {/* ── Orders ── */}
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
              <ClipboardList className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-800">
                Orders ({orders.length})
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {orders.map((order) => (
                <div
                  key={order.order_id}
                  className="flex items-center gap-3 px-4 py-2"
                >
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      order.status === "completed" && "bg-green-500",
                      order.status === "pending" && "bg-amber-500",
                      order.status === "cancelled" && "bg-slate-300"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-800">
                      {order.test_name}
                    </p>
                    {order.failure_reason && (
                      <p className="truncate text-[11px] text-red-600">
                        {order.failure_reason}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        order.status === "completed" &&
                          "bg-green-50 text-green-700",
                        order.status === "pending" &&
                          "bg-amber-50 text-amber-700",
                        order.status === "cancelled" &&
                          "bg-slate-100 text-slate-500"
                      )}
                    >
                      {order.status}
                    </span>
                    {order.days_pending != null && order.status === "pending" && (
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {order.days_pending}d pending
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Lab Results ── */}
          <section className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
              <FlaskConical className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-800">
                Results ({results.length})
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {results.map((result) => (
                <div key={result.result_id} className="px-4 py-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      {result.test_name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {result.result_date ? formatDate(result.result_date) : ""}
                    </span>
                  </div>

                  {/* Lab values table */}
                  {result.values && (
                    <div className="mb-2 rounded-md border border-slate-100 bg-slate-50/50">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            <th className="px-2.5 py-1.5">Test</th>
                            <th className="px-2.5 py-1.5">Value</th>
                            <th className="px-2.5 py-1.5">Reference</th>
                            <th className="px-2.5 py-1.5 text-right">Flag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.entries(result.values).map(
                            ([name, lab]) => (
                              <tr key={name}>
                                <td className="px-2.5 py-1 font-medium text-slate-700">
                                  {name}
                                </td>
                                <td
                                  className={cn(
                                    "px-2.5 py-1",
                                    FLAG_STYLE[lab.flag]
                                  )}
                                >
                                  {lab.value} {lab.unit}
                                </td>
                                <td className="px-2.5 py-1 text-slate-400">
                                  {lab.reference}
                                </td>
                                <td className="px-2.5 py-1 text-right">
                                  {lab.flag !== "N" && (
                                    <span
                                      className={cn(
                                        "inline-block rounded px-1.5 py-0.5 text-[9px] font-bold",
                                        FLAG_STYLE[lab.flag]
                                      )}
                                    >
                                      {FLAG_LABEL[lab.flag]}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Full text (when no structured values) */}
                  {!result.values && result.full_text && (
                    <div className="mb-2 rounded-md border border-slate-100 bg-slate-50/50 px-2.5 py-2">
                      <p className="text-[11px] leading-relaxed text-slate-600">
                        {result.full_text}
                      </p>
                    </div>
                  )}

                  {/* Radiology report */}
                  {result.radiology_report && (
                    <div className="mb-1.5 rounded-md bg-slate-50 px-2.5 py-2">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Radiology Report
                      </p>
                      <p className="text-[11px] leading-relaxed text-slate-600">
                        {result.radiology_report}
                      </p>
                    </div>
                  )}

                  {/* Key finding */}
                  {result.key_finding && (
                    <div className="rounded-md bg-amber-50 px-2.5 py-1.5">
                      <span className="text-[10px] font-semibold text-amber-700">
                        Key Finding:{" "}
                      </span>
                      <span className="text-[11px] text-amber-700">
                        {result.key_finding}
                      </span>
                    </div>
                  )}

                  {/* Interpretation */}
                  {result.interpretation && (
                    <p className="mt-1.5 text-[11px] italic text-slate-500">
                      {result.interpretation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
