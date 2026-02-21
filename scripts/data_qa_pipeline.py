"""
MedGemma Data Pipeline
======================
1. Merge multiple training JSON files → training_final_400.json
2. Validate training examples (schema + medical quality checks)
3. Evaluate patient scenarios (completeness + demo readiness)

Usage:
    python data_pipeline.py --training_dir ./training_data --patients_file ./patients.json
"""

import json
import os
import argparse
from pathlib import Path
from typing import Any

# ─────────────────────────────────────────────
# STEP 1: MERGE TRAINING JSON FILES
# ─────────────────────────────────────────────

def merge_training_files(training_dir: str) -> list[dict]:
    """Merge all JSON files in a directory into one list."""
    training_dir = Path(training_dir)
    all_examples = []
    files_found = []

    for json_file in sorted(training_dir.glob("**/*.json")):
        try:
            with open(json_file, "r") as f:
                data = json.load(f)

            # Handle both array files and single-object files
            if isinstance(data, list):
                all_examples.extend(data)
                files_found.append((json_file.name, len(data)))
            elif isinstance(data, dict):
                all_examples.append(data)
                files_found.append((json_file.name, 1))

        except json.JSONDecodeError as e:
            print(f"  ❌ JSON parse error in {json_file.name}: {e}")
        except Exception as e:
            print(f"  ❌ Error reading {json_file.name}: {e}")

    print(f"\n{'='*55}")
    print(f"  MERGE SUMMARY")
    print(f"{'='*55}")
    for fname, count in files_found:
        print(f"  ✅ {fname:<40} {count:>4} examples")
    print(f"{'─'*55}")
    print(f"  {'TOTAL':<40} {len(all_examples):>4} examples")
    print(f"{'='*55}\n")

    return all_examples


def save_merged(examples: list[dict], output_path: str) -> None:
    with open(output_path, "w") as f:
        json.dump(examples, f, indent=2)
    print(f"  💾 Saved merged file → {output_path}\n")


# ─────────────────────────────────────────────
# STEP 2: VALIDATE TRAINING EXAMPLES
# ─────────────────────────────────────────────

REQUIRED_OUTPUT_FIELDS = [
    "primary_hypothesis",
    "differential_diagnoses",
    "key_symptoms",
    "urgency",
    "tests_ordered",
    "reasoning",
]

VALID_URGENCY = {"low", "medium", "high"}

REASONING_MIN = 50
REASONING_MAX = 300


def validate_training_example(ex: Any, idx: int) -> dict:
    """Validate a single training example. Returns result dict."""
    issues = []

    # ── Top-level structure
    if not isinstance(ex, dict):
        return {"idx": idx, "status": "REJECT", "issues": ["Not a dict"]}

    if "input" not in ex:
        issues.append("Missing 'input' field")
    elif not isinstance(ex["input"], str) or len(ex["input"]) < 100:
        issues.append(f"'input' too short ({len(ex.get('input',''))} chars, min 100)")

    if "output" not in ex:
        issues.append("Missing 'output' field")
        return {"idx": idx, "status": "REJECT", "issues": issues}

    out = ex["output"]
    if not isinstance(out, dict):
        issues.append("'output' is not a dict")
        return {"idx": idx, "status": "REJECT", "issues": issues}

    # ── Required output fields
    for field in REQUIRED_OUTPUT_FIELDS:
        if field not in out:
            issues.append(f"Missing output field: '{field}'")

    # ── Field-specific checks
    if "primary_hypothesis" in out:
        if not isinstance(out["primary_hypothesis"], str) or not out["primary_hypothesis"].strip():
            issues.append("'primary_hypothesis' is empty or not a string")

    if "differential_diagnoses" in out:
        d = out["differential_diagnoses"]
        if not isinstance(d, list):
            issues.append("'differential_diagnoses' must be a list")
        elif len(d) < 1:
            issues.append("'differential_diagnoses' must have at least 1 item")
        elif len(d) > 5:
            issues.append(f"'differential_diagnoses' has {len(d)} items (max 5)")

    if "key_symptoms" in out:
        k = out["key_symptoms"]
        if not isinstance(k, list):
            issues.append("'key_symptoms' must be a list")
        elif len(k) < 2:
            issues.append("'key_symptoms' must have at least 2 items")

    if "urgency" in out:
        if out["urgency"] not in VALID_URGENCY:
            issues.append(f"'urgency' must be low/medium/high, got: '{out['urgency']}'")

    if "tests_ordered" in out:
        t = out["tests_ordered"]
        if not isinstance(t, list) or len(t) < 1:
            issues.append("'tests_ordered' must be a non-empty list")

    if "reasoning" in out:
        r = out["reasoning"]
        if not isinstance(r, str):
            issues.append("'reasoning' must be a string")
        elif len(r) < REASONING_MIN:
            issues.append(f"'reasoning' too short ({len(r)} chars, min {REASONING_MIN})")
        elif len(r) > REASONING_MAX:
            issues.append(f"'reasoning' too long ({len(r)} chars, max {REASONING_MAX})")

    # ── Artifact check (model corruption)
    raw_str = json.dumps(ex)
    if "<unused" in raw_str or "<start_of_turn>" in raw_str or "thought\n" in raw_str:
        issues.append("⚠️  Model artifact detected (<unused> or turn tokens)")

    # ── Status
    if not issues:
        status = "PASS"
    elif any("Missing" in i or "REJECT" in i or "artifact" in i for i in issues):
        status = "REJECT"
    else:
        status = "WARNING"

    return {"idx": idx, "status": status, "issues": issues}


