import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from .. import models, schemas
from ..blockchain import create_block, verify_chain

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs & Blockchain Ledger"])

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
    return query.order_by(models.AuditLog.block_index.desc()).limit(limit).all()

@router.post("", response_model=schemas.AuditLogSchema)
def create_audit_log(payload: schemas.AuditLogCreate, db: Session = Depends(get_db)):
    # Get last block to chain previous hash
    last_block = db.query(models.AuditLog).order_by(models.AuditLog.block_index.desc()).first()
    
    if last_block:
        next_idx = last_block.block_index + 1
        prev_hash = last_block.block_hash or ("0" * 64)
    else:
        next_idx = 0
        prev_hash = "0" * 64

    timestamp_str = datetime.utcnow().isoformat()
    officer_name = payload.officer or "Officer Rajesh K."
    
    # Generate cryptographic block payload
    block_data = create_block(
        index=next_idx,
        previous_hash=prev_hash,
        timestamp=timestamp_str,
        officer=officer_name,
        action=payload.action,
        details=payload.details,
        case_id=payload.case_id
    )

    log = models.AuditLog(
        log_id=f"AUD-BLK{next_idx:04d}-{uuid.uuid4().hex[:6].upper()}",
        block_index=next_idx,
        previous_hash=block_data["previous_hash"],
        block_hash=block_data["block_hash"],
        merkle_root=block_data["merkle_root"],
        tx_hash=block_data["tx_hash"],
        officer=officer_name,
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

@router.post("/verify", response_model=schemas.BlockchainVerifySchema)
def verify_audit_blockchain(db: Session = Depends(get_db)):
    """
    Cryptographically verifies every block in the audit ledger from Genesis to Latest.
    Re-calculates SHA-256 hashes and verifies hash-chain linkages.
    """
    all_logs = db.query(models.AuditLog).order_by(models.AuditLog.block_index.asc()).all()
    
    blocks_payload = []
    for l in all_logs:
        blocks_payload.append({
            "block_index": l.block_index,
            "previous_hash": l.previous_hash,
            "block_hash": l.block_hash,
            "timestamp": l.timestamp.isoformat() if isinstance(l.timestamp, datetime) else str(l.timestamp),
            "officer": l.officer,
            "action": l.action,
            "details": l.details,
            "case_id": l.case_id
        })

    result = verify_chain(blocks_payload)
    return result
