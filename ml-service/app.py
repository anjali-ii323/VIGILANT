import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import joblib
from predict import run_prediction
from train import train_model, MODEL_DIR

app = FastAPI(
    title="CYBERINTEL ML Inference API",
    description="Random Forest cash-out prediction engine",
    version="1.0.0"
)

class PredictRequest(BaseModel):
    amount: float
    hour: int
    day_of_week: int
    category: str
    state: str
    source_lat: float
    source_lng: float

class TrainRequest(BaseModel):
    csv_path: Optional[str] = None

@app.get("/health")
def health_check():
    return {"status": "HEALTHY", "model_trained": os.path.exists(os.path.join(MODEL_DIR, "random_forest.joblib"))}

@app.post("/predict")
def predict_endpoint(payload: PredictRequest):
    try:
        result = run_prediction(
            amount=payload.amount,
            hour=payload.hour,
            day_of_week=payload.day_of_week,
            category=payload.category,
            state=payload.state,
            source_lat=payload.source_lat,
            source_lng=payload.source_lng
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/train")
def train_endpoint(payload: TrainRequest):
    try:
        metrics = train_model(payload.csv_path)
        return {"status": "SUCCESS", "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.get("/metrics")
def get_metrics():
    metrics_path = os.path.join(MODEL_DIR, "metrics.joblib")
    if not os.path.exists(metrics_path):
        # Auto-train to populate metrics if missing
        print("Metrics file not found. Auto-training model...")
        try:
            train_model()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Metrics training failed: {str(e)}")
            
    if os.path.exists(metrics_path):
        return joblib.load(metrics_path)
    else:
        raise HTTPException(status_code=404, detail="Performance metrics unavailable.")