def validate_training_data(examples: list[dict]) -> dict:
    """Validate all training examples and print report."""
    results = [validate_training_example(ex, i) for i, ex in enumerate(examples)]

    passed  = [r for r in results if r["status"] == "PASS"]
    warned  = [r for r in results if r["status"] == "WARNING"]
    failed  = [r for r in results if r["status"] == "REJECT"]

    pass_rate = len(passed) / len(examples) * 100 if examples else 0

    print(f"\n{'='*55}")
    print(f"  TRAINING DATA VALIDATION REPORT")
    print(f"{'='*55}")
    print(f"  Total examples : {len(examples)}")
    print(f"  ✅ PASS        : {len(passed)}  ({pass_rate:.1f}%)")
    print(f"  ⚠️  WARNING     : {len(warned)}")
    print(f"  ❌ REJECT      : {len(failed)}")
    print(f"{'─'*55}")

    if pass_rate >= 85:
        print(f"  🟢 QUALITY THRESHOLD MET (≥85%) — ready for fine-tuning")
    elif pass_rate >= 70:
        print(f"  🟡 BELOW TARGET — fix warnings before fine-tuning")
    else:
        print(f"  🔴 CRITICAL — too many failures, regenerate data")

    # Print warnings
    if warned:
        print(f"\n  ⚠️  WARNINGS ({len(warned)} examples):")
        for r in warned[:10]:  # show first 10
            print(f"    Example #{r['idx']:03d}: {'; '.join(r['issues'])}")
        if len(warned) > 10:
            print(f"    ... and {len(warned)-10} more")

    # Print failures
    if failed:
        print(f"\n  ❌ FAILURES ({len(failed)} examples):")
        for r in failed[:10]:
            print(f"    Example #{r['idx']:03d}: {'; '.join(r['issues'])}")
        if len(failed) > 10:
            print(f"    ... and {len(failed)-10} more")

    # Urgency distribution
    urgencies = [ex.get("output", {}).get("urgency", "unknown")
                 for ex in examples if isinstance(ex, dict)]
    print(f"\n  URGENCY DISTRIBUTION:")
    for u in ["high", "medium", "low", "unknown"]:
        count = urgencies.count(u)
        bar = "█" * (count // 5)
        print(f"    {u:<8}: {count:>4}  {bar}")

    print(f"{'='*55}\n")

    return {"passed": passed, "warned": warned, "failed": failed, "pass_rate": pass_rate}


def save_clean_training(examples: list[dict], results: dict, output_path: str) -> None:
    """Save only PASS + WARNING examples (exclude REJECT)."""
    reject_idxs = {r["idx"] for r in results["failed"]}
    clean = [ex for i, ex in enumerate(examples) if i not in reject_idxs]
    with open(output_path, "w") as f:
        json.dump(clean, f, indent=2)
    print(f"  💾 Clean training data saved → {output_path}")
    print(f"     ({len(clean)} examples after removing {len(reject_idxs)} rejections)\n")


# ─────────────────────────────────────────────
# STEP 3: EVALUATE PATIENT SCENARIOS
# ─────────────────────────────────────────────

REQUIRED_PATIENT_FIELDS = [
    "patient_id", "demographics", "visit_date",
    "clinical_note", "orders", "results",
    "diagnostic_hypothesis", "ground_truth_diagnosis", "failure_mode",
]

REQUIRED_DEMO_FIELDS = ["ai_should_flag"]  # bonus but important


def evaluate_patient(p: Any, idx: int) -> dict:
    """Evaluate a single patient scenario."""
    issues = []
    warnings = []
    score = 100  # start at 100, deduct for issues

    if not isinstance(p, dict):
        return {"idx": idx, "id": "?", "status": "REJECT",
                "score": 0, "issues": ["Not a dict"], "warnings": []}

    pid = p.get("patient_id", f"#{idx}")

    # ── Required fields
    for field in REQUIRED_PATIENT_FIELDS:
        if field not in p:
            issues.append(f"Missing: '{field}'")
            score -= 15

    # ── Demographics
    demo = p.get("demographics", {})
    if isinstance(demo, dict):
        age = demo.get("age")
        if age is None:
            issues.append("Missing demographics.age")
            score -= 5
        elif not (0 <= age <= 120):
            issues.append(f"Unrealistic age: {age}")
            score -= 10

        if demo.get("sex") not in ("M", "F", None):
            issues.append(f"Invalid sex value: {demo.get('sex')}")
            score -= 5

    # ── Clinical note
    note = p.get("clinical_note", {})
    if isinstance(note, dict):
        text = note.get("text", "")
        if len(text) < 200:
            issues.append(f"Clinical note too short ({len(text)} chars, min 200)")
            score -= 10
        # Check SOAP format
        soap_keywords = ["SUBJECTIVE", "OBJECTIVE", "ASSESSMENT", "PLAN",
                        "S:", "O:", "A:", "P:", "Subjective", "Objective"]
        if not any(kw in text for kw in soap_keywords):
            warnings.append("Clinical note may not be in SOAP format")
            score -= 5

    # ── Orders
    orders = p.get("orders", [])
    if not isinstance(orders, list) or len(orders) < 1:
        issues.append("Must have at least 1 order")
        score -= 10
    else:
        pending = [o for o in orders if isinstance(o, dict)
                   and o.get("status") == "pending"]
        if not pending:
            warnings.append("No pending orders — needed to show 'open loop'")
            score -= 10
        else:
            for o in pending:
                days = o.get("days_pending")
                if days is None:
                    warnings.append(f"Order '{o.get('test_name','?')}' missing days_pending")
                    score -= 3
                if not o.get("failure_reason"):
                    warnings.append(f"Order '{o.get('test_name','?')}' missing failure_reason")
                    score -= 3

    # ── Results
    results = p.get("results", [])
    if not isinstance(results, list) or len(results) < 1:
        issues.append("Must have at least 1 result")
        score -= 10
    else:
        for r in results:
            if isinstance(r, dict):
                if not r.get("full_text"):
                    warnings.append(f"Result '{r.get('test_name','?')}' missing full_text")
                    score -= 3

    # ── Diagnostic hypothesis
    hyp = p.get("diagnostic_hypothesis", {})
    if isinstance(hyp, dict):
        if not hyp.get("primary"):
            issues.append("Missing diagnostic_hypothesis.primary")
            score -= 10
        if not hyp.get("reasoning"):
            warnings.append("Missing diagnostic_hypothesis.reasoning")
            score -= 5

    # ── Failure mode (critical for demo)
    fm = p.get("failure_mode", "")
    if not fm or len(str(fm)) < 30:
        issues.append("failure_mode too short or missing (critical for demo)")
        score -= 15

    # ── AI flags (demo quality)
    flags = p.get("ai_should_flag", [])
    if not flags or len(flags) < 2:
        warnings.append("ai_should_flag missing or too few items (needed for demo)")
        score -= 8

    # ── Days pending check (diversity)
    all_days = [o.get("days_pending") for o in orders
                if isinstance(o, dict) and o.get("days_pending")]
    if all_days and all(d == 14 for d in all_days):
        warnings.append("All pending orders are exactly 14 days — lacks diversity")
        score -= 5

    # ── Artifact check
    raw = json.dumps(p)
    if "<unused" in raw or "thought\n" in raw:
        issues.append("⚠️  Model artifact detected")
        score -= 20

    score = max(0, score)

    if issues:
        status = "REJECT" if score < 40 else "WARNING"
    elif warnings:
        status = "WARNING"
    else:
        status = "PASS"

    return {
        "idx": idx, "id": pid, "status": status,
        "score": score, "issues": issues, "warnings": warnings
    }


def evaluate_patients(patients: list[dict]) -> None:
    """Evaluate all patient scenarios and print report."""
    results = [evaluate_patient(p, i) for i, p in enumerate(patients)]

    passed  = [r for r in results if r["status"] == "PASS"]
    warned  = [r for r in results if r["status"] == "WARNING"]
    failed  = [r for r in results if r["status"] == "REJECT"]
    avg_score = sum(r["score"] for r in results) / len(results) if results else 0

    print(f"\n{'='*55}")
    print(f"  PATIENT SCENARIOS EVALUATION REPORT")
    print(f"{'='*55}")
    print(f"  Total scenarios : {len(patients)}")
    print(f"  ✅ PASS         : {len(passed)}")
    print(f"  ⚠️  WARNING      : {len(warned)}")
    print(f"  ❌ REJECT       : {len(failed)}")
    print(f"  📊 Avg score    : {avg_score:.0f}/100")
    print(f"{'─'*55}")

    print(f"\n  SCENARIO SCORES:")
    for r in sorted(results, key=lambda x: x["score"], reverse=True):
        bar = "█" * (r["score"] // 10)
        icon = "✅" if r["status"] == "PASS" else ("⚠️ " if r["status"] == "WARNING" else "❌")
        print(f"  {icon} {r['id']:<8} {r['score']:>3}/100  {bar}")

    # Detailed issues
    problem_cases = [r for r in results if r["issues"] or r["warnings"]]
    if problem_cases:
        print(f"\n  DETAILED ISSUES:")
        for r in problem_cases:
            print(f"\n  📋 {r['id']} (score: {r['score']}/100)")
            for issue in r["issues"]:
                print(f"     ❌ {issue}")
            for warn in r["warnings"]:
                print(f"     ⚠️  {warn}")

    # Demo readiness check
    print(f"\n  DEMO READINESS:")
    has_pending = sum(1 for p in patients if isinstance(p, dict)
                      and any(o.get("status") == "pending"
                              for o in p.get("orders", []) if isinstance(o, dict)))
    has_flags   = sum(1 for p in patients if p.get("ai_should_flag"))
    has_failure = sum(1 for p in patients if p.get("failure_mode"))

    print(f"    Scenarios with pending orders   : {has_pending}/{len(patients)}")
    print(f"    Scenarios with AI flags         : {has_flags}/{len(patients)}")
    print(f"    Scenarios with failure mode     : {has_failure}/{len(patients)}")

    if avg_score >= 80 and len(failed) == 0:
        print(f"\n  🟢 DEMO READY — all scenarios suitable for frontend")
    elif avg_score >= 60:
        print(f"\n  🟡 MOSTLY READY — fix warnings for best demo quality")
    else:
        print(f"\n  🔴 NEEDS WORK — several scenarios need attention")

    print(f"{'='*55}\n")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="MedGemma Data Pipeline")
    parser.add_argument("--training_dir",   default="./training_data",
                        help="Directory containing training JSON files")
    parser.add_argument("--patients_file",  default="./patients.json",
                        help="Path to patient scenarios JSON file")
    parser.add_argument("--output_dir",     default="./output",
                        help="Directory for output files")
    parser.add_argument("--skip_training",  action="store_true",
                        help="Skip training data processing")
    parser.add_argument("--skip_patients",  action="store_true",
                        help="Skip patient scenario evaluation")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    # ── TRAINING EXAMPLES
    if not args.skip_training:
        print("\n" + "="*55)
        print("  STEP 1 & 2: MERGE + VALIDATE TRAINING DATA")
        print("="*55)

        training_dir = Path(args.training_dir)
        if not training_dir.exists():
            print(f"  ❌ Training directory not found: {training_dir}")
        else:
            examples = merge_training_files(args.training_dir)

            if examples:
                merged_path = os.path.join(args.output_dir, "training_merged.json")
                save_merged(examples, merged_path)

                val_results = validate_training_data(examples)

                clean_path = os.path.join(args.output_dir, "training_final_400.json")
                save_clean_training(examples, val_results, clean_path)
            else:
                print("  ❌ No training examples found")

    # ── PATIENT SCENARIOS
    if not args.skip_patients:
        print("\n" + "="*55)
        print("  STEP 3: EVALUATE PATIENT SCENARIOS")
        print("="*55)

        patients_path = Path(args.patients_file)
        if not patients_path.exists():
            print(f"  ❌ Patients file not found: {patients_path}")
        else:
            with open(patients_path, "r") as f:
                patients = json.load(f)

            if isinstance(patients, dict):
                patients = [patients]  # handle single patient file

            print(f"  📂 Loaded {len(patients)} patient scenarios")
            evaluate_patients(patients)

    print("\n✅ Pipeline complete!\n")


if __name__ == "__main__":
    main()