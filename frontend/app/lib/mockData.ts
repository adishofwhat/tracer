import type { PatientCase } from "./types";

// =============================================================================
// Mock Patient Cases — 3 scenarios across urgency tiers
// Replace with real MedGemma-analyzed data before submission.
// =============================================================================

// ── Case 1: HIGH urgency — Missed colon cancer (overdue colonoscopy) ─────────

const case1_missedColonCancer: PatientCase = {
  patient: {
    patient_id: "PT-1001",
    demographics: {
      age: 62,
      sex: "M",
      mrn: "MRN-884210",
      name: "Robert Chen",
    },
  },
  visit_date: "2026-01-15",
  clinical_note: {
    date: "2026-01-15",
    provider: "Dr. Sarah Patel",
    specialty: "Internal Medicine",
    text: "62 y/o male presents with 3-month history of intermittent rectal bleeding and unintentional weight loss of 12 lbs. Patient reports fatigue and change in bowel habits. Family history significant for father dx colon cancer at age 58. Last colonoscopy was 2018 — overdue for screening. Physical exam notable for pallor. Ordered CBC, CMP, CEA, and colonoscopy referral.",
  },
  orders: [
    {
      order_id: "ORD-5001",
      test_name: "CBC with Differential",
      order_date: "2026-01-15",
      status: "completed",
      result_date: "2026-01-16",
    },
    {
      order_id: "ORD-5002",
      test_name: "Carcinoembryonic Antigen (CEA)",
      order_date: "2026-01-15",
      status: "completed",
      result_date: "2026-01-17",
    },
    {
      order_id: "ORD-5003",
      test_name: "Colonoscopy",
      order_date: "2026-01-15",
      status: "pending",
      days_pending: 29,
      failure_reason: "Referral not scheduled — GI backlog",
    },
  ],
  results: [
    {
      result_id: "RES-7001",
      order_id: "ORD-5001",
      test_name: "CBC with Differential",
      result_date: "2026-01-16",
      values: {
        Hemoglobin: {
          value: 9.8,
          unit: "g/dL",
          reference: "13.5-17.5",
          flag: "L",
        },
        Hematocrit: {
          value: 29.4,
          unit: "%",
          reference: "38.3-48.6",
          flag: "L",
        },
        MCV: {
          value: 72,
          unit: "fL",
          reference: "80-100",
          flag: "L",
        },
        WBC: {
          value: 7.2,
          unit: "K/uL",
          reference: "4.5-11.0",
          flag: "N",
        },
        Platelets: {
          value: 310,
          unit: "K/uL",
          reference: "150-400",
          flag: "N",
        },
      },
      interpretation:
        "Microcytic anemia — iron deficiency pattern. In a 62 y/o male with rectal bleeding, GI source must be ruled out.",
      urgency: "urgent",
    },
    {
      result_id: "RES-7002",
      order_id: "ORD-5002",
      test_name: "Carcinoembryonic Antigen (CEA)",
      result_date: "2026-01-17",
      values: {
        CEA: {
          value: 8.3,
          unit: "ng/mL",
          reference: "0.0-3.0",
          flag: "H",
        },
      },
      interpretation:
        "Elevated CEA. Non-specific but concerning in context of rectal bleeding and weight loss.",
      urgency: "urgent",
    },
  ],
  diagnostic_hypothesis: {
    primary: "Colorectal carcinoma",
    differential: [
      "Iron deficiency anemia secondary to chronic GI blood loss",
      "Colonic polyps",
      "Inflammatory bowel disease",
    ],
    reasoning:
      "Combination of microcytic anemia, elevated CEA, rectal bleeding, weight loss, and positive family history in a 62 y/o male is highly concerning for colorectal malignancy. Colonoscopy is critically overdue.",
    confidence: "high",
  },
  ground_truth_diagnosis: "Colorectal carcinoma (Stage IIIA)",
  failure_mode: "Delayed colonoscopy — referral lost in GI scheduling backlog",
  ai_analysis: {
    hypothesis_extracted: {
      primary: "Colorectal carcinoma",
      differential: [
        "Iron deficiency anemia secondary to chronic GI blood loss",
        "Colonic polyps",
        "Inflammatory bowel disease",
      ],
      reasoning:
        "Microcytic anemia with Hgb 9.8, elevated CEA 8.3, rectal bleeding, 12 lb weight loss, and FHx of colon cancer at 58 — classic red-flag presentation for colorectal malignancy.",
      confidence: "high",
    },
    context_summary:
      "62 y/o male with rectal bleeding, weight loss, microcytic anemia, and elevated CEA. Colonoscopy ordered Jan 15 but not yet scheduled after 29 days. Last screening was 8 years ago.",
    flags: [
      "CRITICAL: Colonoscopy pending 29 days — exceeds 14-day follow-up window",
      "Elevated CEA (8.3 ng/mL) with GI symptoms",
      "Hemoglobin 9.8 g/dL — moderate anemia",
      "Family history of colon cancer (first-degree relative)",
      "Overdue for routine colonoscopy screening since 2023",
    ],
    suggested_actions: [
      "Escalate colonoscopy referral to urgent priority",
      "Contact GI scheduling to expedite appointment within 7 days",
      "Order iron studies and reticulocyte count",
      "Consider CT abdomen/pelvis if colonoscopy cannot be scheduled within 2 weeks",
      "Notify attending physician of diagnostic loop closure failure",
    ],
    urgency_level: "high",
  },
};

