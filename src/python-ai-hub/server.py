from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# Health Check
@app.get("/")
def read_root():
    return {"message": "AI Backend is running"}

