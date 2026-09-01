from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/compare", tags=["Case Comparison"])

@router.get("/{case_id_1}/{case_id_2}", response_model=schemas.CaseComparisonSchema)
def compare_cases(case_id_1: str, case_id_2: str, db: Session = Depends(get_db)):
    c1_id = case_id_1.strip().upper().replace("_", "-")
    c2_id = case_id_2.strip().upper().replace("_", "-")
    
    c1 = db.query(models.Case).filter(models.Case.case_id == c1_id).first()
    c2 = db.query(models.Case).filter(models.Case.case_id == c2_id).first()
    
    if not c1 or not c2:
        raise HTTPException(status_code=404, detail="One or both cases not found")
        
    v1 = db.query(models.VictimReference).filter(models.VictimReference.victim_id == c1.victim_ref).first()
    v2 = db.query(models.VictimReference).filter(models.VictimReference.victim_id == c2.victim_ref).first()
    
    a1 = db.query(models.Alert).filter(models.Alert.case_id == c1_id).all()
    a2 = db.query(models.Alert).filter(models.Alert.case_id == c2_id).all()
    
    n1 = db.query(models.InvestigationNote).filter(models.InvestigationNote.case_id == c1_id).all()
    n2 = db.query(models.InvestigationNote).filter(models.InvestigationNote.case_id == c2_id).all()
    
    e1 = db.query(models.Evidence).filter(models.Evidence.case_id == c1_id).all()
    e2 = db.query(models.Evidence).filter(models.Evidence.case_id == c2_id).all()
    
    p1 = db.query(models.Prediction).filter(models.Prediction.case_id == c1_id).all()
    p2 = db.query(models.Prediction).filter(models.Prediction.case_id == c2_id).all()
    
    int1 = db.query(models.InterventionRequest).filter(models.InterventionRequest.case_id == c1_id).all()
    int2 = db.query(models.InterventionRequest).filter(models.InterventionRequest.case_id == c2_id).all()
    
    # Check for common accounts/ATMs
    accs1 = set([a.account_number for a in db.query(models.Account).filter(models.Account.linked_case_id == c1_id).all()])
    accs2 = set([a.account_number for a in db.query(models.Account).filter(models.Account.linked_case_id == c2_id).all()])
    common_nodes = list(accs1.intersection(accs2))
    
    txs1 = db.query(models.Transaction).filter(models.Transaction.linked_case_id == c1_id).all()
    txs2 = db.query(models.Transaction).filter(models.Transaction.linked_case_id == c2_id).all()
    
    return {
        "case_1": {
            "case": c1,
            "victim": v1,
            "alerts": a1,
            "notes": n1,
            "evidence": e1,
            "predictions": p1,
            "interventions": int1
        },
        "case_2": {
            "case": c2,
            "victim": v2,
            "alerts": a2,
            "notes": n2,
            "evidence": e2,
            "predictions": p2,
            "interventions": int2
        },
        "common_nodes": common_nodes,
        "velocity_comparison": {
            "case_1_tx_count": len(txs1),
            "case_2_tx_count": len(txs2),
            "case_1_avg_amount": c1.amount / max(len(txs1), 1),
            "case_2_avg_amount": c2.amount / max(len(txs2), 1)
        },
        "layering_depth": {
            "case_1_depth": len(txs1),
            "case_2_depth": len(txs2)
        }
    }
