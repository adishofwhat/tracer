"""
Performance Evaluation Framework
Compares base MedGemma vs fine-tuned model on hypothesis extraction task
"""

import json
from typing import Dict, List, Tuple
from dataclasses import dataclass
from datetime import datetime

@dataclass
class EvaluationMetric:
    """Single evaluation result"""
    example_id: int
    expected_hypothesis: str
    extracted_hypothesis: str
    is_correct: bool
    partial_credit: float  # 0.0 to 1.0
    notes: str

class HypothesisEvaluator:
    """Evaluate hypothesis extraction accuracy"""
    
    def __init__(self):
        self.results: List[EvaluationMetric] = []
    
    def evaluate_extraction(
        self,
        example_id: int,
        expected: str,
        extracted: str
    ) -> EvaluationMetric:
        """
        Evaluate a single hypothesis extraction
        
        Rules for scoring:
        - Exact match: 1.0
        - Synonym match (e.g., "colon cancer" vs "colorectal cancer"): 0.9
        - Correct category but different specificity (e.g., "cancer" vs "colon cancer"): 0.7
        - Related but wrong (e.g., "colon cancer" vs "lymphoma"): 0.3
        - Completely wrong: 0.0
        """
        
        expected_lower = expected.lower().strip()
        extracted_lower = extracted.lower().strip()
        
        # Exact match
        if expected_lower == extracted_lower:
            return EvaluationMetric(
                example_id=example_id,
                expected_hypothesis=expected,
                extracted_hypothesis=extracted,
                is_correct=True,
                partial_credit=1.0,
                notes="Exact match"
            )
        
        # Synonym matching (medical terminology)
        synonyms = {
            "colon cancer": ["colorectal cancer", "colonic malignancy", "bowel cancer"],
            "pneumonia": ["lung infection", "pulmonary infection", "cap"],
            "myocardial infarction": ["heart attack", "mi", "acute mi"],
            "pulmonary embolism": ["pe", "lung clot"],
            "sepsis": ["severe infection", "septic shock"]
        }
        
        for canonical, variations in synonyms.items():
            if expected_lower == canonical or expected_lower in variations:
                if extracted_lower == canonical or extracted_lower in variations:
                    return EvaluationMetric(
                        example_id=example_id,
                        expected_hypothesis=expected,
                        extracted_hypothesis=extracted,
                        is_correct=True,
                        partial_credit=0.9,
                        notes="Synonym match"
                    )
        
        # Category match (e.g., both are cancers)
        cancer_keywords = ["cancer", "malignancy", "tumor", "carcinoma", "lymphoma", "leukemia"]
        infection_keywords = ["infection", "sepsis", "pneumonia", "meningitis"]
        cardiac_keywords = ["infarction", "heart attack", "mi", "ischemia"]
        
        def get_category(text):
            if any(kw in text for kw in cancer_keywords):
                return "cancer"
            if any(kw in text for kw in infection_keywords):
                return "infection"
            if any(kw in text for kw in cardiac_keywords):
                return "cardiac"
            return "other"
        
        expected_cat = get_category(expected_lower)
        extracted_cat = get_category(extracted_lower)
        
        if expected_cat == extracted_cat and expected_cat != "other":
            return EvaluationMetric(
                example_id=example_id,
                expected_hypothesis=expected,
                extracted_hypothesis=extracted,
                is_correct=False,
                partial_credit=0.7,
                notes=f"Same category ({expected_cat}) but different specificity"
            )
        
        # Partial match (some overlap in words)
        expected_words = set(expected_lower.split())
        extracted_words = set(extracted_lower.split())
        overlap = expected_words & extracted_words
        
        if len(overlap) > 0:
            jaccard = len(overlap) / len(expected_words | extracted_words)
            return EvaluationMetric(
                example_id=example_id,
                expected_hypothesis=expected,
                extracted_hypothesis=extracted,
                is_correct=False,
                partial_credit=min(jaccard, 0.5),
                notes=f"Partial overlap ({len(overlap)} words)"
            )
        
        # No match
        return EvaluationMetric(
            example_id=example_id,
            expected_hypothesis=expected,
            extracted_hypothesis=extracted,
            is_correct=False,
            partial_credit=0.0,
            notes="No match"
        )
    
    def add_result(self, metric: EvaluationMetric):
        """Add evaluation result"""
        self.results.append(metric)
    
    def compute_metrics(self) -> Dict:
        """Compute aggregate metrics"""
        if not self.results:
            return {}
        
        total = len(self.results)
        correct = sum(1 for r in self.results if r.is_correct)
        partial_correct = sum(1 for r in self.results if r.partial_credit >= 0.7)
        avg_score = sum(r.partial_credit for r in self.results) / total
        
        return {
            "total_examples": total,
            "exact_correct": correct,
            "exact_accuracy": correct / total,
            "partial_correct": partial_correct,
            "partial_accuracy": partial_correct / total,
            "average_score": avg_score
        }
    
    def generate_report(self, model_name: str) -> Dict:
        """Generate full evaluation report"""
        metrics = self.compute_metrics()
        
        report = {
            "model": model_name,
            "evaluation_date": datetime.now().isoformat(),
            "metrics": metrics,
            "detailed_results": [
                {
                    "example_id": r.example_id,
                    "expected": r.expected_hypothesis,
                    "extracted": r.extracted_hypothesis,
                    "correct": r.is_correct,
                    "score": r.partial_credit,
                    "notes": r.notes
                }
                for r in self.results
            ]
        }
        
        return report
    
    def save_report(self, filepath: str, model_name: str):
        """Save evaluation report to JSON"""
        report = self.generate_report(model_name)
        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2)


