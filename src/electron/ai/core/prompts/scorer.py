# prompts/scorer.py

from nltk.translate.bleu_score import sentence_bleu
from rouge import Rouge
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')
rouge = Rouge()

def score_bleu(reference, candidate):
    return sentence_bleu([reference.split()], candidate.split())

def score_rouge(reference, candidate):
    return rouge.get_scores(candidate, reference)[0]

def score_embedding(reference, candidate):
    emb1 = model.encode(reference, convert_to_tensor=True)
    emb2 = model.encode(candidate, convert_to_tensor=True)
    return float(util.pytorch_cos_sim(emb1, emb2)[0][0])
