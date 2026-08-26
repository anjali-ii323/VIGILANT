from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..ml.risk_engine import recalculate_account_risk
from ..websocket_manager import manager
from datetime import datetime

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[schemas.TransactionSchema])
def list_transactions(
    sender: Optional[str] = None,
    receiver: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.Transaction)
    
    if sender:
        query = query.filter(models.Transaction.sender_account == sender)
    if receiver:
        query = query.filter(models.Transaction.receiver_account == receiver)
        
    return query.order_by(models.Transaction.timestamp.desc()).limit(limit).all()

@router.get("/{transaction_id}", response_model=schemas.TransactionSchema)
def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.transaction_id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

@router.post("", response_model=schemas.TransactionSchema)
def create_transaction(payload: schemas.TransactionBase, db: Session = Depends(get_db)):
    # 1. Create database transaction record
    new_tx = models.Transaction(
        transaction_id=payload.transaction_id,
        sender_account=payload.sender_account,
        receiver_account=payload.receiver_account,
        amount=payload.amount,
        transaction_type=payload.transaction_type,
        risk_score=payload.risk_score,
        is_simulated=payload.is_simulated,
        linked_case_id=payload.linked_case_id,
        timestamp=datetime.utcnow()
    )
    db.add(new_tx)
    
    # 2. Recalculate risks dynamically for sender and receiver accounts
    sender_risk = 0.0
    receiver_risk = 0.0
    
    sender_acc = recalculate_account_risk(db, payload.sender_account)
    if sender_acc:
        sender_risk = sender_acc.risk_score
        
    receiver_acc = recalculate_account_risk(db, payload.receiver_account)
    if receiver_acc:
        receiver_risk = receiver_acc.risk_score
        
    # Check if case risk score should be escalated
    if payload.linked_case_id:
        case = db.query(models.Case).filter(models.Case.case_id == payload.linked_case_id).first()
        if case:
            case.risk_score = max(case.risk_score, sender_risk, receiver_risk)
            case.last_activity = f"Transaction {payload.transaction_id} processed"
            
    db.commit()
    db.refresh(new_tx)
    
    # 3. Broadcast updates via WebSockets
    import asyncio
    async def notify():
        await manager.broadcast({
            "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
            "amount": payload.amount,
            "description": f"New Transaction: {payload.sender_account} -> {payload.receiver_account}",
            "risk_level": "HIGH RISK" if payload.risk_score >= 70 else "WARNING" if payload.risk_score >= 40 else "INFO",
            "event_type": "TRANSACTION",
            "meta": {"tx_id": payload.transaction_id, "case_id": payload.linked_case_id}
        })
    
    try:
        # FastAPI supports background tasks or async triggers.
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(notify())
    except Exception:
        pass
        
    return new_tx
