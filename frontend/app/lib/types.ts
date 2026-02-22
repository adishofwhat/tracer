// =============================================================================
// Diagnostic Loop Tracker — Core Type Definitions
// =============================================================================
// All date fields are ISO strings (YYYY-MM-DD), never Date objects.

export type OrderStatus = "pending" | "completed" | "cancelled";

export type UrgencyLevel = "low" | "medium" | "high";

export type LabFlag = "N" | "L" | "H" | "C";

export type ResultUrgency = "routine" | "urgent" | "critical";

// ── AI Analysis ──────────────────────────────────────────────────────────────

export interface AIAnalysis {
  primary_hypothesis: string;
  differential_diagnoses: string[];
  key_symptoms: string[];
  urgency: UrgencyLevel;
  reasoning: string;
  loop_status: string;
  flags: string[];
  agent_confidence: number | null;
  agent_review_flag: boolean | null;
  tests_ordered?: string[];
}

// ── Patient Data (top-level record) ──────────────────────────────────────────

export interface PatientData {
  patient_id: string;
  demographics: {
    age: number;
    sex: "M" | "F";
    mrn: string;
  };
  visit_date: string;
  clinical_note: {
    date: string;
    provider: string;
    specialty?: string;
    text: string;
  };
  orders: {
    order_id: string;
    test_name: string;
    status: OrderStatus;
    order_date: string;
    result_date?: string | null;
    days_pending?: number;
    failure_reason?: string;
  }[];
  results: {
    result_id: string;
    test_name: string;
    result_date: string;
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
  ai_should_flag: string[];
  ai_analysis: AIAnalysis;
}