// ── Case 2: MEDIUM urgency — Chest X-ray finding needs follow-up ─────────────

const case2_chestXrayFollowUp: PatientCase = {
  patient: {
    patient_id: "PT-1002",
    demographics: {
      age: 55,
      sex: "F",
      mrn: "MRN-337291",
      name: "Maria Gonzalez",
    },
  },
  visit_date: "2026-01-22",
  clinical_note: {
    date: "2026-01-22",
    provider: "Dr. James Whitfield",
    specialty: "Emergency Medicine",
    text: "55 y/o female presents to ED with acute onset pleuritic chest pain and dry cough x 3 days. Denies fever, hemoptysis. 20-pack-year smoking history, quit 2 years ago. Vitals stable. CXR obtained showing 1.8 cm spiculated nodule in right upper lobe — incidental finding. PE ruled out by CT-PA. Discharged with recommendation for pulmonary follow-up for nodule.",
  },
  orders: [
    {
      order_id: "ORD-5010",
      test_name: "Chest X-Ray (PA & Lateral)",
      order_date: "2026-01-22",
      status: "completed",
      result_date: "2026-01-22",
    },
    {
      order_id: "ORD-5011",
      test_name: "CT Pulmonary Angiogram",
      order_date: "2026-01-22",
      status: "completed",
      result_date: "2026-01-22",
    },
    {
      order_id: "ORD-5012",
      test_name: "Pulmonology Referral — Lung Nodule Follow-up",
      order_date: "2026-01-22",
      status: "pending",
      days_pending: 22,
      failure_reason: "Discharge referral not transmitted to outpatient clinic",
    },
  ],
  results: [
    {
      result_id: "RES-7010",
      order_id: "ORD-5010",
      test_name: "Chest X-Ray (PA & Lateral)",
      result_date: "2026-01-22",
      radiology_report:
        "PA and lateral chest radiograph. Heart size normal. Lungs: 1.8 cm spiculated opacity in the right upper lobe. No pleural effusion. No pneumothorax. Osseous structures intact. IMPRESSION: Right upper lobe spiculated nodule — recommend CT chest for further evaluation. Fleischner Society guidelines apply.",
      key_finding: "1.8 cm spiculated RUL nodule",
      urgency: "urgent",
    },
    {
      result_id: "RES-7011",
      order_id: "ORD-5011",
      test_name: "CT Pulmonary Angiogram",
      result_date: "2026-01-22",
      radiology_report:
        "No pulmonary embolism identified. Incidental note: 1.9 cm spiculated nodule in the right upper lobe, partially solid with ground-glass component. Suspicious morphology. Recommend dedicated CT chest with contrast and PET-CT for further characterization. Mediastinal lymphadenopathy not identified.",
      key_finding:
        "1.9 cm spiculated partially-solid RUL nodule, suspicious morphology",
      urgency: "urgent",
    },
  ],
  diagnostic_hypothesis: {
    primary: "Lung nodule — rule out primary lung malignancy",
    differential: [
      "Non-small cell lung cancer",
      "Granuloma (histoplasmosis/TB)",
      "Hamartoma",
      "Metastatic disease",
    ],
    reasoning:
      "Spiculated 1.9 cm partially-solid nodule in a 55 y/o former smoker with 20-pack-year history. Morphology is suspicious per radiology. Requires tissue characterization.",
    confidence: "medium",
  },
  ground_truth_diagnosis: "Stage IA non-small cell lung cancer (adenocarcinoma)",
  failure_mode:
    "ED discharge referral to pulmonology not transmitted — patient lost to follow-up",
  ai_analysis: {
    hypothesis_extracted: {
      primary: "Lung nodule — rule out primary lung malignancy",
      differential: [
        "Non-small cell lung cancer",
        "Granuloma",
        "Hamartoma",
        "Metastatic disease",
      ],
      reasoning:
        "1.9 cm spiculated partially-solid nodule on CT-PA in a 55 y/o former smoker (20 pack-years). Fleischner high-risk category. Two imaging studies confirm suspicious morphology.",
      confidence: "medium",
    },
    context_summary:
      "55 y/o female ex-smoker seen in ED for chest pain. PE ruled out, but incidental 1.9 cm spiculated lung nodule found on both CXR and CT-PA. Pulmonology referral ordered at discharge but never transmitted to outpatient clinic. 22 days elapsed.",
    flags: [
      "Pulmonology referral pending 22 days — not transmitted to outpatient",
      "Spiculated nodule >1.5 cm in former smoker — Fleischner high-risk",
      "Two concordant imaging studies confirm suspicious morphology",
      "Patient may be unaware follow-up is needed (ED discharge)",
    ],
    suggested_actions: [
      "Re-send pulmonology referral with URGENT priority",
      "Contact patient directly to schedule follow-up",
      "Order dedicated CT chest with contrast within 2 weeks",
      "Consider PET-CT if CT confirms suspicious features",
      "Add to lung cancer screening program",
    ],
    urgency_level: "medium",
  },
};

