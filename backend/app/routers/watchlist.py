from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from .. import models, schemas
from ..websocket_manager import manager

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

@router.get("", response_model=List[schemas.WatchlistAccountSchema])
def list_watchlist(db: Session = Depends(get_db)):
    return db.query(models.WatchlistAccount).filter(models.WatchlistAccount.active == True).order_by(models.WatchlistAccount.added_at.desc()).all()

@router.post("", response_model=schemas.WatchlistAccountSchema)
async def add_to_watchlist(payload: schemas.WatchlistAccountCreate, db: Session = Depends(get_db)):
    existing = db.query(models.WatchlistAccount).filter(models.WatchlistAccount.account_number == payload.account_number).first()
    if existing:
        existing.active = True
        existing.reason = payload.reason
        existing.risk_level = payload.risk_level or "HIGH"
        db.commit()
        db.refresh(existing)
        return existing
        
    acc = db.query(models.Account).filter(models.Account.account_number == payload.account_number).first()
    holder_name = payload.holder_name or (acc.holder_name if acc else "Unknown Holder")
    bank_name = payload.bank_name or (acc.bank_name if acc else "Banking Node")
    
    item = models.WatchlistAccount(
        account_number=payload.account_number,
        holder_name=holder_name,
        bank_name=bank_name,
        added_by=payload.added_by or "Officer Rajesh K.",
        reason=payload.reason,
        risk_level=payload.risk_level or "HIGH",
        active=True,
        added_at=datetime.utcnow()
    )
    db.add(item)
    
    if acc:
        acc.is_watchlist = True
        
    db.commit()
    db.refresh(item)
    
    # Broadcast live event
    await manager.broadcast({
        "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
        "amount": 0.0,
        "description": f"WATCHLIST ENFORCED: Account {payload.account_number} ({holder_name}) placed under live surveillance.",
        "risk_level": "WARNING",
        "event_type": "ALERT",
        "meta": {"account_number": payload.account_number}
    })
    
    return item

@router.delete("/{account_number}")
def remove_from_watchlist(account_number: str, db: Session = Depends(get_db)):
    item = db.query(models.WatchlistAccount).filter(models.WatchlistAccount.account_number == account_number).first()
    if item:
        item.active = False
        acc = db.query(models.Account).filter(models.Account.account_number == account_number).first()
        if acc:
            acc.is_watchlist = False
        db.commit()
    return {"status": "success", "removed_account": account_number}
