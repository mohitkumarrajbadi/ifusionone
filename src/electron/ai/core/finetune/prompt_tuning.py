from transformers import AutoModelForSequenceClassification, AutoTokenizer, Trainer, TrainingArguments
from datasets import load_dataset
import torch

class PromptTuning:
    def __init__(self, model_name='bert-base-uncased', task='mrpc', prompt_length=5):
        """
        Initialize Prompt Tuning for BERT-like models.

        :param model_name: str - The transformer model to fine-tune.
        :param task: str - The task to fine-tune for (e.g., 'mrpc' for sentence classification).
        :param prompt_length: int - The length of the prompt tokens to train.
        """
        self.model_name = model_name
        self.task = task
        self.prompt_length = prompt_length
        self.model = None
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)

    def load_data(self):
        """
        Load dataset for fine-tuning.
        :return: Dataset - The loaded dataset.
        """
        dataset = load_dataset('glue', self.task)
        return dataset

    def apply_prompt_tuning(self):
        """
        Add prompt tokens to the model.
        :return: model - The model with prompt tokens applied.
        """
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name, num_labels=2)
        # Initialize trainable prompt tokens
        self.prompt_tokens = torch.nn.Parameter(torch.randn(self.prompt_length, self.model.config.hidden_size))
        return self.model

    def forward_with_prompt(self, inputs):
        """
        Modify forward pass to include prompt tokens.
        :param inputs: dict - The input dictionary for the model.
        :return: outputs - Model outputs with prompt tokens.
        """
        prompt = self.prompt_tokens.unsqueeze(0).expand(inputs['input_ids'].shape[0], -1, -1)
        input_ids = torch.cat([prompt, inputs['input_ids']], dim=1)
        attention_mask = torch.cat([torch.ones(input_ids.shape[0], self.prompt_length), inputs['attention_mask']], dim=1)
        return self.model(input_ids=input_ids, attention_mask=attention_mask)

    def fine_tune(self, dataset):
        """
        Fine-tune the model with prompt tokens.
        :param dataset: Dataset - The dataset to fine-tune on.
        :return: Trainer - The fine-tuning trainer.
        """
        tokenized_data = dataset.map(lambda e: self.tokenizer(e['sentence'], padding=True, truncation=True), batched=True)
        tokenized_data.set_format(type="torch", columns=["input_ids", "attention_mask", "label"])

        training_args = TrainingArguments(
            output_dir='./results',          # output directory
            evaluation_strategy="epoch",     # evaluation is done after each epoch
            learning_rate=2e-5,              # learning rate
            per_device_train_batch_size=16,  # batch size for training
            per_device_eval_batch_size=64,   # batch size for evaluation
            num_train_epochs=3,              # number of training epochs
            weight_decay=0.01,               # strength of weight decay
            logging_dir='./logs',            # directory for storing logs
        )

        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=tokenized_data["train"],
            eval_dataset=tokenized_data["validation"],
        )
        trainer.train()
        return trainer
