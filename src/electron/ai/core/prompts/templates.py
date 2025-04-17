# prompts/templates.py

PROMPT_TEMPLATES = {
    "qa": "Question: {question}\nAnswer:",
    "summarize": "Summarize the following text:\n{text}\nSummary:",
    "translate": "Translate this sentence to {language}:\n{text}",
    "chat": "User: {user_input}\nAssistant:",
    "code_gen": "Write a {language} function that {task}:"
}

def format_prompt(template_name, **kwargs):
    if template_name not in PROMPT_TEMPLATES:
        raise ValueError(f"Unknown template: {template_name}")
    return PROMPT_TEMPLATES[template_name].format(**kwargs)
