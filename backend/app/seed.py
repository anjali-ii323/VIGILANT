import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from . import models
from .ml.risk_engine import recalculate_account_risk
from .blockchain import record_audit_event, compute_canonical_hash

INDIAN_FIRST_NAMES = ["Amit", "Priya", "Rajesh", "Sunita", "Vikram", "Neha", "Sanjay", "Deepa", "Rahul", "Anjali", 
                      "Arjun", "Kiran", "Vijay", "Meera", "Rohan", "Shalini", "Manish", "Divya", "Suresh", "Pooja",
                      "Abhishek", "Aishwarya", "Anil", "Aparna", "Dev", "Gauri", "Harish", "Jyoti", "Manoj", "Nisha"]
INDIAN_LAST_NAMES = ["Sharma", "Patel", "Kumar", "Singh", "Joshi", "Mehta", "Nair", "Reddy", "Gupta", "Rao", 
                     "Verma", "Choudhury", "Das", "Sen", "Pillai", "Iyer", "Banerjee", "Mishra", "Patil", "Deshmukh",
                     "Grover", "Trivedi", "Pandey", "Bose", "Menon", "Acharya", "Prasad", "Sinha", "Naidu", "Saxena"]

BANKS = [
    ("State Bank of India", "SBIN"),
    ("HDFC Bank", "HDFC"),
    ("ICICI Bank", "ICIC"),
    ("Axis Bank", "UTIB"),
    ("Punjab National Bank", "PUNB"),
    ("Bank of Baroda", "BARB"),
    ("Canara Bank", "CNRB"),
    ("Union Bank of India", "UBIN")
]

ATM_LIST = ["ATM-Z03", "ATM-Z11", "ATM-Z07", "ATM-Z09", "ATM-Z05", "ATM-Z14", "ATM-Z18", "ATM-Z22"]

