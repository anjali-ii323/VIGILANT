from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..ml.risk_engine import recalculate_account_risk
from ..ml.predictor import predict_next_movement

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.get("", response_model=List[schemas.AccountSchema])
def list_accounts(
    search: Optional[str] = None,
    classification: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Account)
    
    if classification:
        query = query.filter(models.Account.classification == classification)
        
    if search:
        query = query.filter(
            models.Account.account_number.contains(search) |
            models.Account.holder_name.contains(search) |
            models.Account.bank_name.contains(search)
        )
        
    return query.limit(100).all()

@router.get("/{account_number}", response_model=schemas.AccountSchema)
def get_account(account_number: str, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.account_number == account_number).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account

@router.get("/{account_number}/risk")
def get_account_risk(account_number: str, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.account_number == account_number).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    updated_account = recalculate_account_risk(db, account_number)
    return {
        "account_number": updated_account.account_number,
        "holder_name": updated_account.holder_name,
        "bank_name": updated_account.bank_name,
        "risk_score": updated_account.risk_score,
        "classification": updated_account.classification,
        "risk_factors": updated_account.risk_factors,
        "is_mule": updated_account.is_mule
    }

@router.post("/{account_number}/risk/recalculate")
def recalculate_risk_endpoint(account_number: str, db: Session = Depends(get_db)):
    account = db.query(models.Account).filter(models.Account.account_number == account_number).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    updated_account = recalculate_account_risk(db, account_number)
    return {
        "status": "RECALCULATED",
        "account_number": updated_account.account_number,
        "risk_score": updated_account.risk_score,
        "classification": updated_account.classification,
        "risk_factors": updated_account.risk_factors
    }

@router.get("/{account_number}/history", response_model=List[schemas.TransactionSchema])
def get_account_history(account_number: str, db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).filter(
        (models.Transaction.sender_account == account_number) |
        (models.Transaction.receiver_account == account_number)
    ).order_by(models.Transaction.timestamp.desc()).all()
    
    return transactions

# Mapping predictions inside accounts router for route uniformity
@router.get("/{account_number}/prediction")
def get_account_prediction(account_number: str, db: Session = Depends(get_db)):
    predictions = predict_next_movement(db, account_number)
    return {
        "account_number": account_number,
        "predictions": predictions
    }

@router.post("/{account_number}/prediction")
def generate_account_prediction(account_number: str, db: Session = Depends(get_db)):
    # Recalculates prediction state and saves prediction entities
    predictions = predict_next_movement(db, account_number)
    # Save the highest prediction to the database
    if predictions:
        best_pred = predictions[0]
        # Check if already exists
        existing = db.query(models.Prediction).filter(
            models.Prediction.source_account == account_number,
            models.Prediction.target_entity == best_pred["target_entity"]
        ).first()
        if not existing:
            new_pred = models.Prediction(
                prediction_id=f"PRD-{int(datetime.utcnow().timestamp()) % 100000}",
                source_account=account_number,
                target_entity=best_pred["target_entity"],
                probability=best_pred["probability"],
                predicted_type=best_pred["target_type"],
                time_window_mins=best_pred["time_window_mins"],
                factors=best_pred["factors"]
            )
            db.add(new_pred)
            db.commit()
            
    return {
        "status": "PREDICTION_GENERATED",
        "predictions": predictions
    }
