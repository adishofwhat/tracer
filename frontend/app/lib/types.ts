// =============================================================================
// Diagnostic Loop Tracker — Core Type Definitions
// =============================================================================

// ── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  patient_id: string;
  demographics: {
    age: number;
    sex: "M" | "F";
    mrn: string;
    name?: string;
  };
}

// ── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus = "pending" | "completed" | "cancelled";

export interface Order {
  order_id: string;
  test_name: string;
  order_date: string;
  status: OrderStatus;
  result_date?: string | null;
  days_pending?: number;
  failure_reason?: string;
}

// ── Lab Values & Results ─────────────────────────────────────────────────────

export type LabFlag = "N" | "L" | "H" | "C"; // Normal, Low, High, Critical

export interface LabValue {
  value: number | string;
  unit: string;
  reference: string;
  flag: LabFlag;
}

export type ResultUrgency = "routine" | "urgent" | "critical";

export interface LabResult {
  result_id: string;
  order_id: string;
  test_name: string;
  result_date: string;
  values?: Record<string, LabValue>;
  interpretation?: string;
  radiology_report?: string;
  key_finding?: string;
  urgency?: ResultUrgency;
}

// ── Clinical Notes ───────────────────────────────────────────────────────────

export interface ClinicalNote {
  date: string;
  provider: string;
  specialty: string;
  text: string;
}

// ── Diagnostic Hypothesis ────────────────────────────────────────────────────

export type Confidence = "low" | "medium" | "high";

export interface DiagnosticHypothesis {
  primary: string;
  differential: string[];
  reasoning: string;
  confidence?: Confidence;
}

// ── AI Analysis ──────────────────────────────────────────────────────────────

export type UrgencyLevel = "low" | "medium" | "high";

export interface AIAnalysis {
  hypothesis_extracted: DiagnosticHypothesis;
  context_summary: string;
  flags: string[];
  suggested_actions: string[];
  urgency_level: UrgencyLevel;
}

// ── Patient Case (top-level aggregate) ───────────────────────────────────────

export interface PatientCase {
  patient: Patient;
  visit_date: string;
  clinical_note: ClinicalNote;
  orders: Order[];
  results: LabResult[];
  diagnostic_hypothesis: DiagnosticHypothesis;
  ground_truth_diagnosis: string;
  failure_mode: string;
  ai_analysis?: AIAnalysis;
}
