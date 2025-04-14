# ai/core/automl/automl.py

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler
import optuna
import joblib
import os

class AutoML:
    def __init__(self, model_type='random_forest', tuning=False, ensemble=False, cross_val=False, model_filename="model.pkl"):
        """
        Initialize AutoML class with options for model type, tuning, ensembling, cross-validation, and persistence.

        :param model_type: str - Model type to use ('random_forest', 'xgboost', 'logistic_regression').
        :param tuning: bool - Whether to use hyperparameter tuning (Optuna).
        :param ensemble: bool - Whether to use ensembling (Voting Classifier).
        :param cross_val: bool - Whether to use cross-validation.
        :param model_filename: str - Path for saving/loading the trained model.
        """
        self.model_type = model_type
        self.tuning = tuning
        self.ensemble = ensemble
        self.cross_val = cross_val
        self.model_filename = model_filename
        self.model = None

    def preprocess_data(self, data: pd.DataFrame, target_column: str):
        """
        Preprocess the data: handle missing values, scale numeric features, encode categorical features.

        :param data: pd.DataFrame - Input data.
        :param target_column: str - The column name for the target variable.
        :return: np.array, np.array - Processed feature matrix X and target vector y.
        """
        X = data.drop(columns=[target_column])
        y = data[target_column]
        X.fillna(X.mean(), inplace=True)  # Handle missing values by replacing with mean
        scaler = StandardScaler()
        X = scaler.fit_transform(X)  # Normalize/standardize features
        return X, y

    def choose_model(self):
        """
        Choose the base model or ensembling model based on the input parameters.

        :return: None - Sets self.model to the chosen model.
        """
        if self.model_type == 'random_forest':
            base_model = RandomForestClassifier()
        elif self.model_type == 'xgboost':
            base_model = XGBClassifier(use_label_encoder=False, eval_metric='mlogloss')
        elif self.model_type == 'logistic_regression':
            base_model = LogisticRegression()
        else:
            raise ValueError("Model type not supported")
        
        # If ensembling is enabled, use a VotingClassifier
        if self.ensemble:
            model_1 = RandomForestClassifier(n_estimators=100)
            model_2 = XGBClassifier(use_label_encoder=False, eval_metric='mlogloss')
            model_3 = LogisticRegression()
            self.model = VotingClassifier(estimators=[
                ('rf', model_1), 
                ('xgb', model_2),
                ('lr', model_3)
            ], voting='soft')
        else:
            self.model = base_model

    def tune_hyperparameters(self, X, y):
        """
        Perform hyperparameter tuning using Optuna for the RandomForest model.

        :param X: np.array - Features.
        :param y: np.array - Target.
        :return: dict - Best hyperparameters found by Optuna.
        """
        def objective(trial):
            n_estimators = trial.suggest_int('n_estimators', 50, 200)
            max_depth = trial.suggest_int('max_depth', 3, 15)
            min_samples_split = trial.suggest_int('min_samples_split', 2, 10)
            model = RandomForestClassifier(
                n_estimators=n_estimators,
                max_depth=max_depth,
                min_samples_split=min_samples_split
            )
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            return accuracy
        
        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=100)
        return study.best_params

    def train_model(self, X, y):
        """
        Train the model with or without hyperparameter tuning.

        :param X: np.array - Features.
        :param y: np.array - Target.
        :return: None - Trains self.model.
        """
        if self.tuning:
            best_params = self.tune_hyperparameters(X, y)
            self.model.set_params(**best_params)
        
        self.model.fit(X, y)

    def evaluate_model(self, X, y):
        """
        Evaluate the model using either cross-validation or regular accuracy evaluation.

        :param X: np.array - Features.
        :param y: np.array - Target.
        :return: float - Model accuracy or average cross-validation score.
        """
        if self.cross_val:
            cv_scores = cross_val_score(self.model, X, y, cv=5)  # 5-fold cross-validation
            return np.mean(cv_scores)
        else:
            y_pred = self.model.predict(X)
            accuracy = accuracy_score(y, y_pred)
            return accuracy

    def save_model(self):
        """Save the trained model to a file."""
        with open(self.model_filename, 'wb') as model_file:
            joblib.dump(self.model, model_file)

    def load_model(self):
        """Load a saved model from a file."""
        if os.path.exists(self.model_filename):
            with open(self.model_filename, 'rb') as model_file:
                self.model = joblib.load(model_file)
        else:
            raise FileNotFoundError(f"{self.model_filename} does not exist!")

    def fit(self, data: pd.DataFrame, target_column: str):
        """
        Full workflow: Preprocess, choose model, train model, evaluate, and save the model.

        :param data: pd.DataFrame - The input dataset.
        :param target_column: str - The column name for the target variable.
        :return: float - Model accuracy after training.
        """
        X, y = self.preprocess_data(data, target_column)
        self.choose_model()
        self.train_model(X, y)
        self.save_model()  # Save model after training
        accuracy = self.evaluate_model(X, y)
        return accuracy
