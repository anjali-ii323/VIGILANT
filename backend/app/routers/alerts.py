from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from datetime import datetime

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[schemas.AlertSchema])
def get_alerts(
    case_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = "ACTIVE",
    db: Session = Depends(get_db)
):
    query = db.query(models.Alert)
    
    if case_id:
        query = query.filter(models.Alert.case_id == case_id)
        
    if severity:
        query = query.filter(models.Alert.severity == severity)
        
    if status:
        query = query.filter(models.Alert.status == status)
        
    return query.order_by(models.Alert.timestamp.desc()).all()

@router.post("", response_model=schemas.AlertSchema)
def create_alert(payload: schemas.AlertBase, db: Session = Depends(get_db)):
    new_alert = models.Alert(
        alert_id=payload.alert_id,
        case_id=payload.case_id,
        severity=payload.severity,
        title=payload.title,
        description=payload.description,
        account_number=payload.account_number,
        amount_at_risk=payload.amount_at_risk,
        status=payload.status,
        timestamp=datetime.utcnow()
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert

@router.patch("/{alert_id}", response_model=schemas.AlertSchema)
def update_alert(alert_id: str, payload: dict, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    for key, value in payload.items():
        if hasattr(alert, key):
            setattr(alert, key, value)
            
    db.commit()
    db.refresh(alert)
    return alert

@router.post("/{alert_id}/resolve", response_model=schemas.AlertSchema)
def resolve_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = "RESOLVED"
    db.commit()
    db.refresh(alert)
    return alert
