import patientsRaw from "@/data/patients_with_ai_final_enriched.json";
import type { PatientData } from "./types";

export function loadPatients(): PatientData[] {
  return patientsRaw as PatientData[];
}

export function getPatientById(id: string): PatientData | undefined {
  return loadPatients().find((p) => p.patient_id === id);
}

export function getPendingLoops(): PatientData[] {
  return loadPatients().filter((p) =>
    p.orders.some((o) => o.status === "pending")
  );
}
