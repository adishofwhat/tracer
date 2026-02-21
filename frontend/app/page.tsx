"use client";

import { useState } from "react";
import { Bell, HelpCircle, Inbox } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ResultsList from "./components/ResultsList";
import ResultDetail from "./components/ResultDetail";
import { PATIENTS_WITH_AI } from "./lib/patientsData";
import type { PatientCase } from "./lib/types";

export default function Home() {
  const [activePath, setActivePath] = useState("/");
  const [selectedId, setSelectedId] = useState<string | null>(
    PATIENTS_WITH_AI[0]?.patient.patient_id ?? null
  );

  const selectedCase: PatientCase | undefined = PATIENTS_WITH_AI.find(
    (c) => c.patient.patient_id === selectedId
  );

  const highCount = PATIENTS_WITH_AI.filter(
    (c) => c.ai_analysis?.urgency_level === "high"
  ).length;

  // Handle empty dataset gracefully
  if (PATIENTS_WITH_AI.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Inbox className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">
            No patients found
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Check that the patient data file is present and correctly formatted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar activePath={activePath} onNavigate={setActivePath} />

      {/* Main area */}
      <div className="ml-[240px] flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Results Inbox
            </h1>
            <p className="text-[11px] text-slate-500">
              {PATIENTS_WITH_AI.length} open cases &middot; {highCount} critical
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <Bell className="h-4 w-4" />
              {highCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
            <button className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <HelpCircle className="h-4 w-4" />
            </button>
            <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              SP
            </div>
          </div>
        </header>

        {/* Content split: list + detail */}
        <div className="flex flex-1 overflow-hidden">
          <ResultsList
            results={PATIENTS_WITH_AI}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {/* Detail panel */}
          <div className="flex-1 overflow-hidden">
            {selectedCase ? (
              <ResultDetail
                patientCase={selectedCase}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                <Inbox className="mb-3 h-10 w-10" />
                <p className="text-sm font-medium">No case selected</p>
                <p className="text-xs">
                  Select a patient from the list to view details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
