# DIAGNOSTIC LOOP TRACKER (LoopGuard) - PROJECT STATUS

## Last Updated: Feb 12, 2026 - Day 1 Complete

### Team Structure:
- **Supervisor:** Adish - Final decisions, validation, testing
- **Planner:** Claude (AI) - Strategy, architecture, prompts
- **Assistant:** Gemini (AI) - Data generation, multimodal tasks
- **Engineer:** Cursor (AI) - Code generation, implementation

### Competition Targets:
- **Primary Track:** Main Track ($30K-$10K)
- **Secondary Track:** Agentic Workflow Prize ($5K)
- **Bonus:** Hugging Face fine-tuned model
- **Bonus:** Live demo on Vercel
- **Deadline:** Feb 24, 11:59 PM UTC

### Current Phase: Foundation (Days 1-?)

### Completed Today (Day 1):
- [x] Track selection (Main + Agentic Workflow)
- [x] Team roles defined
- [x] Project structure created
- [x] 10 patient scenarios generated
- [x] 100 training examples generated
- [x] MedGemma download started (Lowest model is MedGemma 1.5 (4B))
- [ ] Test inference script created (Test failed, Validated GTX 1050 limits, GTX 1050 (4GB) is insufficient for MedGemma 1.5 4B-it. Need to shift to something else probably cloud based)

Completed Today (Day 2):
[x] Frontend Architecture: Built full Next.js + Tailwind UI (Layout, Sidebar).
[x] High-Density Components: Created ResultsList (Epic-style sorting) and ResultCard.
[x] Decision Support UI: Built AIContextPanel with vertical Diagnostic Loop Timeline.
[x] Data Layer: Defined strict types.ts and realistic mockData.ts.
[x] Evaluation Logic: Created src/utils/evaluator.py for scoring.
[x] Base Model Benchmark: Tested Base Model
    Success: One-shot extraction works.
    Failure: Zero-shot extraction fails (hallucinated JSON).
    Failure: Open-ended prompts trigger safety loops.
[ ] Nurse Feedback push for another day.

Blockers / Issues:
Hardware Limit (Colab): Fine-tuning paused. training json and script are ready, but Colab GPU runtime disconnected/hit quota before training could start.

Action: Resume fine-tuning immediately on Day 3 once quota resets.

### Technical Stack:
- **AI:** MedGemma 1.5 (4B) (base + fine-tuned with LoRA)
- **Backend:** Python 3.10+, Transformers, PyTorch
- **Frontend:** React + Next.js + Tailwind CSS
- **Deployment:** Vercel (frontend), Colab (fine-tuning)
- **Hardware:** GTX 1050 (local testing), Colab Pro (fine-tuning)

### Key Architecture Decisions:
- **Feb ?:** Pre-compute all MedGemma outputs (no live inference in demo)
- **Feb ?:** React/Next.js for EHR-like UI (not Streamlit)
- **Feb ?:** Fine-tune for hypothesis extraction (Novel Task angle)
- **Feb ?:** Deploy live demo on Vercel (bonus points)
- **Feb ?:** Target Agentic Workflow Prize (perfect fit for loop tracking)

### Data Generated:
- Patient scenarios: 10/10 (target: end of Day 1)
- Training examples: 110/100 (target: end of Day 1)

### Questions/Blockers:
- Hardware Limit reached due to GTX 1050 4GB for running the model. Have to look for other options.

### Next Critical Milestones:
- **Day ?:** Nurse validation of patient data
- **Day ?:** Fine-tuning complete
- **Day ?:** Live demo deployed
- **Day ?:** Video recorded
- **Day ?:** SUBMIT (buffer day)