def compare_models(base_results_path: str, finetuned_results_path: str) -> Dict:
    """Compare base vs fine-tuned model performance"""
    
    with open(base_results_path) as f:
        base_results = json.load(f)
    
    with open(finetuned_results_path) as f:
        ft_results = json.load(f)
    
    comparison = {
        "base_model": {
            "name": base_results["model"],
            "accuracy": base_results["metrics"]["exact_accuracy"],
            "avg_score": base_results["metrics"]["average_score"]
        },
        "fine_tuned_model": {
            "name": ft_results["model"],
            "accuracy": ft_results["metrics"]["exact_accuracy"],
            "avg_score": ft_results["metrics"]["average_score"]
        },
        "improvement": {
            "accuracy_delta": ft_results["metrics"]["exact_accuracy"] - base_results["metrics"]["exact_accuracy"],
            "score_delta": ft_results["metrics"]["average_score"] - base_results["metrics"]["average_score"],
            "accuracy_improvement_pct": ((ft_results["metrics"]["exact_accuracy"] - base_results["metrics"]["exact_accuracy"]) / base_results["metrics"]["exact_accuracy"] * 100) if base_results["metrics"]["exact_accuracy"] > 0 else 0
        }
    }
    
    return comparison


# Example usage
if __name__ == "__main__":
    # This will be used after we test both models
    evaluator = HypothesisEvaluator()
    
    # Test the evaluation logic
    test_cases = [
        (1, "colon cancer", "colorectal cancer", "Should be synonym match"),
        (2, "colon cancer", "cancer", "Should be category match"),
        (3, "pneumonia", "lung infection", "Should be synonym match"),
        (4, "pneumonia", "heart failure", "Should be no match"),
    ]
    
    for example_id, expected, extracted, expected_result in test_cases:
        result = evaluator.evaluate_extraction(example_id, expected, extracted)
        evaluator.add_result(result)
        print(f"Test {example_id}: {expected_result}")
        print(f"  Score: {result.partial_credit}, Notes: {result.notes}\n")
    
    print("Overall Metrics:")
    print(json.dumps(evaluator.compute_metrics(), indent=2))