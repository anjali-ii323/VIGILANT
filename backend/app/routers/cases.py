from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import random
from ..database import get_db
from .. import models, schemas
from ..ml.risk_engine import recalculate_account_risk
from ..ml.predictor import predict_next_movement
from ..websocket_manager import manager
from datetime import datetime, timedelta

router = APIRouter(prefix="/cases", tags=["Cases Workspace"])

# Dict to store simulation step and run states per case ID
sim_case_states = {}

class SimStateObj:
    def __init__(self):
        self.step = 0
        self.running = False

def get_sim_state(case_id: str) -> SimStateObj:
    if case_id not in sim_case_states:
        sim_case_states[case_id] = SimStateObj()
        # Initialize default step based on existing transactions count
        # if a case already has transactions, set step to 2 or 3
    return sim_case_states[case_id]

@router.get("", response_model=List[schemas.CaseSchema])
def get_cases(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    fraud_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Case)
    if status:
        query = query.filter(models.Case.current_status == status)
    if risk_level:
        if risk_level == "CRITICAL":
            query = query.filter(models.Case.risk_score >= 85)
        elif risk_level == "HIGH":
            query = query.filter(models.Case.risk_score >= 70, models.Case.risk_score < 85)
        elif risk_level == "MEDIUM":
            query = query.filter(models.Case.risk_score >= 40, models.Case.risk_score < 70)
        elif risk_level == "LOW":
            query = query.filter(models.Case.risk_score < 40)
    if fraud_type:
        query = query.filter(models.Case.fraud_type.contains(fraud_type))
    if search:
        query = query.filter(
            models.Case.case_id.contains(search) | 
            models.Case.victim_ref.contains(search) |
            models.Case.assigned_officer.contains(search)
        )
    return query.order_by(models.Case.risk_score.desc()).all()

@router.get("/{case_id}", response_model=schemas.CaseSchema)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return case

@router.get("/{case_id}/transactions", response_model=List[schemas.TransactionSchema])
def get_case_transactions(case_id: str, db: Session = Depends(get_db)):
    return db.query(models.Transaction).filter(models.Transaction.linked_case_id == case_id).order_by(models.Transaction.timestamp.asc()).all()

@router.get("/{case_id}/accounts", response_model=List[schemas.AccountSchema])
def get_case_accounts(case_id: str, db: Session = Depends(get_db)):
    # Pull all accounts explicitly linked to this case, plus the victim account
    case = db.query(models.Case).filter(models.Case.case_id == case_id).first()
    victim_acc_num = None
    if case:
        victim = db.query(models.VictimReference).filter(models.VictimReference.victim_id == case.victim_ref).first()
        if victim:
            victim_acc_num = victim.account_number
            
    accounts = db.query(models.Account).filter(
        (models.Account.linked_case_id == case_id) |
        (models.Account.account_number == victim_acc_num)
    ).all()
    
    # Recalculate risks dynamically to keep current
    for acc in accounts:
        if acc.is_mule:
            recalculate_account_risk(db, acc.account_number)
            
    return accounts

@router.get("/{case_id}/risk")
def get_case_risk_summaries(case_id: str, db: Session = Depends(get_db)):
    accounts = get_case_accounts(case_id, db)
    summaries = []
    for acc in accounts:
        if acc.is_mule:
            summaries.append({
                "account_number": acc.account_number,
                "holder_name": acc.holder_name,
                "risk_score": acc.risk_score,
                "classification": acc.classification,
                "risk_factors": acc.risk_factors
            })
    return summaries

@router.get("/{case_id}/predictions", response_model=List[schemas.PredictionSchema])
def get_case_predictions(case_id: str, db: Session = Depends(get_db)):
    # Dynamically generate and save next hop predictions based on active mules
    mules = db.query(models.Account).filter(models.Account.linked_case_id == case_id).all()
    for mule in mules:
        predict_next_movement(db, mule.account_number)
        
    return db.query(models.Prediction).filter(models.Prediction.case_id == case_id).all()

@router.get("/{case_id}/alerts", response_model=List[schemas.AlertSchema])
def get_case_alerts(case_id: str, db: Session = Depends(get_db)):
    return db.query(models.Alert).filter(models.Alert.case_id == case_id).order_by(models.Alert.timestamp.desc()).all()

@router.get("/{case_id}/evidence", response_model=List[schemas.EvidenceSchema])
def get_case_evidence(case_id: str, db: Session = Depends(get_db)):
    return db.query(models.Evidence).filter(models.Evidence.case_id == case_id).order_by(models.Evidence.timestamp.desc()).all()

