from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/search", tags=["Global Search"])

@router.get("", response_model=List[schemas.SearchResultSchema])
def search_entities(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    query = q.strip().upper()
    results = []

    # 1. Search Cases
    cases = db.query(models.Case).filter(
        models.Case.case_id.contains(query) | 
        models.Case.victim_ref.contains(query)
    ).limit(5).all()
    for c in cases:
        results.append({
            "id": c.case_id,
            "type": "CASE",
            "title": f"Case {c.case_id} ({c.fraud_type})",
            "subtitle": f"Amount: ₹{c.amount.toLocaleString('en-IN') if hasattr(c.amount, 'toLocaleString') else c.amount} | Status: {c.current_status}"
        })

    # 2. Search Accounts
    accounts = db.query(models.Account).filter(
        models.Account.account_number.contains(query) | 
        models.Account.holder_name.contains(query.title()) |
        models.Account.holder_name.contains(query)
    ).limit(5).all()
    for a in accounts:
        results.append({
            "id": a.account_number,
            "type": "ACCOUNT",
            "title": f"Account {a.account_number} ({a.holder_name})",
            "subtitle": f"Bank: {a.bank_name} | Risk: {int(a.risk_score)}% ({a.classification})"
        })

    # 3. Search Transactions
    txs = db.query(models.Transaction).filter(
        models.Transaction.transaction_id.contains(query) |
        models.Transaction.sender_account.contains(query) |
        models.Transaction.receiver_account.contains(query)
    ).limit(5).all()
    for t in txs:
        results.append({
            "id": t.transaction_id,
            "type": "TRANSACTION",
            "title": f"Tx {t.transaction_id}",
            "subtitle": f"₹{t.amount} from {t.sender_account} to {t.receiver_account} ({t.transaction_type})"
        })

    # 4. Search Alerts
    alerts = db.query(models.Alert).filter(
        models.Alert.alert_id.contains(query) |
        models.Alert.title.contains(query.title()) |
        models.Alert.title.contains(query)
    ).limit(5).all()
    for al in alerts:
        results.append({
            "id": al.alert_id,
            "type": "ALERT",
            "title": f"Alert {al.alert_id}: {al.title}",
            "subtitle": f"Severity: {al.severity} | Case: {al.case_id}"
        })

    return results
