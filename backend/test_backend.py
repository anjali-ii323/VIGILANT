import sys
import os

# Append current directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import engine, Base, SessionLocal
from backend.app import models
from backend.app import seed
from backend.app.ml.risk_engine import recalculate_account_risk
from backend.app.ml.predictor import predict_next_movement

def run_tests():
    print("----- Running Backend System Checks -----")
    
    # 1. Initialize tables and seed
    print("Step 1: Re-initializing and seeding database...")
    seed.seed_db()
    
    db = SessionLocal()
    try:
        # 2. Verify seeded cases
        cases_count = db.query(models.Case).count()
        print(f"Verified: Found {cases_count} cases in database.")
        assert cases_count > 0, "No cases found"

        accounts_count = db.query(models.Account).count()
        print(f"Verified: Found {accounts_count} accounts in database.")
        assert accounts_count > 0, "No accounts found"

        transactions_count = db.query(models.Transaction).count()
        print(f"Verified: Found {transactions_count} transactions in database.")
        assert transactions_count > 0, "No transactions found"

        # 3. Verify risk scoring
        print("Step 2: Recalculating risk for Mule A...")
        mule_a = recalculate_account_risk(db, "MULE-A457")
        print(f"Verified: MULE-A457 Risk Score = {mule_a.risk_score} (Class: {mule_a.classification})")
        assert mule_a.risk_score >= 80, "Mule A risk score should be High Risk"

        # 4. Verify Next-movement Predictions
        print("Step 3: Generating predictions for Mule B...")
        preds = predict_next_movement(db, "MULE-B821")
        print(f"Verified: Predictions count = {len(preds)}")
        for p in preds:
            print(f"  -> Next Hop: {p['target_entity']} ({p['target_type']}) Prob: {p['probability']*100}%")
            
        print("\n[SUCCESS] All backend systems checked successfully.")
    except Exception as e:
        print(f"\n[FAILURE] Backend check failed: {e}")
        db.close()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