@router.get("/{case_id}/timeline")
def get_case_timeline(case_id: str, db: Session = Depends(get_db)):
    notes = db.query(models.InvestigationNote).filter(models.InvestigationNote.case_id == case_id).all()
    sim_evs = db.query(models.InvestigationEvent).filter(models.InvestigationEvent.case_id == case_id).order_by(models.InvestigationEvent.step_num.asc()).all()
    
    timeline = []
    for n in notes:
        timeline.append({
            "timestamp": n.timestamp.isoformat(),
            "time_label": n.timestamp.strftime("%H:%M:%S"),
            "event_type": "NOTE",
            "title": f"Note by {n.officer}",
            "description": n.content,
            "severity": "INFO"
        })
        
    for se in sim_evs:
        timeline.append({
            "timestamp": se.timestamp.isoformat(),
            "time_label": se.timestamp.strftime("%H:%M:%S"),
            "event_type": "SYSTEM_EVENT",
            "title": se.title,
            "description": se.description,
            "severity": "CRITICAL" if se.step_num in [4, 5] else "WARNING" if se.step_num in [2, 3] else "INFO"
        })
            
    timeline.sort(key=lambda x: x["timestamp"])
    return timeline

@router.get("/{case_id}/cashout")
def get_case_cashout(case_id: str, db: Session = Depends(get_db)):
    # Fetch ATMs
    atms = db.query(models.ATM).all()
    # Fetch case cashout predictions
    preds = db.query(models.CashoutPrediction).filter(models.CashoutPrediction.case_id == case_id).all()
    
    zones = []
    for atm in atms:
        # Check if there is a prediction for this ATM in this case
        pred = next((p for p in preds if p.atm_id == atm.atm_id), None)
        
        probability = 0.05
        factors = {
            "Withdrawal velocity score": int(atm.withdrawal_velocity / 100000)
        }
        time_window = 60
        
        if pred:
            probability = pred.probability
            factors.update(pred.factors)
            time_window = pred.time_window_mins
            
        risk_percentage = int(probability * 100)
        
        if risk_percentage >= 80:
            level = "CRITICAL"
            color = "red"
        elif risk_percentage >= 60:
            level = "HIGH"
            color = "orange"
        elif risk_percentage >= 35:
            level = "MODERATE"
            color = "yellow"
        else:
            level = "LOW"
            color = "green"
            
        zones.append({
            "id": atm.atm_id,
            "location_name": atm.location_name,
            "city": atm.city,
            "latitude": atm.latitude,
            "longitude": atm.longitude,
            "risk_score": risk_percentage,
            "risk_level": level,
            "risk_color": color,
            "predicted_window_mins": time_window,
            "factors": factors
        })
    return zones

