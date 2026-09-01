import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from .. import models, schemas
from ..websocket_manager import manager

router = APIRouter(prefix="/cases", tags=["Case Management"])

@router.get("", response_model=List[schemas.CaseSchema])
def list_cases(
    search: Optional[str] = None,
    risk_level: Optional[str] = None,
    fraud_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Case)
    
    if search:
        s = search.strip().upper().replace("_", "-")
        query = query.filter(
            models.Case.case_id.contains(s) |
            models.Case.fraud_type.contains(search) |
            models.Case.victim_ref.contains(s) |
            models.Case.assigned_officer.contains(search)
        )
    
    if risk_level:
        if risk_level == "CRITICAL":
            query = query.filter(models.Case.risk_score >= 80)
        elif risk_level == "HIGH":
            query = query.filter(models.Case.risk_score >= 60, models.Case.risk_score < 80)
        elif risk_level == "MEDIUM":
            query = query.filter(models.Case.risk_score >= 35, models.Case.risk_score < 60)
        elif risk_level == "LOW":
            query = query.filter(models.Case.risk_score < 35)
            
    if fraud_type and fraud_type != "ALL":
        query = query.filter(models.Case.fraud_type.contains(fraud_type))
        
    if status_filter and status_filter != "ALL":
        query = query.filter(models.Case.current_status == status_filter)
        
    return query.order_by(models.Case.created_at.desc()).all()

