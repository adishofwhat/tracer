"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import type { PatientCase, UrgencyLevel } from "@/app/lib/types";
import ResultCard from "./ResultCard";
import { cn } from "@/app/lib/utils";
import { useState, useMemo } from "react";

interface ResultsListProps {
  results: PatientCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const FILTERS = ["All", "High", "Medium", "Low"] as const;
type Filter = (typeof FILTERS)[number];

/** Explicit urgency sort order: high first, then medium, then low. */
const URGENCY_RANK: Record<UrgencyLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function sortByUrgency(list: PatientCase[]): PatientCase[] {
  return [...list].sort((a, b) => {
    const aRank = URGENCY_RANK[a.ai_analysis?.urgency_level ?? "low"];
    const bRank = URGENCY_RANK[b.ai_analysis?.urgency_level ?? "low"];
    return aRank - bRank;
  });
}

export default function ResultsList({
  results,
  selectedId,
  onSelect,
}: ResultsListProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = results;

    // Filter by urgency tab
    if (filter !== "All") {
      const level = filter.toLowerCase();
      list = list.filter(
        (c) => c.ai_analysis?.urgency_level === level
      );
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.patient.demographics.name ?? "").toLowerCase().includes(q) ||
          c.diagnostic_hypothesis.primary.toLowerCase().includes(q) ||
          c.patient.demographics.mrn.toLowerCase().includes(q) ||
          c.results.some((r) => r.test_name.toLowerCase().includes(q))
      );
    }

    // Always sort: high → medium → low
    return sortByUrgency(list);
  }, [results, filter, search]);

  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-r border-slate-200 bg-slate-50">
      {/* Search bar */}
      <div className="border-b border-slate-200 bg-white px-3 py-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients, diagnoses, tests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-3 py-2">
        {FILTERS.map((f) => {
          const isActive = filter === f;
          const count =
            f === "All"
              ? results.length
              : results.filter(
                  (c) => c.ai_analysis?.urgency_level === f.toLowerCase()
                ).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              {f}
              <span
                className={cn(
                  "ml-1",
                  isActive ? "text-blue-200" : "text-slate-400"
                )}
              >
                ({count})
              </span>
            </button>
          );
        })}
        <button className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cards list — 4px gap between cards */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-slate-400">
            No results match your filters.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((c) => (
              <ResultCard
                key={c.patient.patient_id}
                patientCase={c}
                isSelected={selectedId === c.patient.patient_id}
                onClick={() => onSelect(c.patient.patient_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer count */}
      <div className="border-t border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-400">
        Showing {filtered.length} of {results.length} cases
      </div>
    </div>
  );
}
