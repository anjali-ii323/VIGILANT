import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[schemas.AuditLogSchema])
def list_audit_logs(
    case_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(models.AuditLog)
    if case_id:
        query = query.filter(models.AuditLog.case_id == case_id)
    if action:
        query = query.filter(models.AuditLog.action == action)
    return query.order_by(models.AuditLog.timestamp.desc()).limit(limit).all()

@router.post("", response_model=schemas.AuditLogSchema)
def create_audit_log(payload: schemas.AuditLogCreate, db: Session = Depends(get_db)):
    log = models.AuditLog(
        log_id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
        officer=payload.officer or "Officer Rajesh K.",
        action=payload.action,
        case_id=payload.case_id,
        details=payload.details,
        timestamp=datetime.utcnow(),
        ip_address="10.42.0.8 (LE_VPN)"
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