// ── Case 3: LOW urgency — Routine lab results ────────────────────────────────

const case3_routineLabs: PatientCase = {
  patient: {
    patient_id: "PT-1003",
    demographics: {
      age: 45,
      sex: "F",
      mrn: "MRN-562018",
      name: "Jennifer Park",
    },
  },
  visit_date: "2026-02-03",
  clinical_note: {
    date: "2026-02-03",
    provider: "Dr. Anil Mehta",
    specialty: "Family Medicine",
    text: "45 y/o female presents for annual wellness exam. PMH: HTN controlled on lisinopril 10 mg daily, pre-diabetes (HbA1c 6.1% last year). No complaints today. BP 128/82. BMI 27.4. Ordered annual labs: CMP, lipid panel, HbA1c, TSH. Continue current medications. Follow up in 3 months if labs abnormal, otherwise 12 months.",
  },
  orders: [
    {
      order_id: "ORD-5020",
      test_name: "Comprehensive Metabolic Panel (CMP)",
      order_date: "2026-02-03",
      status: "completed",
      result_date: "2026-02-04",
    },
    {
      order_id: "ORD-5021",
      test_name: "Lipid Panel",
      order_date: "2026-02-03",
      status: "completed",
      result_date: "2026-02-04",
    },
    {
      order_id: "ORD-5022",
      test_name: "Hemoglobin A1c",
      order_date: "2026-02-03",
      status: "completed",
      result_date: "2026-02-04",
    },
    {
      order_id: "ORD-5023",
      test_name: "TSH",
      order_date: "2026-02-03",
      status: "pending",
      days_pending: 10,
      failure_reason: "Specimen hemolyzed — recollection needed",
    },
  ],
  results: [
    {
      result_id: "RES-7020",
      order_id: "ORD-5020",
      test_name: "Comprehensive Metabolic Panel (CMP)",
      result_date: "2026-02-04",
      values: {
        Glucose: {
          value: 112,
          unit: "mg/dL",
          reference: "70-100",
          flag: "H",
        },
        BUN: {
          value: 14,
          unit: "mg/dL",
          reference: "7-20",
          flag: "N",
        },
        Creatinine: {
          value: 0.9,
          unit: "mg/dL",
          reference: "0.6-1.2",
          flag: "N",
        },
        Sodium: {
          value: 140,
          unit: "mEq/L",
          reference: "136-145",
          flag: "N",
        },
        Potassium: {
          value: 4.1,
          unit: "mEq/L",
          reference: "3.5-5.0",
          flag: "N",
        },
        ALT: {
          value: 22,
          unit: "U/L",
          reference: "7-56",
          flag: "N",
        },
      },
      interpretation:
        "Fasting glucose mildly elevated at 112, consistent with known pre-diabetes. Renal and hepatic function within normal limits.",
      urgency: "routine",
    },
    {
      result_id: "RES-7021",
      order_id: "ORD-5021",
      test_name: "Lipid Panel",
      result_date: "2026-02-04",
      values: {
        "Total Cholesterol": {
          value: 218,
          unit: "mg/dL",
          reference: "<200",
          flag: "H",
        },
        "LDL Cholesterol": {
          value: 142,
          unit: "mg/dL",
          reference: "<100",
          flag: "H",
        },
        "HDL Cholesterol": {
          value: 52,
          unit: "mg/dL",
          reference: ">40",
          flag: "N",
        },
        Triglycerides: {
          value: 120,
          unit: "mg/dL",
          reference: "<150",
          flag: "N",
        },
      },
      interpretation:
        "LDL elevated at 142. Consider statin therapy given HTN comorbidity and pre-diabetes (ASCVD risk factors).",
      urgency: "routine",
    },
    {
      result_id: "RES-7022",
      order_id: "ORD-5022",
      test_name: "Hemoglobin A1c",
      result_date: "2026-02-04",
      values: {
        HbA1c: {
          value: 6.3,
          unit: "%",
          reference: "<5.7",
          flag: "H",
        },
      },
      interpretation:
        "HbA1c 6.3% — pre-diabetes range (5.7-6.4%). Slight increase from 6.1% one year ago. Reinforce lifestyle modifications.",
      urgency: "routine",
    },
  ],
  diagnostic_hypothesis: {
    primary: "Pre-diabetes with progression risk",
    differential: [
      "Metabolic syndrome",
      "Hyperlipidemia requiring pharmacotherapy",
      "Subclinical hypothyroidism (pending TSH)",
    ],
    reasoning:
      "Rising HbA1c from 6.1% to 6.3% over 12 months with elevated fasting glucose and LDL. Multiple ASCVD risk factors present. TSH still pending.",
    confidence: "medium",
  },
  ground_truth_diagnosis:
    "Pre-diabetes with metabolic syndrome, subclinical hypothyroidism (TSH pending)",
  failure_mode:
    "TSH specimen hemolyzed — recollection not yet scheduled, mild diagnostic gap",
  ai_analysis: {
    hypothesis_extracted: {
      primary: "Pre-diabetes with progression risk",
      differential: [
        "Metabolic syndrome",
        "Hyperlipidemia requiring statin therapy",
        "Subclinical hypothyroidism",
      ],
      reasoning:
        "HbA1c trending up (6.1% → 6.3%), fasting glucose 112, LDL 142, BMI 27.4, HTN. Converging metabolic risk factors. TSH pending due to hemolyzed specimen.",
      confidence: "medium",
    },
    context_summary:
      "45 y/o female with HTN and pre-diabetes seen for annual wellness. Labs show worsening glycemic control and elevated LDL. TSH specimen hemolyzed 10 days ago — recollection not yet scheduled.",
    flags: [
      "TSH pending 10 days — hemolyzed specimen needs recollection",
      "HbA1c rising: 6.1% → 6.3% over 12 months",
      "LDL 142 mg/dL — consider statin per ACC/AHA guidelines",
      "Fasting glucose 112 mg/dL — impaired fasting glucose",
    ],
    suggested_actions: [
      "Schedule TSH recollection within 1 week",
      "Discuss statin initiation (10-year ASCVD risk likely >7.5%)",
      "Reinforce dietary counseling and exercise prescription",
      "Consider referral to diabetes prevention program",
      "Schedule 3-month follow-up for repeat fasting glucose and lipids",
    ],
    urgency_level: "low",
  },
};

// ── Exported collection ──────────────────────────────────────────────────────

export const MOCK_PATIENTS: PatientCase[] = [
  case1_missedColonCancer,
  case2_chestXrayFollowUp,
  case3_routineLabs,
];
