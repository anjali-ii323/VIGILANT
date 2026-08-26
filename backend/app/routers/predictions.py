from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from ..database import get_db
from .. import models
from ..ml.predictor import predict_next_movement

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.get("/next-movement/{account_number}")
def get_next_movement(account_number: str, db: Session = Depends(get_db)):
    # Returns predicted next accounts/ATMs with probabilities and explainability details
    predictions = predict_next_movement(db, account_number)
    return {
        "account_number": account_number,
        "predictions": predictions
    }

@router.get("/cash-out/zones")
def get_cashout_zones(case_id: Optional[str] = None, db: Session = Depends(get_db)):
    # Return ATM data paired with calculated risk factors for mapping
    atms = db.query(models.ATM).all()
    zones = []
    for atm in atms:
        # Check if there are active predictions targeting this ATM for this case
        pred_query = db.query(models.Prediction).filter(
            models.Prediction.target_entity == atm.atm_id,
            models.Prediction.predicted_type == "CASH_OUT"
        )
        if case_id:
            pred_query = pred_query.filter(models.Prediction.case_id == case_id)
            
        predictions = pred_query.all()
        
        # Calculate a dynamic risk based on predictions or baseline velocity
        base_probability = 0.05
        factors = {
            "Withdrawal velocity score": int(atm.withdrawal_velocity / 100000)
        }
        
        if predictions:
            # Get the highest probability prediction
            best_pred = max(predictions, key=lambda x: x.probability)
            base_probability = best_pred.probability
            factors.update(best_pred.factors)
            
        risk_percentage = int(base_probability * 100)
        
        # Adjust risk level mapping
        if risk_percentage >= 80:
            level = "CRITICAL"
            color = "red"
        elif risk_percentage >= 60:
            level = "HIGH"
            color = "orange"
        elif risk_percentage >= 35:
            level = "MODERATE"
            color = "yellow"
        else:
            level = "LOW"
            color = "green"
            
        zones.append({
            "id": atm.atm_id,
            "location_name": atm.location_name,
            "city": atm.city,
            "latitude": atm.latitude,
            "longitude": atm.longitude,
            "risk_score": risk_percentage,
            "risk_level": level,
            "risk_color": color,
            "predicted_window_mins": 30 if case_id == "CF-2026-00421" else 45 if case_id == "CF-2026-00422" else 20,
            "factors": factors
        })
        
    return zones
