# quantization/quantize_int8.py

import torch
from torch import nn
from torch.quantization import quantize_dynamic

def quantize_int8(model: nn.Module, model_path: str) -> nn.Module:
    """
    Quantize the model to INT8 (8-bit precision).

    :param model: The model to quantize.
    :param model_path: The path to save the quantized model.
    :return: The quantized INT8 model.
    """
    model = quantize_dynamic(model, dtype=torch.qint8)  # Convert to INT8
    torch.save(model.state_dict(), model_path)
    return model
