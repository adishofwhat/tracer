"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { PatientData } from "@/app/lib/types";
import Tooltip from "./Tooltip";
import { useTracer } from "@/app/context/TracerContext";

interface Props {
  patients: PatientData[];
  sortedPatients: PatientData[];
}

type SortField =
  | "urgency"
  | "date"
  | "patient"
  | "confidence"
  | "alerts"
  | "orders";
type SortDir = "asc" | "desc";

function urgencyBorder(urgency: string) {
  if (urgency === "high") return "border-l-4 border-l-red-500";
  if (urgency === "medium") return "border-l-4 border-l-yellow-400";
  return "border-l-4 border-l-green-500";
}

function urgencyBadge(urgency: string) {
  if (urgency === "high") return "bg-red-100 text-red-700";
  if (urgency === "medium") return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
}

function urgencyLabel(urgency: string) {
  if (urgency === "high") return "HIGH";
  if (urgency === "medium") return "MED";
  return "LOW";
}

export default function InboxView({ patients, sortedPatients }: Props) {
  const { tracerOn, setTracerOn } = useTracer();
  const [sortField, setSortField] = useState<SortField>("urgency");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const router = useRouter();

  const displayed = useMemo(() => {
    if (!tracerOn) return patients;

    if (sortField === "urgency") {
      return sortDir === "desc" ? sortedPatients : [...sortedPatients].reverse();
    }

    const list = [...patients];
    const mult = sortDir === "asc" ? 1 : -1;

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = a.visit_date.localeCompare(b.visit_date);
          break;
        case "patient":
          cmp = a.patient_id.localeCompare(b.patient_id);
          break;
        case "confidence":
          cmp =
            (a.ai_analysis.agent_confidence ?? -1) -
            (b.ai_analysis.agent_confidence ?? -1);
          break;
        case "alerts":
          cmp =
            (a.ai_analysis.flags?.length ?? 0) -
            (b.ai_analysis.flags?.length ?? 0);
          break;
        case "orders":
          cmp =
            a.orders.filter((o) => o.status === "pending").length -
            b.orders.filter((o) => o.status === "pending").length;
          break;
        default:
          return 0;
      }
      return mult * cmp;
    });
    return list;
  }, [tracerOn, patients, sortedPatients, sortField, sortDir]);

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
  const avgConfidence = withConfidence.length
    ? (
        withConfidence.reduce(
          (sum, p) => sum + (p.ai_analysis.agent_confidence ?? 0),
          0
        ) / withConfidence.length
      ).toFixed(1)
    : "—";

  return (
    <>
      {tracerOn && (
        <div className="flex flex-wrap gap-x-8 gap-y-2 px-6 py-4 bg-white border-b border-gray-200">
          <div>
            <span className="text-lg font-bold text-red-600">{totalFlagged}</span>
            <span className="text-xs text-gray-500 block">flagged for review</span>
          </div>
          <div>
            <span className="text-lg font-bold text-orange-500">{totalHigh}</span>
            <span className="text-xs text-gray-500 block">high urgency</span>
          </div>
          <div>
            <span className="text-lg font-bold text-blue-600">{totalPending}</span>
            <span className="text-xs text-gray-500 block">open loops</span>
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">{avgConfidence}/10</span>
            <span className="text-xs text-gray-500 block">avg AI confidence</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {tracerOn ? (
            <p className="text-xs text-gray-500">
              AI-enriched · sorted by urgency and clinical risk
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Standard view · results as received · no AI enrichment
            </p>
          )}
          {tracerOn && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Sort:</span>
              <select
                value={sortField}
                onChange={(e) =>
                  setSortField(e.target.value as SortField)
                }
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"
              >
                <option value="urgency">Urgency</option>
                <option value="date">Date</option>
                <option value="patient">Patient</option>
                <option value="confidence">Confidence</option>
                <option value="alerts">Alerts</option>
                <option value="orders">Orders</option>
              </select>
              <button
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                className="text-xs text-gray-500 hover:text-gray-700"
                title={sortDir === "desc" ? "Descending" : "Ascending"}
              >
                {sortDir === "desc" ? "↓" : "↑"}
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setTracerOn(!tracerOn)}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
            tracerOn
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-gray-500 border border-gray-300"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full transition-all ${
              tracerOn ? "bg-white" : "bg-gray-400"
            }`}
          />
          Tracer {tracerOn ? "ON" : "OFF"}
        </button>
      </div>

      <div className="bg-white mx-6 mt-4 rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-8" />
                <th className="px-4 py-3 text-left whitespace-nowrap">Patient</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Age / Sex</th>
                <th className="px-4 py-3 text-left">Diagnosis / Result</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Provider</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Date</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Orders</th>
                {tracerOn && (
                  <>
                    <th className="px-4 py-3 text-left whitespace-nowrap">Urgency</th>
                    <th className="px-4 py-3 text-left whitespace-nowrap">Confidence</th>
                    <th className="px-4 py-3 text-left whitespace-nowrap">AI Alerts</th>
                    <th className="px-4 py-3 text-left whitespace-nowrap">Flag</th>
                    <th className="px-4 py-3 text-left">Risk</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayed.map((p) => {
                const pendingCount = p.orders.filter(
                  (o) => o.status === "pending"
                ).length;
                const alertCount = p.ai_analysis.flags?.length ?? 0;
                const isFlagged = p.ai_analysis.agent_review_flag === true;
                const isHigh = p.ai_analysis.urgency === "high";

                return (
                  <tr
                    key={p.patient_id}
                    onClick={() => router.push(`/patients/${p.patient_id}`)}
                    className={`cursor-pointer transition-colors ${
                      tracerOn && isHigh
                        ? "bg-red-50 hover:bg-red-100"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <td
                      className={`w-1 p-0 ${
                        tracerOn ? urgencyBorder(p.ai_analysis.urgency) : ""
                      }`}
                    />
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-500">
                        {p.patient_id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {p.demographics.age} / {p.demographics.sex}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900 font-medium">
                        {p.ground_truth_diagnosis}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {p.clinical_note.provider}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {p.visit_date}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {pendingCount > 0
                        ? `${pendingCount} pending`
                        : "✓ complete"}
                    </td>
                    {tracerOn && (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${urgencyBadge(p.ai_analysis.urgency)}`}
                          >
                            {urgencyLabel(p.ai_analysis.urgency)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {p.ai_analysis.agent_confidence !== null
                            ? `${p.ai_analysis.agent_confidence}/10`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {alertCount > 0 ? (
                            <span className="text-red-600 font-medium">
                              {alertCount} alerts
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {isFlagged ? (
                            <span className="text-yellow-600 font-medium">
                              ⚠ Flagged
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          {p.failure_mode ? (
                            <Tooltip
                              text={p.failure_mode}
                              maxWidth={400}
                              className="block w-full truncate cursor-default text-xs text-gray-500"
                              preferSide="bottom"
                            >
                              <span>
                                <span className="text-orange-500 not-italic font-medium">
                                  ⚠{" "}
                                </span>
                                {p.failure_mode}
                              </span>
                            </Tooltip>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
