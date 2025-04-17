# prompts/evaluator.py

from prompts.scorer import score_bleu, score_rouge, score_embedding
from prompts.templates import format_prompt
import json

def evaluate_model_response(model_func, eval_set, template_name):
    results = []
    for item in eval_set:
        prompt = format_prompt(template_name, **item)
        generated = model_func(prompt)
        reference = item.get("expected", "")

        scores = {
            "bleu": score_bleu(reference, generated),
            "rouge": score_rouge(reference, generated),
            "embedding_sim": score_embedding(reference, generated),
        }
        results.append({
            "input": item,
            "generated": generated,
            "scores": scores
        })
    return results
