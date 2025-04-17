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
experiment_trackers = {}

# Simple ExperimentTracker class
class ExperimentTracker:
    def __init__(self, experiment_name):
        self.name = experiment_name
        self.metrics = {}
        self.parameters = {}

    def log_metric(self, name, value):
        self.metrics[name] = value

    def log_parameters(self, params):
        self.parameters.update(params)

    def get_experiment_info(self):
        return {
            "experiment_name": self.name,
            "metrics": self.metrics,
            "parameters": self.parameters
        }


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


@app.route('/start_experiment', methods=['POST'])
def start_experiment():
    data = request.get_json()
    if 'experiment_name' not in data:
        return jsonify({"error": "experiment_name is required"}), 400

    experiment_name = data['experiment_name']
    tracker = ExperimentTracker(experiment_name)
    experiment_trackers[experiment_name] = tracker
    return jsonify({"message": f"Experiment '{experiment_name}' started successfully!"}), 200


@app.route('/log_metrics', methods=['POST'])
def log_metrics():
    data = request.get_json()
    experiment_name = data.get('experiment_name')
    if not experiment_name or experiment_name not in experiment_trackers:
        return jsonify({"error": "Experiment not found"}), 404

    metrics = data.get('metrics', {})
    if not metrics:
        return jsonify({"error": "No metrics provided"}), 400

    tracker = experiment_trackers[experiment_name]
    for metric_name, value in metrics.items():
        tracker.log_metric(metric_name, value)

    return jsonify({"message": "Metrics logged successfully!"}), 200


@app.route('/log_parameters', methods=['POST'])
def log_parameters():
    data = request.get_json()
    experiment_name = data.get('experiment_name')
    if not experiment_name or experiment_name not in experiment_trackers:
        return jsonify({"error": "Experiment not found"}), 404

    parameters = data.get('parameters', {})
    if not parameters:
        return jsonify({"error": "No parameters provided"}), 400

    tracker = experiment_trackers[experiment_name]
    tracker.log_parameters(parameters)

    return jsonify({"message": "Parameters logged successfully!"}), 200


@app.route('/get_experiment_info', methods=['GET'])
def get_experiment_info():
    experiment_name = request.args.get('experiment_name')
    if not experiment_name or experiment_name not in experiment_trackers:
        return jsonify({"error": "Experiment not found"}), 404

    tracker = experiment_trackers[experiment_name]
    return jsonify(tracker.get_experiment_info()), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
