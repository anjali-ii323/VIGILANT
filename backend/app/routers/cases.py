import uuid
import time
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from ..websocket import manager
from ..blockchain import record_audit_event, compute_canonical_hash

router = APIRouter(prefix="/cases", tags=["Cases"])

@router.get("", response_model=List[schemas.CaseSchema])
def list_cases(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.Case)
    if status:
        query = query.filter(models.Case.current_status == status)
    if priority:
        query = query.filter(models.Case.priority == priority)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (models.Case.case_id.ilike(s)) |
            (models.Case.fraud_type.ilike(s)) |
            (models.Case.victim_ref.ilike(s))
        )
    return query.order_by(models.Case.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{case_id}", response_model=schemas.CaseDetailSchema)
def get_case_detail(case_id: str, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    c = db.query(models.Case).filter(models.Case.case_id == clean_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
        
    tx_count = db.query(models.Transaction).filter(models.Transaction.linked_case_id == clean_id).count()
    mule_count = db.query(models.Account).filter(
        models.Account.linked_case_id == clean_id,
        models.Account.is_mule == True
    ).count()
    
    return {
        "case": c,
        "victim": c.victim,
        "transaction_count": tx_count,
        "mule_count": mule_count
    }

@router.get("/{case_id}/transactions", response_model=List[schemas.TransactionSchema])
def get_case_transactions(case_id: str, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    txs = db.query(models.Transaction).filter(models.Transaction.linked_case_id == clean_id).order_by(models.Transaction.timestamp.asc()).all()
    return txs

@router.get("/{case_id}/network", response_model=schemas.CaseNetworkSchema)
def get_case_network(case_id: str, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    c = db.query(models.Case).filter(models.Case.case_id == clean_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
        
    txs = db.query(models.Transaction).filter(models.Transaction.linked_case_id == clean_id).all()
    accounts = db.query(models.Account).filter(models.Account.linked_case_id == clean_id).all()
    acc_map = {a.account_number: a for a in accounts}
    
    nodes_set = set()
    for t in txs:
        nodes_set.add(t.sender_account)
        nodes_set.add(t.receiver_account)
        
    nodes = []
    node_list = list(nodes_set)
    for node_id in node_list:
        acc = acc_map.get(node_id)
        node_type = "BANK_ACCOUNT"
        risk_score = 10.0
        holder_name = node_id
        bank_name = "Banking Node"
        classification = "BENIGN"
        is_mule = False
        
        if acc:
            risk_score = acc.risk_score
            holder_name = acc.holder_name
            bank_name = acc.bank_name
            classification = acc.classification
            is_mule = acc.is_mule
            if acc.is_mule:
                node_type = "MULE"
            elif acc.classification == "MERCHANT":
                node_type = "MERCHANT"
            elif acc.classification == "CRYPTO_WALLET":
                node_type = "CRYPTO_WALLET"
                
        if node_id.startswith("ATM"):
            node_type = "ATM"
            risk_score = 95.0
            holder_name = "ATM Cashout Outlet"
        elif node_id.startswith("0x") or node_id.startswith("TRX") or node_id.startswith("USDT"):
            node_type = "CRYPTO_WALLET"
            risk_score = 96.0
            holder_name = f"Wallet ({node_id[:8]}...)"
            bank_name = "Blockchain Ledger"
        elif node_id == c.victim_ref or node_id.startswith("30") or node_id.startswith("50"):
            node_type = "VICTIM"
            risk_score = 5.0
            holder_name = c.victim.name if c.victim else "Victim Account"
            
        x, y = 100, 220
        if node_type == "VICTIM":
            x, y = 100, 220
        elif node_type == "ATM":
            x, y = 720, 220
        elif node_type == "CRYPTO_WALLET":
            x, y = 720, 100
        elif node_type == "MERCHANT":
            x, y = 740, 100
        elif node_type == "MULE":
            mules = [n for n in node_list if n in acc_map and acc_map[n].is_mule]
            m_idx = mules.index(node_id) if node_id in mules else 0
            x = 280 + m_idx * 160
            y = 110 + (m_idx % 2) * 220
        else:
            x, y = 420, 80
            
        nodes.append({
            "id": node_id,
            "label": f"{holder_name} ({node_id})",
            "type": node_type,
            "riskScore": risk_score,
            "x": float(x),
            "y": float(y),
            "holder_name": holder_name,
            "bank_name": bank_name,
            "classification": classification,
            "is_mule": is_mule
        })
        
    edges = []
    for t in txs:
        edges.append({
            "id": t.transaction_id,
            "source": t.sender_account,
            "target": t.receiver_account,
            "amount": t.amount,
            "type": t.transaction_type,
            "riskScore": t.risk_score,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None
        })
        
    cashouts = [n["id"] for n in nodes if n["type"] == "ATM"]
    mule_count = len([n for n in nodes if n["type"] == "MULE"])
    
    return {
        "case_id": clean_id,
        "nodes": nodes,
        "edges": edges,
        "total_amount": c.amount,
        "hops_count": len(edges),
        "mule_count": mule_count,
        "cashout_points": cashouts
    }

@router.get("/{case_id}/accounts", response_model=List[schemas.AccountSchema])
def get_case_accounts(case_id: str, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    accs = db.query(models.Account).filter(models.Account.linked_case_id == clean_id).all()
    return accs

@router.get("/{case_id}/predictions", response_model=List[schemas.PredictionSchema])
def get_case_predictions(case_id: str, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    preds = db.query(models.Prediction).filter(models.Prediction.case_id == clean_id).all()
    return preds

@router.get("/{case_id}/cashout", response_model=List[schemas.CashoutPredictionSchema])
def get_case_cashout(case_id: str, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    cops = db.query(models.CashoutPrediction).filter(models.CashoutPrediction.case_id == clean_id).all()
    return cops

@router.get("/{case_id}/timeline", response_model=List[schemas.InvestigationEventSchema])
def get_case_timeline(case_id: str, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    events = db.query(models.InvestigationEvent).filter(models.InvestigationEvent.case_id == clean_id).order_by(models.InvestigationEvent.step_num.asc()).all()
    return events

@router.get("/{case_id}/notes", response_model=List[schemas.InvestigationNoteSchema])
def get_case_notes(case_id: str, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    return db.query(models.InvestigationNote).filter(models.InvestigationNote.case_id == clean_id).order_by(models.InvestigationNote.timestamp.desc()).all()

@router.post("/{case_id}/notes", response_model=schemas.InvestigationNoteSchema)
def add_case_note(case_id: str, payload: schemas.InvestigationNoteCreate, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    c = db.query(models.Case).filter(models.Case.case_id == clean_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
        
    note = models.InvestigationNote(
        note_id=f"NOTE-{uuid.uuid4().hex[:8].upper()}",
        case_id=clean_id,
        officer=payload.officer or "Officer Rajesh K. (Cyber Division)",
        content=payload.content,
        category=payload.category or "INTELLIGENCE",
        timestamp=datetime.utcnow()
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    
    # Record on Hyperledger Besu Audit Ledger
    record_audit_event(
        db=db,
        action="NOTE_ADDED",
        details=f"Added note to Case {clean_id}: {payload.content[:80]}",
        case_id=clean_id,
        officer=payload.officer
    )
    
    return note

@router.delete("/{case_id}/notes/{note_id}")
def delete_case_note(case_id: str, note_id: str, db: Session = Depends(get_db)):
    note = db.query(models.InvestigationNote).filter(models.InvestigationNote.note_id == note_id).first()
    if note:
        db.delete(note)
        db.commit()
    return {"status": "success", "deleted_note_id": note_id}

@router.get("/{case_id}/evidence", response_model=List[schemas.EvidenceSchema])
def get_case_evidence(case_id: str, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    return db.query(models.Evidence).filter(models.Evidence.case_id == clean_id).order_by(models.Evidence.timestamp.desc()).all()

@router.post("/{case_id}/evidence", response_model=schemas.EvidenceSchema)
def add_case_evidence(case_id: str, payload: schemas.EvidenceCreate, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    c = db.query(models.Case).filter(models.Case.case_id == clean_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
        
    # Cryptographic proof-of-existence SHA-256 calculation
    payload_content = f"{clean_id}:{payload.title}:{payload.description}:{time.time()}"
    import hashlib
    sha256_hash = f"SHA256:{hashlib.sha256(payload_content.encode('utf-8')).hexdigest().upper()}"
    ipfs_cid = f"bafybeic{sha256_hash[7:39].lower()}vigilant"

    ev = models.Evidence(
        evidence_id=f"EVD-{uuid.uuid4().hex[:8].upper()}",
        case_id=clean_id,
        title=payload.title,
        description=payload.description,
        file_type=payload.file_type or "PDF",
        file_size="1.4 MB",
        hash_checksum=sha256_hash,
        ipfs_cid=ipfs_cid,
        timestamp=datetime.utcnow()
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    
    # Record evidence anchor on Hyperledger Besu Audit Ledger
    record_audit_event(
        db=db,
        action="EVIDENCE_ANCHORED",
        details=f"Evidence '{payload.title}' attached to Case {clean_id} with checksum {sha256_hash[:20]}...",
        case_id=clean_id
    )
    
    return ev

@router.delete("/{case_id}/evidence/{evidence_id}")
def delete_case_evidence(case_id: str, evidence_id: str, db: Session = Depends(get_db)):
    ev = db.query(models.Evidence).filter(models.Evidence.evidence_id == evidence_id).first()
    if ev:
        db.delete(ev)
        db.commit()
    return {"status": "success", "deleted_evidence_id": evidence_id}

@router.post("/{case_id}/intervene", response_model=schemas.InterventionSchema)
async def create_intervention_action(case_id: str, payload: schemas.InterventionCreate, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    c = db.query(models.Case).filter(models.Case.case_id == clean_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
        
    req_id = f"INT-{uuid.uuid4().hex[:8].upper()}"
    officer_str = "Officer Rajesh K. (Cyber Division)"

    intervention = models.InterventionRequest(
        request_id=req_id,
        case_id=clean_id,
        account_number=payload.account_number,
        target_entity=payload.target_entity,
        action_type=payload.action_type,
        status="EXECUTED",
        requested_by=officer_str,
        reason=payload.reason,
        created_at=datetime.utcnow(),
        response_data={
            "gateway": "NPCI_CENTRAL_HOLD_GATEWAY",
            "lock_reference": f"LCK-{uuid.uuid4().hex[:10].upper()}",
            "freeze_timestamp": datetime.utcnow().isoformat(),
            "status_message": f"Hold directive registered on {payload.account_number}."
        }
    )
    db.add(intervention)
    
    # Update account status to frozen if freeze request
    if payload.action_type == "FREEZE_ACCOUNT":
        acc = db.query(models.Account).filter(models.Account.account_number == payload.account_number).first()
        if acc:
            acc.is_frozen = True
            acc.classification = "FROZEN_MULE"
            
    # Mark case as RESOLVED
    c.current_status = "RESOLVED"
    c.last_activity = "Intervention Directive Executed"
    
    db.commit()
    db.refresh(intervention)
    
    # Record intervention on Hyperledger Besu Audit Ledger
    record_audit_event(
        db=db,
        action="INTERVENTION_CREATED",
        details=f"Intervention {payload.action_type} executed on account {payload.account_number} ({payload.target_entity}). Reason: {payload.reason}",
        case_id=clean_id,
        officer=officer_str
    )

    # Broadcast live alert to WebSockets
    await manager.broadcast({
        "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
        "amount": c.amount,
        "description": f"INTERVENTION DIRECTIVE: Account {payload.account_number} locked on {payload.target_entity} for Case {clean_id}.",
        "risk_level": "CRITICAL",
        "event_type": "ALERT",
        "meta": {"case_id": clean_id, "action": payload.action_type}
    })
    
    return intervention
