from flask import Flask, request, jsonify
from llama_cpp import Llama
from huggingface_hub import HfApi
import os
import json

app = Flask(__name__)

MODEL_FOLDER = "models"
CONFIG_PATH = "config/settings.json"
MODEL_STATE = {"llm": None, "model_name": None}
api = HfApi()


def list_gguf_models():
    return [f for f in os.listdir(MODEL_FOLDER) if f.endswith(".gguf")]


def load_model(model_name):
    model_path = os.path.join(MODEL_FOLDER, model_name)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_name}")

    return Llama(
        model_path=model_path,
        n_ctx=2048,
        n_threads=8,
        use_mlock=True,
        verbose=True
    )


@app.route("/get-models", methods=["GET"])
def get_models():
    try:
        models = api.list_models(
            task="text-classification",
            library="gguf",
            sort="last_modified",
            full=True
        )
        model_list = [{"modelId": model.modelId, "downloads": model.downloads, "author": model.author} for model in models]
        return jsonify({"huggingface_models": model_list})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/start", methods=["POST"])
def start_model():
    try:
        data = request.get_json()
        model_name = data.get("model_name")

        if not model_name:
            return jsonify({"error": "model_name is required"}), 400

        if MODEL_STATE["llm"]:
            return jsonify({"error": "Model already running. Stop first."}), 400

        MODEL_STATE["llm"] = load_model(model_name)
        MODEL_STATE["model_name"] = model_name
        return jsonify({"message": f"{model_name} started successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/stop", methods=["POST"])
def stop_model():
    if MODEL_STATE["llm"]:
        MODEL_STATE["llm"] = None
        MODEL_STATE["model_name"] = None
        return jsonify({"message": "Model stopped."})
    return jsonify({"error": "No model is currently running."}), 400


@app.route("/status", methods=["GET"])
def status():
    if MODEL_STATE["llm"]:
        return jsonify({"running": True, "model": MODEL_STATE["model_name"]})
    return jsonify({"running": False})


@app.route("/models", methods=["GET"])
def models():
    return jsonify({"available_models": list_gguf_models()})


@app.route("/generate", methods=["POST"])
def generate():
    if not MODEL_STATE["llm"]:
        return jsonify({"error": "No model is running."}), 400

    try:
        data = request.get_json()
        prompt = data.get("prompt", "")
        max_tokens = int(data.get("max_tokens", 100))

        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        output = MODEL_STATE["llm"](prompt, max_tokens=max_tokens, stop=["</s>"])
        generated = output["choices"][0]["text"].strip()

        return jsonify({
            "prompt": prompt,
            "response": generated
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/settings", methods=["GET", "POST"])
def settings():
    if request.method == "POST":
        data = request.get_json()
        with open(CONFIG_PATH, "w") as f:
            json.dump(data, f, indent=2)
        return jsonify({"message": "Settings saved."})
    else:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r") as f:
                return jsonify(json.load(f))
        return jsonify({})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


def run_server():
    app.run(host="127.0.0.1", port=11434, debug=False, use_reloader=False)


if __name__ == "__main__":
    print("Starting LLM server at http://localhost:11434")
    run_server()
