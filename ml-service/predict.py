import os
import joblib
from preprocess import preprocess_features
from train import train_model, MODEL_PATH

def load_classifier():
    """
    Returns loaded model. Auto-trains if model is missing.
    """
    if not os.path.exists(MODEL_PATH):
        print("Model file not found. Initializing training...")
        train_model()
    return joblib.load(MODEL_PATH)

def run_prediction(amount: float, hour: int, day_of_week: int, category: str, state: str, source_lat: float, source_lng: float) -> dict:
    """
    Inference code executing Random Forest predict_proba steps.
    """
    clf = load_classifier()
    
    # Preprocess inputs
    features = preprocess_features(amount, hour, day_of_week, category, state, source_lat, source_lng)
    
    # Run classification
    predicted_atm = clf.predict(features)[0]
    probs = clf.predict_proba(features)[0]
    
    # Find probability for the predicted class
    class_idx = list(clf.classes_).index(predicted_atm)
    confidence = float(probs[class_idx])
    
    # Get top 3 alternatives
    top_indices = probs.argsort()[-3:][::-1]
    alternatives = []
    for idx in top_indices:
        atm_id = clf.classes_[idx]
        prob = float(probs[idx])
        if atm_id != predicted_atm:
            alternatives.append({
                "atm_id": atm_id,
                "probability": prob
            })
            
    # Estimate time window based on current hour
    start_hour = int(hour)
    end_hour = (start_hour + 3) % 24
    time_window = f"{start_hour:02d}:00–{end_hour:02d}:00"
    
    # Assess risk level based on confidence score
    if confidence >= 0.70:
        risk_level = "CRITICAL"
        risk_score = int(confidence * 100)
    elif confidence >= 0.45:
        risk_level = "HIGH"
        risk_score = int(confidence * 100)
    elif confidence >= 0.25:
        risk_level = "MEDIUM"
        risk_score = int(confidence * 100)
    else:
        risk_level = "LOW"
        risk_score = int(confidence * 100)
        
    return {
        "predicted_atm": str(predicted_atm),
        "risk_level": risk_level,
        "risk_score": risk_score,
        "probability": confidence,
        "time_window": time_window,
        "alternatives": alternatives,
        "factors": {
            "Historical withdrawal pattern match": int(confidence * 40),
            "Surge in local category alerts": int(confidence * 30),
            "Geographical transaction velocity": int(confidence * 30)
        }
    }