def seed_db():
    db = SessionLocal()
    
    # Drop and recreate all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    print("Re-creating entities and seeding rich synthetic dataset with Blockchain Ledger...")

    # 1. Seed ATMs
    atms_dict = {
        "ATM-Z03": models.ATM(atm_id="ATM-Z03", location_name="ATM Cluster 03 - Dadar West", city="Mumbai", latitude=19.0210, longitude=72.8424, risk_level="CRITICAL", withdrawal_velocity=480000.0, active_incidents=4),
        "ATM-Z11": models.ATM(atm_id="ATM-Z11", location_name="ATM Cluster 11 - Bandra Reclamation", city="Mumbai", latitude=19.0425, longitude=72.8368, risk_level="HIGH", withdrawal_velocity=350000.0, active_incidents=2),
        "ATM-Z07": models.ATM(atm_id="ATM-Z07", location_name="ATM Cluster 07 - Kurla East", city="Mumbai", latitude=19.0600, longitude=72.8730, risk_level="HIGH", withdrawal_velocity=290000.0, active_incidents=3),
        "ATM-Z09": models.ATM(atm_id="ATM-Z09", location_name="ATM Cluster 09 - Andheri West Station", city="Mumbai", latitude=19.1190, longitude=72.8470, risk_level="CRITICAL", withdrawal_velocity=520000.0, active_incidents=5),
        "ATM-Z05": models.ATM(atm_id="ATM-Z05", location_name="ATM Cluster 05 - Borivali West Sector 4", city="Mumbai", latitude=19.2300, longitude=72.8570, risk_level="MEDIUM", withdrawal_velocity=180000.0, active_incidents=1),
        "ATM-Z14": models.ATM(atm_id="ATM-Z14", location_name="ATM Cluster 14 - Thane Station South", city="Mumbai", latitude=19.1860, longitude=72.9750, risk_level="HIGH", withdrawal_velocity=310000.0, active_incidents=2),
        "ATM-Z18": models.ATM(atm_id="ATM-Z18", location_name="ATM Cluster 18 - Vashi Sector 17", city="Navi Mumbai", latitude=19.0760, longitude=72.9980, risk_level="MEDIUM", withdrawal_velocity=220000.0, active_incidents=1),
        "ATM-Z22": models.ATM(atm_id="ATM-Z22", location_name="ATM Cluster 22 - Churchgate Terminal", city="Mumbai", latitude=18.9320, longitude=72.8260, risk_level="LOW", withdrawal_velocity=150000.0, active_incidents=0),
    }
    for atm in atms_dict.values():
        db.add(atm)

    # 2. Seed Officers/Users
    officer_user = models.User(
        username="officer1",
        name="Officer Rajesh K.",
        role="Senior Cybercrime Investigator",
        system_access="LEVEL 3 - JUDICIAL BLOCKCHAIN REGISTRY"
    )
    db.add(officer_user)
    db.commit()

    # 3. Rich Case Scenarios (20 Comprehensive Cases)
    case_scenarios = [
        # CASE 1: UPI Social Engineering (Primary demo case)
        {
            "case_id": "CF-2026-00421",
            "victim_name": "Ramesh Chandra",
            "victim_acc": "30291488102",
            "victim_bank": "State Bank of India",
            "fraud_type": "UPI Social Engineering",
            "amount": 100000.0,
            "priority": "CRITICAL",
            "assigned_officer": "Officer Rajesh K. (Cyber Division)",
            "mules": [
                {"number": "MULE-A457", "holder": "Mohammad Farooq", "bank": "Canara Bank", "ifsc": "CNRB0001042", "age": 45, "classification": "HIGH RISK", "factors": {"Rapid fund movement": 24, "Multiple unrelated senders": 19, "Short holding period": 15, "Transaction velocity": 22}},
                {"number": "MULE-B821", "holder": "Karan Malhotra", "bank": "Punjab National Bank", "ifsc": "PUNB0249100", "age": 20, "classification": "HIGH RISK", "factors": {"Transaction splitting": 18, "Unusual transaction amount": 17, "Rapid dispersal": 14}},
                {"number": "MULE-C912", "holder": "Sunil Dutt Gowda", "bank": "Union Bank of India", "ifsc": "UBIN0542318", "age": 10, "classification": "HIGH RISK", "factors": {"Rapid fund movement": 24, "Multiple unrelated senders": 19, "Transaction splitting": 14, "Unusual transaction amount": 17, "Short holding period": 11, "Location anomaly": 6}},
                {"number": "MULE-D441", "holder": "Deepak Verma", "bank": "State Bank of India", "ifsc": "SBIN0004412", "age": 15, "classification": "SUSPICIOUS", "factors": {"Unusual transaction amount": 12, "Short holding period": 10}}
            ],
            "txs": [
                {"id": "TXN-2026-90401", "from": "30291488102", "to": "MULE-A457", "amount": 100000.0, "type": "UPI", "risk": 99.0, "time_offset": 78},
                {"id": "TXN-2026-90402", "from": "MULE-A457", "to": "MULE-B821", "amount": 60000.0, "type": "IMPS", "risk": 78.0, "time_offset": 72},
                {"id": "TXN-2026-90403", "from": "MULE-A457", "to": "MULE-C912", "amount": 40000.0, "type": "IMPS", "risk": 85.0, "time_offset": 71},
                {"id": "TXN-2026-90404", "from": "MULE-B821", "to": "MULE-D441", "amount": 45000.0, "type": "IMPS", "risk": 72.0, "time_offset": 60},
                {"id": "TXN-2026-90405", "from": "MULE-B821", "to": "ATM-Z04", "amount": 15000.0, "type": "ATM_WITHDRAWAL", "risk": 68.0, "time_offset": 55},
                {"id": "TXN-2026-90406", "from": "MULE-C912", "to": "ATM-Z03", "amount": 26000.0, "type": "ATM_WITHDRAWAL", "risk": 95.0, "time_offset": 50},
                {"id": "TXN-2026-90407", "from": "MULE-C912", "to": "ATM-Z03", "amount": 14000.0, "type": "ATM_WITHDRAWAL", "risk": 95.0, "time_offset": 45}
            ],
            "predictions": [
                {"target": "MULE-C912", "prob": 0.78, "type": "NEXT_HOP", "mins": 15, "explanation": "Historical transition probability from B821 to C912 indicates high probability of fund movement."},
                {"target": "MULE-D441", "prob": 0.13, "type": "NEXT_HOP", "mins": 30, "explanation": "Secondary outflow channel to SBI account D441 observed in prior layering sequences."},
                {"target": "ATM-Z03", "prob": 0.82, "type": "CASH_OUT", "mins": 25, "explanation": "ATM-Z03 Dadar West shows high proximity matching and past cash-out velocity correlation."}
            ],
            "alerts": [
                {"id": "ALT-00421-01", "severity": "WARNING", "title": "Transaction Splitting Layer", "desc": "MULE-A457 split ₹1,00,000 incoming fraud funds into two outgoing transfers to B821 (₹60K) and C912 (₹40K).", "mule": "MULE-A457", "risk_amt": 100000.0, "offset": 71},
                {"id": "ALT-00421-02", "severity": "CRITICAL", "title": "Potential Cash-Out Window Imminent", "desc": "₹40,000 at risk of immediate ATM withdrawal at Cluster 03 (Dadar West) within 20–40 minutes.", "mule": "MULE-C912", "risk_amt": 40000.0, "offset": 50}
            ],
            "timeline": [
                {"step": 1, "title": "Complaint Registered", "desc": "Victim Ramesh Chandra filed fraud complaint at 10:32 AM via Cyber Portal."},
                {"step": 2, "title": "First Layer Inflow", "desc": "₹1,00,000 entered Canara Bank MULE-A457 from victim account."},
                {"step": 3, "title": "Risk Escalated to 99%", "desc": "Anomaly engine flagged high-velocity outbound transfer intent."},
                {"step": 4, "title": "Layering Splitting", "desc": "Funds partitioned into PNB MULE-B821 (₹60,000) and Union Bank MULE-C912 (₹40,000)."},
                {"step": 5, "title": "Dadar Cash-Out Target", "desc": "Cash-out prediction flagged ATM-Z03 Dadar West with 82% confidence."}
            ],
            "notes": [
                "Victim received fraudulent electricity bill payment link via SMS. Authorised ₹1,00,000 transfer.",
                "Canara Bank nodal officer informed. MULE-A457 holder identity suspected to be fabricated KYC.",
                "Dadar West local police station desk notified of potential ATM cash-out zone."
            ],
            "evidence": [
                {"title": "Victim Cyber Portal FIR Complaint", "desc": "Form 14A Cyber Crime Intake document with transaction hash.", "file_type": "PDF", "size": "1.8 MB"},
                {"title": "Canara Bank MULE-A457 Ledger Statement", "desc": "Extract showing zero-balance account receiving sudden ₹1 Lakh deposit.", "file_type": "CSV", "size": "450 KB"},
                {"title": "SMS Phishing Screenshot", "desc": "Lookalike electricity bill payment portal screen provided by victim.", "file_type": "PNG", "size": "2.4 MB"}
            ]
        },

        # CASE 2: Crypto Off-Ramp P2P Arbitrage (Web3 Hybrid Layering)
        {
            "case_id": "CF-2026-00422",
            "victim_name": "Priya Nair",
            "victim_acc": "70192837492",
            "victim_bank": "Axis Bank",
            "fraud_type": "Crypto On-Ramp Arbitrage",
            "amount": 320000.0,
            "priority": "CRITICAL",
            "assigned_officer": "Officer Rajesh K. (Cyber Division)",
            "mules": [
                {"number": "MULE-X701", "holder": "Harish Bose", "bank": "Punjab National Bank", "ifsc": "PUNB0192840", "age": 14, "classification": "HIGH RISK", "factors": {"Rapid fund movement": 24, "P2P Escrow conversion": 22}},
                {"number": "P2P-ESCROW-BINANCE", "holder": "Binance P2P Indian Bridge", "bank": "Virtual Crypto Merchant", "ifsc": "P2P0008812", "age": 300, "classification": "MERCHANT", "factors": {"High volume fiat to crypto bridge": 18}},
                {"number": "0x71C9284F91B8", "holder": "Tether TRC-20 Destination Wallet", "bank": "Polygon/Tron Blockchain", "ifsc": "TRC20_WALLET", "age": 2, "classification": "CRYPTO_WALLET", "factors": {"On-chain crypto off-ramp": 25, "Zero KYC wallet": 20}}
            ],
            "txs": [
                {"id": "TXN-2026-90411", "from": "70192837492", "to": "MULE-X701", "amount": 320000.0, "type": "IMPS", "risk": 94.0, "time_offset": 60},
                {"id": "TXN-2026-90412", "from": "MULE-X701", "to": "P2P-ESCROW-BINANCE", "amount": 320000.0, "type": "P2P_ESCROW", "risk": 92.0, "time_offset": 52},
                {"id": "TXN-2026-90413", "from": "P2P-ESCROW-BINANCE", "to": "0x71C9284F91B8", "amount": 320000.0, "type": "USDT_TRC20", "risk": 98.0, "time_offset": 45}
            ],
            "predictions": [
                {"target": "0x71C9284F91B8", "prob": 0.94, "type": "CRYPTO_BRIDGE", "mins": 10, "explanation": "Fiat converted into USDT (TRC-20) and sent to un-hosted external wallet."}
            ],
            "alerts": [
                {"id": "ALT-00422-01", "severity": "CRITICAL", "title": "Crypto Off-Ramp Intercept Alert", "desc": "₹3,20,000 converted via P2P Escrow to un-hosted wallet 0x71C9284F91B8.", "mule": "MULE-X701", "risk_amt": 320000.0, "offset": 50}
            ],
            "timeline": [
                {"step": 1, "title": "P2P Escrow Fraud Inflow", "desc": "Victim induced to transfer ₹3,20,000 for fake crypto arbitrage high-yield program."},
                {"step": 2, "title": "On-Chain USDT Conversion", "desc": "MULE-X701 purchased 3,850 USDT transferred to Tron/Ethereum wallet 0x71C9284F91B8."}
            ],
            "notes": [
                "Blockchain wallet 0x71C9284F91B8 placed under on-chain transaction monitoring."
            ],
            "evidence": [
                {"title": "On-Chain Transaction Receipt - USDT Transfer", "desc": "Blockchain block explorer hash showing 3,850 USDT transfer.", "file_type": "JSON", "size": "120 KB"}
            ]
        }
    ]

    # Add 18 more realistic synthetic cases
    for i in range(3, 21):
        c_num = f"{i:03d}"
        v_first = INDIAN_FIRST_NAMES[i % len(INDIAN_FIRST_NAMES)]
        v_last = INDIAN_LAST_NAMES[i % len(INDIAN_LAST_NAMES)]
        v_name = f"{v_first} {v_last}"
        v_bank, v_ifsc = BANKS[i % len(BANKS)]
        v_acc = f"50{random.randint(100000000, 999999999)}"
        f_type = [
            "Part-Time Task Scam", "Telegram Loan Fraud", "Fake Investment Scam", 
            "Utility Bill Electricity Fraud", "SMS Phishing & SIM Swap", "Credit Card Rewards Cloning",
            "Customs Clearance Impersonation", "Dating App Honeytrap Scam", "Tech Support Remote Access"
        ][i % 9]
        amt = float(random.choice([45000, 80000, 120000, 175000, 250000, 380000, 500000]))
        atm_target = ATM_LIST[i % len(ATM_LIST)]
        m_num = f"MULE-K{100+i}"
        m_holder = f"{INDIAN_FIRST_NAMES[(i+5) % len(INDIAN_FIRST_NAMES)]} {INDIAN_LAST_NAMES[(i+5) % len(INDIAN_LAST_NAMES)]}"
        m_bank, m_ifsc = BANKS[(i+2) % len(BANKS)]

        case_scenarios.append({
            "case_id": f"CF-2026-{c_num}",
            "victim_name": v_name,
            "victim_acc": v_acc,
            "victim_bank": v_bank,
            "fraud_type": f_type,
            "amount": amt,
            "priority": "CRITICAL" if amt >= 150000 else "HIGH",
            "assigned_officer": "Officer Rajesh K. (Cyber Division)",
            "mules": [
                {"number": m_num, "holder": m_holder, "bank": m_bank, "ifsc": f"{m_ifsc}000{random.randint(1000,9999)}", "age": random.randint(10, 60), "classification": "HIGH RISK", "factors": {"Rapid fund movement": 24, "Multiple unrelated senders": 19, "Transaction velocity": 20}}
            ],
            "txs": [
                {"id": f"TXN-2026-{90000+i*10+1}", "from": v_acc, "to": m_num, "amount": amt, "type": "UPI", "risk": 92.0, "time_offset": 50},
                {"id": f"TXN-2026-{90000+i*10+2}", "from": m_num, "to": atm_target, "amount": amt * 0.8, "type": "ATM_WITHDRAWAL", "risk": 95.0, "time_offset": 30}
            ],
            "predictions": [
                {"target": atm_target, "prob": 0.85, "type": "CASH_OUT", "mins": 25, "explanation": f"High velocity flow towards {atm_target} terminal."}
            ],
            "alerts": [
                {"id": f"ALT-{c_num}-01", "severity": "CRITICAL", "title": "Rapid Cash-Out Target", "desc": f"₹{amt:,.0f} flagged moving to {atm_target}.", "mule": m_num, "risk_amt": amt, "offset": 30}
            ],
            "timeline": [
                {"step": 1, "title": "Fraud Detected", "desc": f"Victim {v_name} transferred ₹{amt:,.0f} via fraudulent channel."},
                {"step": 2, "title": "Layering Intercept", "desc": f"Funds routed to {m_num} ({m_bank})."}
            ],
            "notes": [f"Case registered under SIH26184 monitoring. Target account {m_num} flagged."],
            "evidence": [
                {"title": "Victim Transaction Statement", "desc": f"Bank statement verifying debit of ₹{amt:,.0f}.", "file_type": "PDF", "size": "1.2 MB"}
            ]
        })

    # 4. Insert Cases and Related Entities
    for case_data in case_scenarios:
        db_case = models.Case(
            case_id=case_data["case_id"],
            victim_ref=case_data["victim_acc"],
            fraud_type=case_data["fraud_type"],
            amount=case_data["amount"],
            current_status="ACTIVE",
            risk_score=91.0 if case_data["amount"] >= 100000 else 78.0,
            assigned_officer=case_data.get("assigned_officer", "Officer Rajesh K. (Cyber Division)"),
            last_activity="Active Intercept",
            priority=case_data.get("priority", "CRITICAL"),
            created_at=datetime.utcnow() - timedelta(minutes=120)
        )
        db.add(db_case)
        db.commit()

        # Create Victim
        db_victim = models.Victim(
            victim_id=f"VIC-{case_data['case_id'].split('-')[-1]}",
            case_id=case_data["case_id"],
            name=case_data["victim_name"],
            account_number=case_data["victim_acc"],
            bank_name=case_data["victim_bank"],
            report_timestamp=datetime.utcnow() - timedelta(minutes=90),
            city="Mumbai, Maharashtra",
            phone=f"+91 {random.randint(7000000000, 9999999999)}"
        )
        db.add(db_victim)

        # Create Victim Account
        db_victim_acc = models.Account(
            account_number=case_data["victim_acc"],
            holder_name=case_data["victim_name"],
            bank_name=case_data["victim_bank"],
            ifsc_code=f"{case_data['victim_bank'][:4].upper()}0001824",
            account_age_days=1420,
            current_balance=25000.0,
            risk_score=5.0,
            classification="VICTIM",
            risk_factors={},
            is_mule=False,
            is_watchlist=False,
            is_frozen=False,
            linked_case_id=case_data["case_id"]
        )
        db.add(db_victim_acc)

        # Create Mule Accounts
        for m in case_data["mules"]:
            db_mule = models.Account(
                account_number=m["number"],
                holder_name=m["holder"],
                bank_name=m["bank"],
                ifsc_code=m["ifsc"],
                account_age_days=m["age"],
                current_balance=case_data["amount"] * 0.4,
                risk_score=95.0 if "HIGH" in m["classification"] or "CRYPTO" in m["classification"] else 65.0,
                classification=m["classification"],
                risk_factors=m["factors"],
                is_mule=m["classification"] != "VICTIM",
                is_watchlist=True,
                is_frozen=False,
                linked_case_id=case_data["case_id"]
            )
            db.add(db_mule)

        # Create Transactions
        for t in case_data["txs"]:
            db_tx = models.Transaction(
                transaction_id=t["id"],
                sender_account=t["from"],
                receiver_account=t["to"],
                amount=t["amount"],
                timestamp=datetime.utcnow() - timedelta(minutes=t["time_offset"]),
                transaction_type=t["type"],
                risk_score=t["risk"],
                is_simulated=False,
                status="COMPLETED",
                linked_case_id=case_data["case_id"]
            )
            db.add(db_tx)

        # Create Predictions
        for p in case_data["predictions"]:
            db_pred = models.Prediction(
                prediction_id=f"PRED-{case_data['case_id'].split('-')[-1]}-{uuid.uuid4().hex[:4].upper()}",
                case_id=case_data["case_id"],
                source_account=case_data["mules"][0]["number"],
                target_entity=p["target"],
                probability=p["prob"],
                predicted_type=p["type"],
                time_window_mins=p["mins"],
                factors={"Markov_Transition": p["prob"], "Velocity_Timing": 0.88},
                explanation=p["explanation"]
            )
            db.add(db_pred)

        # Create Alerts
        for a in case_data["alerts"]:
            db_alert = models.Alert(
                alert_id=a["id"],
                case_id=case_data["case_id"],
                severity=a["severity"],
                title=a["title"],
                description=a["desc"],
                account_number=a["mule"],
                amount_at_risk=a["risk_amt"],
                timestamp=datetime.utcnow() - timedelta(minutes=a["offset"]),
                status="ACTIVE"
            )
            db.add(db_alert)

        # Create Timeline Events
        for ev in case_data["timeline"]:
            db_ev = models.InvestigationEvent(
                event_id=f"EVT-{case_data['case_id'].split('-')[-1]}-{ev['step']}",
                case_id=case_data["case_id"],
                step_num=ev["step"],
                title=ev["title"],
                description=ev["desc"],
                timestamp=datetime.utcnow() - timedelta(minutes=100 - ev["step"] * 10)
            )
            db.add(db_ev)

        # Create Notes
        for idx, note_text in enumerate(case_data.get("notes", [])):
            db_note = models.InvestigationNote(
                note_id=f"NOTE-{case_data['case_id'].split('-')[-1]}-{idx+1}",
                case_id=case_data["case_id"],
                officer=case_data.get("assigned_officer", "Officer Rajesh K."),
                content=note_text,
                category="INTELLIGENCE",
                timestamp=datetime.utcnow() - timedelta(minutes=60 - idx * 15)
            )
            db.add(db_note)

        # Create Evidence Records
        for idx, ev_item in enumerate(case_data.get("evidence", [])):
            ev_content = f"{case_data['case_id']}:{ev_item['title']}:{ev_item['desc']}"
            import hashlib
            sha_hash = f"SHA256:{hashlib.sha256(ev_content.encode('utf-8')).hexdigest().upper()}"
            ipfs_cid = f"bafybeic{sha_hash[7:39].lower()}vigilant"

            db_evidence = models.Evidence(
                evidence_id=f"EVD-{case_data['case_id'].split('-')[-1]}-{idx+1}",
                case_id=case_data["case_id"],
                title=ev_item["title"],
                description=ev_item["desc"],
                file_type=ev_item["file_type"],
                file_size=ev_item.get("size", "1.2 MB"),
                hash_checksum=sha_hash,
                ipfs_cid=ipfs_cid,
                timestamp=datetime.utcnow() - timedelta(minutes=80 - idx * 20)
            )
            db.add(db_evidence)

    # 5. Seed Watchlist Accounts
    watchlist_seeds = [
        {"acc": "MULE-A457", "holder": "Mohammad Farooq", "bank": "Canara Bank", "reason": "High-velocity layer-1 mule in Case CF-2026-00421", "risk": "CRITICAL"},
        {"acc": "MULE-C912", "holder": "Sunil Dutt Gowda", "bank": "Union Bank of India", "reason": "Terminal cash-out relay account near Dadar cluster", "risk": "CRITICAL"},
        {"acc": "0x71C9284F91B8", "holder": "Tether TRC-20 Wallet", "bank": "Polygon/Tron Blockchain", "reason": "Crypto P2P un-hosted off-ramp wallet", "risk": "CRITICAL"}
    ]
    for w in watchlist_seeds:
        wl_item = models.WatchlistAccount(
            account_number=w["acc"],
            holder_name=w["holder"],
            bank_name=w["bank"],
            added_by="Officer Rajesh K. (Cyber Division)",
            reason=w["reason"],
            risk_level=w["risk"],
            active=True,
            added_at=datetime.utcnow() - timedelta(hours=3)
        )
        db.add(wl_item)

    # 6. Seed Blockchain Audit Ledger with Canonical Hashes & Smart Contract Receipts
    audit_events = [
        {"action": "GENESIS_BLOCK_INITIALIZED", "case": None, "details": "National Blockchain Forensic Inter-Agency Ledger Genesis block created on Hyperledger Besu."},
        {"action": "SESSION_INITIALIZED", "case": None, "details": "Officer Rajesh K. logged in via Level 3 Cyber Intelligence Gateway."},
        {"action": "CASE_OPENED", "case": "CF-2026-00421", "details": "Opened Case CF-2026-00421 (UPI Social Engineering) for active investigation."},
        {"action": "PREDICTION_REFRESHED", "case": "CF-2026-00421", "details": "Recalculated Markov next-hop transition probabilities for MULE-B821."},
        {"action": "WATCHLIST_ADDED", "case": "CF-2026-00421", "details": "Added MULE-C912 to national proactive surveillance watchlist."},
        {"action": "EVIDENCE_ANCHORED", "case": "CF-2026-00421", "details": "Anchored FIR Intake Statement (SHA-256 Checksum) to on-chain ledger."},
        {"action": "ATM_CLUSTER_GEOCODED", "case": "CF-2026-00421", "details": "Mapped ATM Cluster 03 (Dadar West) cash-out risk window: 20-40 min."}
    ]

    for a in audit_events:
        record_audit_event(
            db=db,
            action=a["action"],
            details=a["details"],
            case_id=a["case"],
            officer="Officer Rajesh K."
        )

    db.commit()
    db.close()
    print("Database seeding completed with 20 Cases and Hyperledger Besu Blockchain Ledger!")

if __name__ == "__main__":
    seed_db()
