import uuid
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from .. import models
from .canonical import compute_canonical_hash, create_canonical_payload
from .client import besu_client

logger = logging.getLogger("vigilant.blockchain")

def record_audit_event(
    db: Session,
    action: str,
    details: str,
    case_id: Optional[str] = None,
    officer: Optional[str] = None,
    ip_address: Optional[str] = None
) -> models.AuditLog:
    """
    Complete flow for recording a court-admissible audit log:
      1. Generates deterministic unique log ID.
      2. Creates canonical JSON representation.
      3. Computes 32-byte SHA-256 event hash.
      4. Submits hash to AuditLedger.sol on Hyperledger Besu.
      5. Awaits on-chain transaction receipt.
      6. Stores full audit record + blockchain proof in database.
    """
    officer_name = officer or "Officer Rajesh K."
    ip = ip_address or "10.42.0.8 (LE_VPN)"
    now = datetime.utcnow()
    
    # Get sequential count for readable log ID
    count = db.query(models.AuditLog).count()
    log_id = f"AUD-2026-{count + 1:04d}-{uuid.uuid4().hex[:4].upper()}"
    
    # 1. Compute canonical hash
    hash_bytes, hash_hex, canonical_json = compute_canonical_hash(
        log_id=log_id,
        action=action,
        details=details,
        timestamp=now,
        case_id=case_id,
        officer=officer_name
    )
    
    # 2. Write to Hyperledger Besu Smart Contract
    try:
        on_chain_receipt = besu_client.record_audit(
            audit_id=log_id,
            case_id=case_id or "GLOBAL",
            event_type=action,
            event_hash_bytes=hash_bytes
        )
        tx_hash = on_chain_receipt["blockchain_tx_hash"]
        block_number = on_chain_receipt["blockchain_block_number"]
        contract_addr = on_chain_receipt["contract_address"]
        chain_status = "CONFIRMED_ON_CHAIN"
    except Exception as e:
        logger.error(f"[!] Blockchain write error for {log_id}: {e}")
        tx_hash = None
        block_number = None
        contract_addr = None
        chain_status = "FAILED"
        # Propagate error if strict write required
        raise e

    # 3. Store full audit record with cryptographic anchors in DB
    log = models.AuditLog(
        log_id=log_id,
        case_id=case_id,
        action=action,
        officer=officer_name,
        details=details,
        timestamp=now,
        ip_address=ip,
        canonical_hash=hash_hex,
        blockchain_tx_hash=tx_hash,
        blockchain_block_number=block_number,
        blockchain_status=chain_status,
        contract_address=contract_addr
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def verify_audit_log(db: Session, log_id: str) -> Dict[str, Any]:
    """
    Verifies a single database audit record against the on-chain Hyperledger Besu smart contract.
    """
    log = db.query(models.AuditLog).filter(models.AuditLog.log_id == log_id).first()
    if not log:
        return {
            "log_id": log_id,
            "status": "NOT_FOUND_IN_DATABASE",
            "is_valid": False,
            "reason": "Audit record does not exist in local database."
        }

    # 1. Recompute canonical hash from current database fields
    hash_bytes, recomputed_hash_hex, _ = compute_canonical_hash(
        log_id=log.log_id,
        action=log.action,
        details=log.details,
        timestamp=log.timestamp,
        case_id=log.case_id,
        officer=log.officer
    )

    # 2. Fetch on-chain record
    try:
        on_chain = besu_client.get_audit(log.log_id)
        if not on_chain.get("exists", False):
            return {
                "log_id": log.log_id,
                "status": "TAMPERING_DETECTED",
                "is_valid": False,
                "reason": "Audit record does not exist on the Hyperledger Besu smart contract.",
                "database_hash": recomputed_hash_hex,
                "blockchain_hash": None,
                "tx_hash": log.blockchain_tx_hash,
                "block_number": log.blockchain_block_number
            }

        on_chain_hash = on_chain["event_hash"]

        # 3. Compare hashes
        if on_chain_hash.lower() != recomputed_hash_hex.lower():
            return {
                "log_id": log.log_id,
                "status": "TAMPERING_DETECTED",
                "is_valid": False,
                "reason": f"Tampering detected: Database payload was modified. Recomputed hash ({recomputed_hash_hex[:12]}...) does not match on-chain hash ({on_chain_hash[:12]}...).",
                "database_hash": recomputed_hash_hex,
                "blockchain_hash": on_chain_hash,
                "tx_hash": log.blockchain_tx_hash,
                "block_number": log.blockchain_block_number,
                "timestamp": log.timestamp.isoformat()
            }

        return {
            "log_id": log.log_id,
            "status": "VALID",
            "is_valid": True,
            "reason": "100% Cryptographic Match with Besu Smart Contract.",
            "database_hash": recomputed_hash_hex,
            "blockchain_hash": on_chain_hash,
            "tx_hash": log.blockchain_tx_hash,
            "block_number": log.blockchain_block_number,
            "timestamp": log.timestamp.isoformat()
        }

    except Exception as e:
        return {
            "log_id": log.log_id,
            "status": "BLOCKCHAIN_UNAVAILABLE",
            "is_valid": False,
            "reason": f"Could not connect to Besu node: {str(e)}"
        }

def verify_all_audit_logs(db: Session) -> Dict[str, Any]:
    """
    Verifies every audit record in the database against the on-chain ledger.
    Returns comprehensive verification summary.
    """
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.asc()).all()
    if not logs:
        return {
            "status": "EMPTY",
            "is_valid": True,
            "total_records": 0,
            "verified_count": 0,
            "tampered_count": 0,
            "records": []
        }

    records_result = []
    tampered_count = 0
    verified_count = 0
    missing_count = 0

    for log in logs:
        res = verify_audit_log(db, log.log_id)
        records_result.append(res)
        if res["is_valid"]:
            verified_count += 1
        elif res["status"] == "TAMPERING_DETECTED":
            tampered_count += 1
        else:
            missing_count += 1

    overall_valid = (tampered_count == 0 and missing_count == 0 and verified_count > 0)
    status_str = "VALID" if overall_valid else "TAMPERING_DETECTED" if tampered_count > 0 else "INCOMPLETE"

    chain_status = besu_client.get_status()

    return {
        "status": status_str,
        "is_valid": overall_valid,
        "total_records": len(logs),
        "verified_count": verified_count,
        "tampered_count": tampered_count,
        "missing_count": missing_count,
        "blockchain_network": chain_status.get("network", "Hyperledger Besu"),
        "contract_address": chain_status.get("contract_address"),
        "latest_block_number": chain_status.get("latest_block_number"),
        "records": records_result
    }

def simulate_database_tampering(db: Session, log_id: str, new_details: str) -> Dict[str, Any]:
    """
    Demo utility for SIH presentation:
    Intentionally modifies the database record's details without touching the blockchain.
    """
    log = db.query(models.AuditLog).filter(models.AuditLog.log_id == log_id).first()
    if not log:
        return {"success": False, "message": f"Record {log_id} not found."}

    original_details = log.details
    log.details = new_details
    db.commit()
    db.refresh(log)

    return {
        "success": True,
        "log_id": log_id,
        "original_details": original_details,
        "tampered_details": new_details,
        "message": f"Record {log_id} was tampered in database. Re-running verification will now trigger TAMPERING DETECTED."
    }
