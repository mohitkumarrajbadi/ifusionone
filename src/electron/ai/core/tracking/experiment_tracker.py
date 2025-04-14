import os
import json
import subprocess
from datetime import datetime

class ExperimentTracker:
    def __init__(self, experiment_name, experiment_dir="ai/core/tracking/experiments"):
        self.experiment_name = experiment_name
        self.experiment_dir = experiment_dir
        self.experiment_path = os.path.join(experiment_dir, self.experiment_name)
        self.metrics = {}
        self.parameters = {}
        self._initialize_experiment()

    def _initialize_experiment(self):
        """Initialize experiment folder and log details."""
        if not os.path.exists(self.experiment_path):
            os.makedirs(self.experiment_path)

        # Initialize experiment metadata
        self.metadata = {
            "experiment_name": self.experiment_name,
            "date": str(datetime.now()),
            "git_commit": self._get_git_commit(),
            "metrics": self.metrics,
            "parameters": self.parameters
        }

        # Save metadata
        self._save_metadata()

    def _get_git_commit(self):
        """Get current git commit hash for versioning."""
        try:
            git_commit = subprocess.check_output(["git", "rev-parse", "HEAD"]).strip().decode('utf-8')
        except Exception as e:
            git_commit = "N/A"
        return git_commit

    def _save_metadata(self):
        """Save experiment metadata as a JSON file."""
        metadata_file = os.path.join(self.experiment_path, "experiment_metadata.json")
        with open(metadata_file, "w") as f:
            json.dump(self.metadata, f, indent=4)

    def log_metric(self, metric_name, value):
        """Log a metric during the experiment."""
        self.metrics[metric_name] = value
        self.metadata["metrics"] = self.metrics
        self._save_metadata()

    def log_parameters(self, params):
        """Log hyperparameters for the experiment."""
        self.parameters.update(params)
        self.metadata["parameters"] = self.parameters
        self._save_metadata()

    def get_experiment_info(self):
        """Return the experiment metadata."""
        return self.metadata
