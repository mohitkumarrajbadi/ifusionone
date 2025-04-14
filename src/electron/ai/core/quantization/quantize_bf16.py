# quantization/quantize_bf16.py

import torch
from torch import nn

def quantize_bf16(model: nn.Module, model_path: str) -> nn.Module:
    """
    Quantize the model to BF16 (Brain Floating Point 16).

    :param model: The model to quantize.
    :param model_path: The path to save the quantized model.
    :return: The quantized BF16 model.
    """
    model = model.to(torch.bfloat16)  # Convert model to BF16
    torch.save(model.state_dict(), model_path)
    return model
