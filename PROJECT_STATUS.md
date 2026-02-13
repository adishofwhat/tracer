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

### Current Phase: Foundation (Days 1-6)

### Completed Today (Day 1):
- [x] Track selection (Main + Agentic Workflow)
- [x] Team roles defined
- [x] Project structure created
- [x] 10 patient scenarios generated
- [x] 100 training examples generated
- [x] MedGemma download started (Lowest model is MedGemma 1.5 (4B))
- [ ] Test inference script created (Test failed, Validated GTX 1050 limits, GTX 1050 (4GB) is insufficient for MedGemma 1.5 4B-it. Need to shift to something else probably cloud based)

### Tomorrow (Day 2):
- [ ] Validate patient data with nurses
- [ ] Test MedGemma base model performance
- [ ] Start fine-tuning preparation
- [ ] Begin React frontend structure with Cursor

### Technical Stack:
- **AI:** MedGemma 1.5 (4B) (base + fine-tuned with LoRA)
- **Backend:** Python 3.10+, Transformers, PyTorch
- **Frontend:** React + Next.js + Tailwind CSS
- **Deployment:** Vercel (frontend), Colab (fine-tuning)
- **Hardware:** GTX 1050 (local testing), Colab Pro (fine-tuning)

### Key Architecture Decisions:
- **Feb 6:** Pre-compute all MedGemma outputs (no live inference in demo)
- **Feb 6:** React/Next.js for EHR-like UI (not Streamlit)
- **Feb 6:** Fine-tune for hypothesis extraction (Novel Task angle)
- **Feb 6:** Deploy live demo on Vercel (bonus points)
- **Feb 6:** Target Agentic Workflow Prize (perfect fit for loop tracking)

### Data Generated:
- Patient scenarios: 0/10 (target: end of Day 1)
- Training examples: 0/100 (target: end of Day 1)

### Questions/Blockers:
- None currently

### Next Critical Milestones:
- **Day 3:** Nurse validation of patient data
- **Day 5:** Fine-tuning complete
- **Day 10:** Live demo deployed
- **Day 16:** Video recorded
- **Day 18:** SUBMIT (buffer day)