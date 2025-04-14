# quantization/quantize.py

import torch
from torch import nn
from .quantize_fp16 import quantize_fp16
from .quantize_int8 import quantize_int8
from .quantize_bf16 import quantize_bf16
from .quantize_gguf import quantize_gguf

def quantize_model(model: nn.Module, quantization_type: str, model_path: str) -> nn.Module:
    """
    General function to quantize a given model based on the quantization type.

    :param model: The model to quantize.
    :param quantization_type: The type of quantization ('fp16', 'int8', 'bf16', 'gguf').
    :param model_path: The path where the quantized model should be saved.
    :return: The quantized model.
    """
    if quantization_type == 'fp16':
        return quantize_fp16(model, model_path)
    elif quantization_type == 'int8':
        return quantize_int8(model, model_path)
    elif quantization_type == 'bf16':
        return quantize_bf16(model, model_path)
    elif quantization_type == 'gguf':
        return quantize_gguf(model, model_path)
    else:
        raise ValueError(f"Unsupported quantization type: {quantization_type}")