@router.get("/{case_id}", response_model=schemas.CaseDetailSchema)
def get_case(case_id: str, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    c = db.query(models.Case).filter(models.Case.case_id == clean_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
        
    victim = db.query(models.VictimReference).filter(models.VictimReference.victim_id == c.victim_ref).first()
    alerts = db.query(models.Alert).filter(models.Alert.case_id == clean_id).order_by(models.Alert.timestamp.desc()).all()
    notes = db.query(models.InvestigationNote).filter(models.InvestigationNote.case_id == clean_id).order_by(models.InvestigationNote.timestamp.desc()).all()
    evidence = db.query(models.Evidence).filter(models.Evidence.case_id == clean_id).order_by(models.Evidence.timestamp.desc()).all()
    predictions = db.query(models.Prediction).filter(models.Prediction.case_id == clean_id).all()
    interventions = db.query(models.InterventionRequest).filter(models.InterventionRequest.case_id == clean_id).order_by(models.InterventionRequest.created_at.desc()).all()
    
    return {
        "case": c,
        "victim": victim,
        "alerts": alerts,
        "notes": notes,
        "evidence": evidence,
        "predictions": predictions,
        "interventions": interventions
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
        
    txs = db.query(models.Transaction).filter(models.Transaction.linked_case_id == clean_id).order_by(models.Transaction.timestamp.asc()).all()
    accounts = db.query(models.Account).filter(models.Account.linked_case_id == clean_id).all()
    acc_map = {a.account_number: a for a in accounts}
    
    unique_nodes = set()
    for t in txs:
        if t.sender_account: unique_nodes.add(t.sender_account)
        if t.receiver_account: unique_nodes.add(t.receiver_account)
        
    nodes = []
    node_list = list(unique_nodes)
    
    for idx, node_id in enumerate(node_list):
        acc = acc_map.get(node_id)
        node_type = "BANK_ACCOUNT"
        risk_score = 5.0
        holder_name = node_id
        bank_name = "Banking Node"
        classification = "SAFE"
        is_mule = False
        
        if acc:
            risk_score = acc.risk_score
            holder_name = acc.holder_name
            bank_name = acc.bank_name
            classification = acc.classification
            is_mule = acc.is_mule
            if acc.is_mule: node_type = "MULE"
            elif acc.classification == "MERCHANT": node_type = "MERCHANT"
            
        if node_id.startswith("ATM"):
            node_type = "ATM"
            risk_score = 95.0
            holder_name = "ATM Terminal"
            bank_name = "Cash-Out Outlet"
            classification = "OUTLET"
        elif node_id == c.victim_ref or node_id.startswith("30") or node_id.startswith("VIC"):
            node_type = "VICTIM"
            risk_score = 5.0
            holder_name = c.victim_ref
            classification = "VICTIM"
            
        # Compute layout positions
        if node_type == "VICTIM":
            x, y = 100, 220
        elif node_type == "ATM":
            x, y = 720, 220
        elif node_type == "MERCHANT":
            x, y = 740, 100
        elif node_type == "MULE":
            mules = [n for n in node_list if n in acc_map and acc_map[n].is_mule]
            m_idx = mules.indexOf(node_id) if node_id in mules else 0
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
    
    # Also log in audit
    audit = models.AuditLog(
        log_id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
        officer=payload.officer or "Officer Rajesh K.",
        action="NOTE_ADDED",
        case_id=clean_id,
        details=f"Added investigation note to Case {clean_id}: {payload.content[:50]}...",
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    
    db.commit()
    db.refresh(note)
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
        
    ev = models.Evidence(
        evidence_id=f"EVD-{uuid.uuid4().hex[:8].upper()}",
        case_id=clean_id,
        title=payload.title,
        description=payload.description,
        file_type=payload.file_type or "PDF",
        file_size="1.5 MB",
        hash_checksum=f"SHA256:{uuid.uuid4().hex[:16].upper()}",
        timestamp=datetime.utcnow()
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev

@router.delete("/{case_id}/evidence/{evidence_id}")
def delete_case_evidence(case_id: str, evidence_id: str, db: Session = Depends(get_db)):
    ev = db.query(models.Evidence).filter(models.Evidence.evidence_id == evidence_id).first()
    if ev:
        db.delete(ev)
        db.commit()
    return {"status": "success", "deleted_evidence_id": evidence_id}

@router.post("/{case_id}/intervene", response_model=schemas.InterventionRequestSchema)
async def create_intervention_action(case_id: str, payload: schemas.InterventionRequestCreate, db: Session = Depends(get_db)):
    clean_id = case_id.strip().upper().replace("_", "-")
    c = db.query(models.Case).filter(models.Case.case_id == clean_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
        
    req_id = f"INT-{uuid.uuid4().hex[:8].upper()}"
    intervention = models.InterventionRequest(
        request_id=req_id,
        case_id=clean_id,
        account_number=payload.account_number,
        target_entity=payload.target_entity,
        action_type=payload.action_type,
        status="EXECUTED_SIMULATED",
        requested_by=payload.requested_by,
        reason=payload.reason,
        created_at=datetime.utcnow(),
        response_data={
            "gateway": "NPCI_LE_INTERCEPT_GATEWAY_V2",
            "lock_reference": f"NPCI-LCK-{uuid.uuid4().hex[:10].upper()}",
            "freeze_timestamp": datetime.utcnow().isoformat(),
            "status_message": f"Successfully simulated cryptographic freeze request on {payload.account_number}."
        }
    )
    db.add(intervention)
    
    # Update account status to frozen if freeze request
    if payload.action_type == "FREEZE_ACCOUNT":
        acc = db.query(models.Account).filter(models.Account.account_number == payload.account_number).first()
        if acc:
            acc.is_frozen = True
            acc.classification = "FROZEN_MULE"
            
    # Mark case as RESOLVED/FROZEN
    c.current_status = "RESOLVED"
    c.last_activity = "Proactive Freeze Executed"
    
    # Create audit log
    audit = models.AuditLog(
        log_id=f"AUD-{uuid.uuid4().hex[:8].upper()}",
        officer=payload.requested_by,
        action="INTERVENTION_CREATED",
        case_id=clean_id,
        details=f"Executed proactive freeze lock {req_id} for account {payload.account_number} ({payload.target_entity}).",
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    
    db.commit()
    db.refresh(intervention)
    
    # Broadcast live alert to WebSockets
    await manager.broadcast({
        "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
        "amount": c.amount,
        "description": f"INTERVENTION EXECUTED: Account {payload.account_number} frozen on {payload.target_entity} for Case {clean_id}.",
        "risk_level": "CRITICAL",
        "event_type": "ALERT",
        "meta": {"case_id": clean_id, "action": payload.action_type}
    })
    
    return intervention
