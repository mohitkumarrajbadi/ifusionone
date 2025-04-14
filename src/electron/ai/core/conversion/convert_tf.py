# conversion/convert_tf.py

import tensorflow as tf
import torch
import tf2onnx
from torch import nn
import tf2onnx
import onnx
import tf2onnx

def torch_to_tf(model: nn.Module, model_path: str):
    """
    Convert a PyTorch model to TensorFlow format.
    :param model: PyTorch model to convert.
    :param model_path: Path to the PyTorch model weights.
    :return: TensorFlow model.
    """
    model.load_state_dict(torch.load(model_path))
    model.eval()  # Set the model to evaluation mode
    dummy_input = torch.randn(1, 3, 224, 224)  # Adjust as necessary for input
    model_onnx = torch.onnx.export(model, dummy_input, model_path + ".onnx")
    
    # Convert ONNX to TensorFlow
    
    tf_model = tf2onnx.convert.from_onnx(model_onnx)
    return tf_model

def onnx_to_tf(onnx_model_path: str):
    """
    Convert ONNX model to TensorFlow.
    :param onnx_model_path: Path to the ONNX model.
    :return: TensorFlow model.
    """

    onnx_model = onnx.load(onnx_model_path)
    tf_model = tf2onnx.convert.from_onnx(onnx_model)
    return tf_model
