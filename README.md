# Tracer AI Diagnostic Loop Tracking System

> **MedGemma Impact Challenge Submission**
> Preventing missed diagnoses in ambulatory care through fine-tuned MedGemma and a 4-agent quality pipeline.

**[Live Demo]([https://tracer-health.vercel.app/])**

**[Fine-tuned Model (HuggingFace)]([HUGGINGFACE URL])**

**[Fine-tuning Notebook (Kaggle)]([KAGGLE URL])**

---

## The Problem

A 58-year-old patient visits her primary care physician with three months of abdominal bloating and early satiety. Her doctor suspects ovarian pathology, orders a CA-125 and transvaginal ultrasound, and documents the clinical reasoning clearly. The CA-125 comes back at 685 U/mL  (critically elevated), normal is under 35. The result lands in an inbox of 200 items. The ultrasound was never scheduled. Six weeks later, she presents with a bowel obstruction from advanced ovarian cancer.

The loop was never closed.

Diagnostic errors cause an estimated 40,000–80,000 preventable deaths annually in the US. The majority are not failures of clinical knowledge they are failures of workflow. A physician suspects the right diagnosis, orders the right test, and the result either never arrives or arrives without the context needed to act on it.

**Tracer solves the follow-up gap.** It reads the original clinical note at the time of ordering, extracts the diagnostic hypothesis using fine-tuned MedGemma, and monitors incoming results alerting physicians when a critical finding arrives or when a pending test has gone too long without resolution.

---

## Solution Overview

```
Clinical Note → Fine-tuned MedGemma → Structured Hypothesis
                                              ↓
                                    4-Agent Quality Pipeline
                                              ↓
                              AI-Enriched Results Inbox + Loop Tracker
```

When a physician orders a test, Tracer:
1. Extracts the diagnostic hypothesis from the clinical note (primary hypothesis, differential, key symptoms, urgency, reasoning)
2. Runs the extraction through a 4-agent validation pipeline
3. Stores the structured hypothesis against the patient record
4. When results arrive, surfaces the original clinical context alongside the new finding
5. Flags open loops tests ordered but never completed for physician follow-up

---

## Technical Architecture

### Model
- **Base model:** MedGemma 1.5 (4B-it) Google's medical-domain pretrained model
- **Fine-tuning:** LoRA adaptation on 421 high-quality clinical note → hypothesis extraction pairs
- **Training:** Kaggle GPU (T4), ~2 hours, prompt masking enabled
- **Result:** Validation loss 0.866, 99% field completeness vs ~50% for base MedGemma

### 4-Agent Quality Pipeline
| Agent | Role | Model |
|---|---|---|
| Agent 1 | Rule-based pre-validator | Deterministic |
| Agent 2 | Hypothesis extractor | Fine-tuned MedGemma v2 |
| Agent 3 | Quality checker (urgency, plausibility) | Base MedGemma |
| Agent 4 | Confidence scorer + flag trigger | Base MedGemma |

Each patient record carries `agent_confidence` (1–10) and `agent_review_flag` (boolean) surfaced prominently in the physician UI.

### Frontend
- **Framework:** Next.js 14, TypeScript, Tailwind CSS
- **Deployment:** Vercel
- **Design:** EHR-style interface clinical, data-dense, zero decorative elements
- **Three views:** Results Inbox, Patient Detail, Loop Tracker

### Integration Path (Production)
The prototype uses pre-computed outputs. Production integration runs through standard FHIR R4 APIs that Epic and Cerner both expose no custom EHR modification required.

---

## Demo

The live demo includes 20 realistic patient scenarios across multiple specialties oncology, cardiology, neurology, emergency medicine each representing a real failure mode where a diagnostic loop was not closed.

**Key cases to explore:**
- **P001** Ovarian cancer: CA-125 of 685, ultrasound never scheduled (18 days pending)
- **P011** Medulloblastoma in a 16-year-old: MRI delayed 10 days awaiting insurance authorization, Confidence 10/10
- **P010** DVT: D-dimer 2,850, ultrasound pending 5 days, PE risk
- **P020** Glioblastoma: patient delayed MRI for work project despite bilateral papilledema

---

## Repository Structure

```
tracer/
├── README.md
├── notebooks/
│   ├── 01_data_exploration.ipynb       # Dataset analysis and validation
│   ├── 02_model_finetuning.ipynb       # MedGemma LoRA fine-tuning
│   ├── 03_batch_inference.ipynb        # Inference on patient scenarios
│   ├── 04_evaluation.ipynb             # Base vs fine-tuned comparison
│   └── 05_agentic_pipeline.ipynb       # 4-agent quality pipeline
├── src/
│   ├── ai/
│   │   ├── hypothesis_extractor.py     # Core extraction logic
│   │   ├── loop_detector.py            # Pending order detection
│   │   └── result_analyzer.py         # Result contextualization
│   └── utils/
│       ├── data_loader.py              # Data loading utilities
│       └── evaluator.py               # Model evaluation utilities
├── scripts/
│   ├── data_pipeline.py               # Data validation pipeline
│   ├── data_qa_pipeline.py            # QA checks on training data
│   ├── generate_patients.py           # Patient scenario generation
│   └── generate_training_data.py      # Training example generation
└── frontend/
    ├── data/
    │   └── patients_with_ai_final_enriched.json
    └── app/                            # Next.js application
```

---

## Setup

### Run the demo locally

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

### Run fine-tuning notebook

The fine-tuning notebook is designed for Kaggle (GPU T4). Open `notebooks/02_model_finetuning.ipynb` on Kaggle and attach the MedGemma model from the Kaggle model hub.

---

## Dataset

- **421 training examples** across 18 medical specialties
- **20 patient scenarios** for demo diverse urgency levels, specialties, and failure modes
- All data is synthetic, generated with clinical accuracy validation
- Training data schema: `input` (clinical note) → `output` (6-field structured hypothesis)

---

## Model Performance

| Model | Field Completeness | Valid Structure | Urgency Accuracy |
|---|---|---|---|
| Gemma 2 2B (no medical pretraining) | ~30% | ~60% | ~40% |
| Base MedGemma 1.5 (4B) | ~50% | ~75% | ~55% |
| **Tracer v2 (fine-tuned)** | **99%** | **100%** | **~85%** |

Fine-tuning on domain-specific clinical data with prompt masking produces a model that reliably extracts structured diagnostic hypotheses the foundation the agentic pipeline depends on.

---

## Impact

If Tracer catches 1% of the diagnostic errors that currently cause preventable death: **400–800 lives per year.**
If it catches 10%: **4,000–8,000 lives per year.**

The 23 open loops in the demo represent exactly the failure pattern that causes these outcomes tests ordered, results arrived, follow-up never happened. Tracer closes the loop.

---

## Competition

Built for the **MedGemma Impact Challenge** (Google, February 2026).
Uses fine-tuned MedGemma 1.5 (4B-it) as the core extraction model.

## License
Apache 2.0 see [LICENSE](LICENSE) for details.
