from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..blockchain import (
    record_audit_event,
    verify_audit_log,
    verify_all_audit_logs,
    simulate_database_tampering,
    besu_client
)

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs & Hyperledger Besu Blockchain Ledger"])

@router.get("", response_model=List[schemas.AuditLogSchema])
def list_audit_logs(
    case_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Returns audit logs ordered by timestamp with blockchain transaction metadata.
    """
    query = db.query(models.AuditLog)
    if case_id:
        query = query.filter(models.AuditLog.case_id == case_id)
    if action:
        query = query.filter(models.AuditLog.action == action)
    return query.order_by(models.AuditLog.timestamp.desc()).limit(limit).all()

@router.post("", response_model=schemas.AuditLogSchema)
def create_audit_log(payload: schemas.AuditLogCreate, db: Session = Depends(get_db)):
    """
    Creates an audit log, canonicalizes the payload, calculates SHA-256 event hash,
    and writes it to the AuditLedger.sol smart contract on Hyperledger Besu.
    """
    try:
        log = record_audit_event(
            db=db,
            action=payload.action,
            details=payload.details,
            case_id=payload.case_id,
            officer=payload.officer
        )
        return log
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Blockchain audit recording failed: {str(e)}"
        )

@router.post("/verify", response_model=schemas.BlockchainVerifySchema)
def verify_audit_blockchain(db: Session = Depends(get_db)):
    """
    Cryptographically verifies every database audit log against the on-chain
    Hyperledger Besu smart contract. Detects any database tampering.
    """
    result = verify_all_audit_logs(db)
    return result

@router.get("/verify/{log_id}", response_model=schemas.BlockchainVerifyItemSchema)
def verify_single_audit_log(log_id: str, db: Session = Depends(get_db)):
    """
    Verifies a specific audit log ID against the Hyperledger Besu smart contract.
    """
    result = verify_audit_log(db, log_id)
    if result["status"] == "NOT_FOUND_IN_DATABASE":
        raise HTTPException(status_code=404, detail="Audit log not found in database.")
    return result

@router.post("/simulate-tamper")
def simulate_tampering_for_demo(
    payload: schemas.TamperSimulationRequest,
    db: Session = Depends(get_db)
):
    """
    SIH Demonstration Endpoint:
    Intentionally modifies a database field without touching the blockchain ledger.
    Subsequent calls to /verify will detect this as TAMPERING DETECTED.
    """
    res = simulate_database_tampering(db, payload.log_id, payload.tampered_details)
    if not res["success"]:
        raise HTTPException(status_code=404, detail=res["message"])
    return res

@router.get("/status", response_model=schemas.BlockchainStatusSchema)
def get_blockchain_status():
    """
    Returns live Hyperledger Besu node health, chain ID, and contract address.
    """
    return besu_client.get_status()
