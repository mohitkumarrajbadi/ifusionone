# ai/core/finetune/bert_finetune.py

from transformers import BertForSequenceClassification, BertTokenizer, Trainer, TrainingArguments
from datasets import load_dataset

class BERTFineTuner:
    def __init__(self, model_name='bert-base-uncased', task='mrpc'):
        """
        Initialize BERT Fine-Tuner for sequence classification.

        :param model_name: str - The BERT model to fine-tune.
        :param task: str - The task to fine-tune for (e.g., 'mrpc' for sentence classification).
        """
        self.model_name = model_name
        self.task = task
        self.model = None
        self.tokenizer = BertTokenizer.from_pretrained(self.model_name)

    def load_data(self):
        """
        Load dataset for fine-tuning.
        :return: Dataset - The loaded dataset.
        """
        dataset = load_dataset('glue', self.task)
        return dataset

    def apply_bert(self):
        """
        Apply BERT model for sequence classification.
        :return: model - The BERT model.
        """
        self.model = BertForSequenceClassification.from_pretrained(self.model_name, num_labels=2)
        return self.model

    def fine_tune(self, dataset):
        """
        Fine-tune the BERT model with the dataset.
        :param dataset: Dataset - The dataset to fine-tune on.
        :return: Trainer - The fine-tuning trainer.
        """
        tokenized_data = dataset.map(lambda e: self.tokenizer(e['sentence'], padding=True, truncation=True), batched=True)
        tokenized_data.set_format(type="torch", columns=["input_ids", "attention_mask", "label"])

        training_args = TrainingArguments(
            output_dir='./results',          # output directory
            evaluation_strategy="epoch",     # evaluation is done after each epoch
            learning_rate=2e-5,              # learning rate
            per_device_train_batch_size=16, 
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