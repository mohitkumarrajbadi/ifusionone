from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix
import joblib
import seaborn as sns
import matplotlib.pyplot as plt
import uuid
import os

app = FastAPI()

# ========== MODELS ==========

class FilePathModel(BaseModel):
    file_path: str

class ModelRequest(BaseModel):
    file_name: str
    target_column: str
    test_size: float = 0.2
    model_type: str = "logistic_regression"

class TuneRequest(ModelRequest):
    param_grid: dict

# ========== GLOBAL STATE ==========

test_data_cache = {}

# ========== UTILS ==========

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_file(file: UploadFile, filename: str):
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as buffer:
        buffer.write(file.file.read())

def generate_eda(df):
    return {
        "shape": df.shape,
        "columns": df.columns.tolist(),
        "missing": df.isnull().sum().to_dict(),
        "describe": df.describe(include="all").to_dict(),
        "head": df.head().to_dict(),
    }

# ========== ROUTES ==========

@app.post("/upload-data/")
async def upload_data(file: UploadFile = File(...)):
    try:
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        save_file(file, filename)
        file_path = os.path.join(UPLOAD_DIR, filename)
        df = pd.read_csv(file_path)
        return {"filename": filename, "eda": generate_eda(df)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import numpy as np

@app.post("/load-data/")
async def load_data(req: FilePathModel):
    try:
        full_path = os.path.join(UPLOAD_DIR, req.file_path)
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="File not found.")

        try:
            df = pd.read_csv(full_path)
        except UnicodeDecodeError:
            df = pd.read_csv(full_path, encoding="ISO-8859-1")

        eda_result = generate_eda(df)

        # Replace NaN, inf, -inf with None (valid JSON null)
        def clean_for_json(obj):
            if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
                return None
            elif isinstance(obj, dict):
                return {k: clean_for_json(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_for_json(item) for item in obj]
            return obj

        clean_eda = clean_for_json(eda_result)

        return {"file_path": req.file_path, "eda": clean_eda}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/train-model/")
async def train_model(model_req: ModelRequest):
    try:
        df = pd.read_csv(os.path.join(UPLOAD_DIR, model_req.file_name))
        if model_req.target_column not in df.columns:
            raise HTTPException(status_code=400, detail="Target column not found in the dataset.")
        
        X = df.drop(columns=[model_req.target_column])
        y = df[model_req.target_column]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=model_req.test_size, random_state=42)

        if model_req.model_type == "logistic_regression":
            model = LogisticRegression(max_iter=200)
        else:
            raise HTTPException(status_code=400, detail="Unsupported model type.")
        
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        conf_matrix = confusion_matrix(y_test, y_pred).tolist()

        # Save model
        model_filename = f"{uuid.uuid4().hex}_model.pkl"
        joblib.dump(model, os.path.join(UPLOAD_DIR, model_filename))

        # Cache test data for visualization
        test_data_cache[model_filename] = (X_test, y_test)

        return {
            "accuracy": accuracy,
            "confusion_matrix": conf_matrix,
            "model_filename": model_filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/visualize/")
async def visualize(model_filename: str):
    try:
        model = joblib.load(os.path.join(UPLOAD_DIR, model_filename))
        if model_filename not in test_data_cache:
            raise HTTPException(status_code=400, detail="No test data found for this model.")
        X_test, y_test = test_data_cache[model_filename]
        cm = confusion_matrix(y_test, model.predict(X_test))

        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
        plt.title("Confusion Matrix")
        plt.xlabel("Predicted")
        plt.ylabel("Actual")
        plot_filename = f"{uuid.uuid4().hex}_confusion_matrix.png"
        plt.savefig(os.path.join(UPLOAD_DIR, plot_filename))
        plt.close()
        return {"plot_filename": plot_filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/hyperparameter-tune/")
async def hyperparameter_tune(req: TuneRequest):
    try:
        df = pd.read_csv(os.path.join(UPLOAD_DIR, req.file_name))
        X = df.drop(columns=[req.target_column])
        y = df[req.target_column]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=req.test_size, random_state=42)

        if req.model_type == "logistic_regression":
            model = LogisticRegression(max_iter=200)
        else:
            raise HTTPException(status_code=400, detail="Unsupported model type.")

        grid_search = GridSearchCV(model, req.param_grid, cv=5, scoring="accuracy")
        grid_search.fit(X_train, y_train)

        return {
            "best_params": grid_search.best_params_,
            "best_score": grid_search.best_score_
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("dataset:app", host="0.0.0.0", port=8000, reload=True)