@router.post("", response_model=schemas.CaseSchema)
def create_case(payload: schemas.CaseBase, db: Session = Depends(get_db)):
    existing = db.query(models.Case).filter(models.Case.case_id == payload.case_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Case already exists")
    
    new_case = models.Case(
        case_id=payload.case_id,
        victim_ref=payload.victim_ref,
        fraud_type=payload.fraud_type,
        amount=payload.amount,
        current_status=payload.current_status,
        risk_score=payload.risk_score,
        assigned_officer=payload.assigned_officer,
        last_activity="Case Registered",
        created_at=datetime.utcnow()
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return new_case

@router.post("/{case_id}/notes", response_model=schemas.InvestigationNoteSchema)
def add_case_note(case_id: str, payload: schemas.InvestigationNoteCreate, db: Session = Depends(get_db)):
    note_id = f"NTE-{int(datetime.utcnow().timestamp()) % 100000}-{random.randint(10, 99)}"
    new_note = models.InvestigationNote(
        note_id=note_id,
        case_id=case_id,
        officer="Investigating Officer Rajesh K.",
        content=payload.content,
        timestamp=datetime.utcnow()
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@router.post("/{case_id}/alerts", response_model=schemas.AlertSchema)
def add_case_alert(case_id: str, payload: schemas.AlertBase, db: Session = Depends(get_db)):
    new_alert = models.Alert(
        alert_id=payload.alert_id,
        case_id=case_id,
        severity=payload.severity,
        title=payload.title,
        description=payload.description,
        account_number=payload.account_number,
        amount_at_risk=payload.amount_at_risk,
        status="ACTIVE",
        timestamp=datetime.utcnow()
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert

# Case-specific Simulation Engine
@router.post("/{case_id}/simulate")
async def simulate_case(case_id: str, payload: dict, db: Session = Depends(get_db)):
    action = payload.get("action", "step")
    sim = get_sim_state(case_id)
    
    if action == "reset":
        sim.step = 0
        sim.running = False
        
        # Remove simulated transactions/alerts/timeline events for this case
        db.query(models.Transaction).filter(
            models.Transaction.linked_case_id == case_id,
            models.Transaction.is_simulated == True
        ).delete()
        db.query(models.Alert).filter(
            models.Alert.case_id == case_id,
            models.Alert.title.contains("Simulated")
        ).delete()
        db.query(models.InvestigationEvent).filter(
            models.InvestigationEvent.case_id == case_id
        ).delete()
        
        # Re-create baseline complaint timeline event
        db.add(models.InvestigationEvent(
            event_id=f"EV-{case_id.split('-')[-1]}-1",
            case_id=case_id,
            step_num=1,
            title="Complaint Received",
            description=f"Cyber portal registered complaint from victim reference for case {case_id}.",
            timestamp=datetime.utcnow() - timedelta(minutes=150)
        ))
        
        db.commit()
        return {"status": "RESET", "current_step": 0, "running": False}
        
    elif action == "pause":
        sim.running = False
        return {"status": "PAUSED", "current_step": sim.step, "running": False}
        
    elif action == "start":
        sim.running = True
        return {"status": "RUNNING", "current_step": sim.step, "running": True}
        
    # Execute a step
    sim.step += 1
    if sim.step > 5:
        sim.step = 1
        
    # Load case particulars
    case = db.query(models.Case).filter(models.Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    victim = db.query(models.VictimReference).filter(models.VictimReference.victim_id == case.victim_ref).first()
    mules = db.query(models.Account).filter(models.Account.linked_case_id == case_id).all()
    
    victim_acc = victim.account_number if victim else f"VIC-ACC-{case_id.split('-')[-1]}"
    mule_1 = mules[0].account_number if len(mules) > 0 else f"MULE-A-{case_id.split('-')[-1]}"
    mule_2 = mules[1].account_number if len(mules) > 1 else f"MULE-B-{case_id.split('-')[-1]}"
    mule_3 = mules[2].account_number if len(mules) > 2 else f"MULE-C-{case_id.split('-')[-1]}"
    
    # Locate linked ATM or fallback
    city_atm = db.query(models.ATM).filter(models.ATM.atm_id.in_(["ATM-Z03", "ATM-Z11", "ATM-Z07", "ATM-Z09", "ATM-Z05"])).first()
    atm_id = city_atm.atm_id if city_atm else "ATM-Z03"
    if case_id == "CF-2026-00422":
        atm_id = "ATM-Z11"
    elif case_id == "CF-2026-00423":
        atm_id = "ATM-Z07"
    elif case_id == "CF-2026-00424":
        atm_id = "ATM-Z09"
    elif case_id == "CF-2026-00425":
        atm_id = "ATM-Z05"

    tx_desc = ""
    if sim.step == 1:
        # Step 1: Complaint entry
        case.risk_score = 45.0
        tx_desc = f"Simulated: Complaint registered for case {case_id}."
        db.add(models.InvestigationEvent(
            event_id=f"EV-{case_id.split('-')[-1]}-1-{int(datetime.utcnow().timestamp()) % 1000}",
            case_id=case_id, step_num=1, title="Complaint Registered",
            description=tx_desc, timestamp=datetime.utcnow()
        ))
    elif sim.step == 2:
        # Step 2: Initial injection
        tx_id = f"TXN-SIM-{int(datetime.utcnow().timestamp()) % 1000000}"
        db.add(models.Transaction(
            transaction_id=tx_id, sender_account=victim_acc, receiver_account=mule_1,
            amount=case.amount, transaction_type="UPI", risk_score=91.0, is_simulated=True, linked_case_id=case_id
        ))
        recalculate_account_risk(db, mule_1)
        tx_desc = f"Simulated: ₹{case.amount} entered primary mule {mule_1}."
        db.add(models.InvestigationEvent(
            event_id=f"EV-{case_id.split('-')[-1]}-2-{int(datetime.utcnow().timestamp()) % 1000}",
            case_id=case_id, step_num=2, title="Initial Transfer Traced",
            description=tx_desc, timestamp=datetime.utcnow()
        ))
    elif sim.step == 3:
        # Step 3: Layering splits
        tx_id1 = f"TXN-SIM-{int(datetime.utcnow().timestamp()) % 1000000 + 1}"
        tx_id2 = f"TXN-SIM-{int(datetime.utcnow().timestamp()) % 1000000 + 2}"
        db.add_all([
            models.Transaction(
                transaction_id=tx_id1, sender_account=mule_1, receiver_account=mule_2,
                amount=case.amount * 0.6, transaction_type="IMPS", risk_score=78.0, is_simulated=True, linked_case_id=case_id
            ),
            models.Transaction(
                transaction_id=tx_id2, sender_account=mule_1, receiver_account=mule_3,
                amount=case.amount * 0.4, transaction_type="IMPS", risk_score=85.0, is_simulated=True, linked_case_id=case_id
            )
        ])
        recalculate_account_risk(db, mule_1)
        recalculate_account_risk(db, mule_2)
        recalculate_account_risk(db, mule_3)
        tx_desc = f"Simulated Layering: Funds split from {mule_1} -> {mule_2} and {mule_3}."
        db.add(models.InvestigationEvent(
            event_id=f"EV-{case_id.split('-')[-1]}-3-{int(datetime.utcnow().timestamp()) % 1000}",
            case_id=case_id, step_num=3, title="Transaction Splitting Triggered",
            description=tx_desc, timestamp=datetime.utcnow()
        ))
        
        # Trigger splitting alert
        db.add(models.Alert(
            alert_id=f"ALT-SIM-SPLIT-{int(datetime.utcnow().timestamp()) % 100000}",
            case_id=case_id, severity="WARNING", title="Simulated Structuring Alert",
            description=f"Transaction splitting structure detected: split from {mule_1} to evasive destination endpoints.",
            account_number=mule_1, amount_at_risk=case.amount, status="ACTIVE", timestamp=datetime.utcnow()
        ))
    elif sim.step == 4:
        # Step 4: Next hop predictions transaction
        tx_id = f"TXN-SIM-{int(datetime.utcnow().timestamp()) % 1000000 + 3}"
        db.add(models.Transaction(
            transaction_id=tx_id, sender_account=mule_2, receiver_account=mule_3,
            amount=case.amount * 0.35, transaction_type="IMPS", risk_score=91.0, is_simulated=True, linked_case_id=case_id
        ))
        recalculate_account_risk(db, mule_2)
        recalculate_account_risk(db, mule_3)
        
        tx_desc = f"Simulated prediction match: {mule_2} -> {mule_3} (₹{case.amount * 0.35})."
        db.add(models.InvestigationEvent(
            event_id=f"EV-{case_id.split('-')[-1]}-4-{int(datetime.utcnow().timestamp()) % 1000}",
            case_id=case_id, step_num=4, title="Next Hop Verified",
            description=tx_desc, timestamp=datetime.utcnow()
        ))
        
        # Trigger predictive alert
        db.add(models.Alert(
            alert_id=f"ALT-SIM-{int(datetime.utcnow().timestamp()) % 100000}",
            case_id=case_id, severity="CRITICAL", title="Simulated Secondary Layering",
            description=f"Automated next-hop transfer detected: {mule_2} -> {mule_3}.",
            account_number=mule_3, amount_at_risk=case.amount * 0.35, status="ACTIVE", timestamp=datetime.utcnow()
        ))
    elif sim.step == 5:
        # Step 5: Cash-out withdrawal
        tx_id = f"TXN-SIM-{int(datetime.utcnow().timestamp()) % 1000000 + 4}"
        db.add(models.Transaction(
            transaction_id=tx_id, sender_account=mule_3, receiver_account=atm_id,
            amount=case.amount * 0.25, transaction_type="ATM_WITHDRAWAL", risk_score=99.0, is_simulated=True, linked_case_id=case_id
        ))
        recalculate_account_risk(db, mule_3)
        
        tx_desc = f"Simulated cash-out: withdrawal recorded at terminal {atm_id}."
        db.add(models.InvestigationEvent(
            event_id=f"EV-{case_id.split('-')[-1]}-5-{int(datetime.utcnow().timestamp()) % 1000}",
            case_id=case_id, step_num=5, title="Cash-Out Verified",
            description=tx_desc, timestamp=datetime.utcnow()
        ))
        
        db.add(models.Alert(
            alert_id=f"ALT-SIM-{int(datetime.utcnow().timestamp()) % 100000 + 1}",
            case_id=case_id, severity="CRITICAL", title="Simulated ATM Cash-Out",
            description=f"Withdrawal of ₹{case.amount * 0.25} verified at cluster {atm_id}.",
            account_number=mule_3, amount_at_risk=case.amount * 0.25, status="ACTIVE", timestamp=datetime.utcnow()
        ))

    case.last_activity = tx_desc
    db.commit()

    # Extract properties locally to avoid session detachment errors
    case_amount = case.amount

    # Broadcast event via WebSockets
    try:
        import asyncio
        async def notify():
            await manager.broadcast({
                "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
                "amount": case_amount,
                "description": tx_desc,
                "risk_level": "CRITICAL" if sim.step in [4, 5] else "WARNING",
                "event_type": "TRANSACTION" if sim.step in [2, 3, 4] else "ALERT",
                "meta": {"case_id": case_id, "step": sim.step}
            })
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(notify())
    except Exception:
        pass

    return {
        "status": "ADVANCED",
        "current_step": sim.step,
        "running": sim.running,
        "last_event": tx_desc
    }
