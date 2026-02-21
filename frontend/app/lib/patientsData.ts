import type {
  PatientCase,
  AIAnalysis,
  UrgencyLevel,
  DiagnosticHypothesis,
  Order,
  LabResult,
  ClinicalNote,
} from "./types";

// =============================================================================
// Raw JSON shape (matches data/patients/all_patients_base_model.json)
// =============================================================================

interface RawResultAnalysis {
  result_id: string;
  test_name: string;
  ai_analysis: string;
}

interface RawOpenLoop {
  order_id: string;
  test_name: string;
  days_pending: number;
  severity: string;
}

interface RawAIAnalysis {
  hypothesis_extraction: string;
  result_analyses: RawResultAnalysis[];
  open_loops: RawOpenLoop[];
  urgency_flags: string[];
  suggested_actions: string[];
}

interface RawPatient {
  patient_id: string;
  demographics: { age: number; sex: "M" | "F"; mrn: string };
  visit_date: string;
  clinical_note: { date: string; provider: string; text: string };
  orders: {
    order_id: string;
    test_name: string;
    status: string;
    result_date?: string;
    days_pending?: number;
    failure_reason?: string;
  }[];
  results: {
    result_id: string;
    test_name: string;
    result_date?: string;
    interpretation?: string;
    full_text?: string;
  }[];
  diagnostic_hypothesis: {
    primary: string;
    differential?: string[];
    reasoning: string;
  };
  ground_truth_diagnosis: string;
  failure_mode: string;
  ai_should_flag?: string[];
  ai_analysis?: RawAIAnalysis;
  ai_model?: string;
  processing_date?: string;
}

// =============================================================================
// Parsers
// =============================================================================

/** Extract structured fields from the raw hypothesis_extraction text blob. */
function parseHypothesisExtraction(text: string): {
  primary: string;
  differential: string[];
  urgency: UrgencyLevel;
  reasoning: string;
} {
  let primary = "";
  let differential: string[] = [];
  let urgency: UrgencyLevel = "medium";
  let reasoning = "";

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("PRIMARY HYPOTHESIS:")) {
      primary = trimmed.replace("PRIMARY HYPOTHESIS:", "").trim();
    } else if (/^DIFFERENTIAL DIAGNOS/i.test(trimmed)) {
      differential = trimmed
        .replace(/^DIFFERENTIAL DIAGNOS\w*:\s*/i, "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (trimmed.startsWith("URGENCY LEVEL:")) {
      const raw = trimmed.replace("URGENCY LEVEL:", "").trim().toLowerCase();
      if (raw === "high" || raw === "medium" || raw === "low") {
        urgency = raw;
      }
    } else if (trimmed.startsWith("CLINICAL REASONING:")) {
      reasoning = trimmed.replace("CLINICAL REASONING:", "").trim();
    }
  }

  return { primary, differential, urgency, reasoning };
}

/** Build a context_summary from the clinical note (first ~250 chars). */
function buildContextSummary(raw: RawPatient): string {
  const { age, sex } = raw.demographics;
  const noteText = raw.clinical_note.text;

  // Pull the first meaningful sentence(s) from the note
  const excerpt = noteText
    .replace(/SUBJECTIVE:\s*/i, "")
    .replace(/Subjective:\s*/i, "")
    .substring(0, 250)
    .trim();

  const trailingIdx = excerpt.lastIndexOf(".");
  const clean = trailingIdx > 50 ? excerpt.substring(0, trailingIdx + 1) : excerpt + "...";

  return `${age} y/o ${sex === "M" ? "male" : "female"} — ${clean}`;
}

// =============================================================================
// Transformer: RawPatient → PatientCase
// =============================================================================

/** Map for demo-quality patient names (keyed by patient_id). */
const PATIENT_NAMES: Record<string, string> = {
  P001: "Maria Santos",
  P002: "Harold Mitchell",
  P003: "Sarah Kim",
  P004: "Lisa Thompson",
  P005: "William Harris",
  P006: "Patricia Evans",
  P007: "David Rodriguez",
  P008: "James Wilson",
  P009: "Michael Chang",
  P010: "Dorothy Miller",
};

function transformAIAnalysis(raw: RawPatient): AIAnalysis | undefined {
  if (!raw.ai_analysis) return undefined;

  const ai = raw.ai_analysis;
  const parsed = parseHypothesisExtraction(ai.hypothesis_extraction ?? "");

  const hypothesis: DiagnosticHypothesis = {
    primary: parsed.primary || raw.diagnostic_hypothesis.primary,
    differential:
      parsed.differential.length > 0
        ? parsed.differential
        : raw.diagnostic_hypothesis.differential,
    reasoning: parsed.reasoning || raw.diagnostic_hypothesis.reasoning,
  };

  // Combine urgency_flags + ai_should_flag as the flags array
  const flags: string[] = [
    ...(ai.urgency_flags ?? []),
    ...(raw.ai_should_flag ?? []),
  ];

  return {
    hypothesis_extracted: hypothesis,
    context_summary: buildContextSummary(raw),
    flags,
    suggested_actions: ai.suggested_actions ?? [],
    urgency_level: parsed.urgency,
  };
}

function transformPatient(raw: RawPatient): PatientCase {
  const orders: Order[] = raw.orders.map((o) => ({
    order_id: o.order_id,
    test_name: o.test_name,
    order_date: raw.visit_date, // Fall back to visit date when order_date absent
    status: o.status as Order["status"],
    result_date: o.result_date ?? null,
    days_pending: o.days_pending,
    failure_reason: o.failure_reason,
  }));

  const results: LabResult[] = raw.results.map((r) => ({
    result_id: r.result_id,
    test_name: r.test_name,
    result_date: r.result_date,
    interpretation: r.interpretation,
    full_text: r.full_text,
  }));

  const clinicalNote: ClinicalNote = {
    date: raw.clinical_note.date,
    provider: raw.clinical_note.provider,
    text: raw.clinical_note.text,
  };

  const hypothesis: DiagnosticHypothesis = {
    primary: raw.diagnostic_hypothesis.primary,
    differential: raw.diagnostic_hypothesis.differential,
    reasoning: raw.diagnostic_hypothesis.reasoning,
  };

  return {
    patient: {
      patient_id: raw.patient_id,
      demographics: {
        age: raw.demographics.age,
        sex: raw.demographics.sex,
        mrn: raw.demographics.mrn,
        name: PATIENT_NAMES[raw.patient_id],
      },
    },
    visit_date: raw.visit_date,
    clinical_note: clinicalNote,
    orders,
    results,
    diagnostic_hypothesis: hypothesis,
    ground_truth_diagnosis: raw.ground_truth_diagnosis,
    failure_mode: raw.failure_mode,
    ai_analysis: transformAIAnalysis(raw),
  };
}

// =============================================================================
// Import raw data & export transformed patients
// =============================================================================

// JSON copied into frontend/data/ for Turbopack compatibility.
// Source of truth: <project-root>/data/patients/all_patients_base_model.json
import rawJson from "../../data/all_patients_base_model.json";

const rawData = rawJson as unknown as RawPatient[];

export const PATIENTS_WITH_AI: PatientCase[] = rawData.map(transformPatient);
