# conversion/convert_onnx.py

import torch
import onnx
from torch import nn
import tf2onnx
import tensorflow as t
import onnx
import torch.onnx
from onnx import numpy_helper

def torch_to_onnx(model: nn.Module, model_path: str, onnx_path: str):
    """
    Convert PyTorch model to ONNX format.
    :param model: PyTorch model to convert.
    :param model_path: Path to the model weights.
    :param onnx_path: Path to save the ONNX model.
    """
    model.load_state_dict(torch.load(model_path))
    model.eval()  # Set the model to evaluation mode
    dummy_input = torch.randn(1, 3, 224, 224)  # Adjust based on your model's input
    torch.onnx.export(model, dummy_input, onnx_path, input_names=["input"], output_names=["output"])

def onnx_to_torch(onnx_path: str):
    """
    Convert ONNX model to PyTorch model.
    :param onnx_path: Path to the ONNX model.
    :return: Converted PyTorch model.
    """
    

    onnx_model = onnx.load(onnx_path)
    # Placeholder for converting ONNX to PyTorch
    # You will need to write custom logic or use libraries like ONNX Runtime to convert back.
    return onnx_model  # This is a placeholder for the actual conversion.

def tf_to_onnx(tf_model: tf.Module, onnx_path: str):
    """
    Convert TensorFlow model to ONNX.
    :param tf_model: The TensorFlow model.
    :param onnx_path: Path to save the ONNX model.
    """
    # Convert the TensorFlow model to ONNX
    onnx_model = tf2onnx.convert.from_keras(tf_model)
    onnx.save_model(onnx_model, onnx_path)
