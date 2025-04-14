from flask import Flask, request, jsonify
from llama_cpp import Llama
from huggingface_hub import HfApi
from ai.core.automl.automl import AutoML
import pandas as pd
import os
import json

from electron.ai.core.quantization.quantize import quantize_model
# flask_app.py (or your main app)

from conversion.convert_onnx import tf_to_onnx, torch_to_onnx, onnx_to_torch
from conversion.convert_torch import tf_to_torch, onnx_to_torch
from conversion.convert_tf import torch_to_tf, onnx_to_tf
from conversion.convert_gguf import torch_to_gguf, tf_to_gguf, onnx_to_gguf

app = Flask(__name__)

MODEL_FOLDER = "models"
CONFIG_PATH = "config/settings.json"
MODEL_STATE = {"llm": None, "model_name": None}
api = HfApi()

# Initialize AutoML tracker and fine-tuning tracking
experiment_trackers = {}

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


# Start and Stop Experiment Tracker
@app.route('/start_experiment', methods=['POST'])
def start_experiment():
    """Initialize a new experiment"""
    data = request.get_json()
    
    if 'experiment_name' not in data:
        return jsonify({"error": "experiment_name is required"}), 400
    
    experiment_name = data['experiment_name']
    
    # Initialize the experiment tracker
    tracker = ExperimentTracker(experiment_name)
    
    # Store the tracker instance (you can also store this in a database for persistence)
    experiment_trackers[experiment_name] = tracker
    
    return jsonify({"message": f"Experiment '{experiment_name}' started successfully!"}), 200

@app.route('/log_metrics', methods=['POST'])
def log_metrics():
    """Log metrics to an existing experiment"""
    data = request.get_json()
    
    experiment_name = data.get('experiment_name')
    if not experiment_name or experiment_name not in experiment_trackers:
        return jsonify({"error": "Experiment not found"}), 404
    
    metrics = data.get('metrics', {})
    if not metrics:
        return jsonify({"error": "No metrics provided"}), 400
    
    tracker = experiment_trackers[experiment_name]
    
    # Log each metric
    for metric_name, value in metrics.items():
        tracker.log_metric(metric_name, value)
    
    return jsonify({"message": "Metrics logged successfully!"}), 200

@app.route('/log_parameters', methods=['POST'])
def log_parameters():
    """Log hyperparameters to an existing experiment"""
    data = request.get_json()
    
    experiment_name = data.get('experiment_name')
    if not experiment_name or experiment_name not in experiment_trackers:
        return jsonify({"error": "Experiment not found"}), 404
    
    parameters = data.get('parameters', {})
    if not parameters:
        return jsonify({"error": "No parameters provided"}), 400
    
    tracker = experiment_trackers[experiment_name]
    
    # Log parameters
    tracker.log_parameters(parameters)
    
    return jsonify({"message": "Parameters logged successfully!"}), 200

@app.route('/get_experiment_info', methods=['GET'])
def get_experiment_info():
    """Retrieve information of an experiment"""
    experiment_name = request.args.get('experiment_name')
    
    if not experiment_name or experiment_name not in experiment_trackers:
        return jsonify({"error": "Experiment not found"}), 404
    
    tracker = experiment_trackers[experiment_name]
    
    # Get experiment info
    experiment_info = tracker.get_experiment_info()
    
    return jsonify(experiment_info), 200


# Fine-Tuning APIs
@app.route('/fine_tune', methods=['POST'])
def fine_tune_model():
    """Fine-tune an existing model with custom dataset"""
    data = request.get_json()
    
    # Ensure data and model_name are provided
    if 'model_name' not in data or 'training_data' not in data:
        return jsonify({"error": "model_name and training_data are required"}), 400
    
    model_name = data['model_name']
    training_data = data['training_data']
    
    # Assume fine-tuning function is implemented (e.g., using HuggingFace or custom method)
    try:
        fine_tuned_model = fine_tune_existing_model(model_name, training_data)
        return jsonify({"message": f"Model {model_name} fine-tuned successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/fine_tune_status', methods=['GET'])
def fine_tune_status():
    """Check fine-tuning status of the model"""
    model_name = request.args.get('model_name')
    
    if not model_name:
        return jsonify({"error": "model_name is required"}), 400
    
    # Check if fine-tuning is in progress for the given model
    # For simplicity, assuming we store fine-tuning status in a dictionary
    status = check_fine_tuning_status(model_name)
    
    return jsonify({"status": status})

@app.route('/fine_tune_results', methods=['GET'])
def fine_tune_results():
    """Get results of fine-tuned model"""
    model_name = request.args.get('model_name')
    
    if not model_name:
        return jsonify({"error": "model_name is required"}), 400
    
    # Retrieve the fine-tuning results for the model
    results = get_fine_tuning_results(model_name)
    
    return jsonify({"fine_tune_results": results})

def fine_tune_existing_model(model_name, training_data):
    # Implement actual fine-tuning logic here (e.g., using HuggingFace transformers, etc.)
    # Return the fine-tuned model or a success message
    pass

def check_fine_tuning_status(model_name):
    # Implement status check logic here
    return "In Progress"  # Example status

def get_fine_tuning_results(model_name):
    # Implement results retrieval logic here
    return {"accuracy": 95, "loss": 0.03}  # Example results

@app.route("/quantize", methods=["POST"])
def quantize():
    try:
        data = request.get_json()
        model_name = data.get("model_name")
        quantization_type = data.get("quantization_type", "fp16")
        model_path = os.path.join(MODEL_FOLDER, f"{model_name}_quantized.pt")
        
        # Load the model
        model = load_model(model_name)

        # Quantize the model
        quantized_model = quantize_model(model, quantization_type, model_path)

        return jsonify({"message": f"Model quantized to {quantization_type} and saved to {model_path}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/convert_model", methods=["POST"])
def convert_model():
    try:
        data = request.get_json()
        model_name = data.get("model_name")
        from_format = data.get("from_format")
        to_format = data.get("to_format")
        model_path = os.path.join(MODEL_FOLDER, f"{model_name}.pt")

        if from_format == 'torch' and to_format == 'onnx':
            torch_to_onnx(model_name, model_path, f"{model_name}.onnx")
        elif from_format == 'onnx' and to_format == 'torch':
            onnx_to_torch(f"{model_name}.onnx")
        elif from_format == 'torch' and to_format == 'tf':
            torch_to_tf(model_name, model_path)
        elif from_format == 'tf' and to_format == 'torch':
            tf_to_torch(model_name)
        elif from_format == 'onnx' and to_format == 'tf':
            onnx_to_tf(f"{model_name}.onnx")
        elif from_format == 'tf' and to_format == 'onnx':
            tf_to_onnx(model_name, f"{model_name}.onnx")
        elif from_format == 'gguf':
            pass  # Handle GGUF-specific conversions here
        
        return jsonify({"message": "Conversion successful!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



def run_server():
    app.run(host="127.0.0.1", port=11434, debug=False, use_reloader=False)


if __name__ == "__main__":
    print("Starting LLM server at http://localhost:11434")
    run_server()
