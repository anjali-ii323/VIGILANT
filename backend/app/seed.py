import random
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from . import models
from .ml.risk_engine import recalculate_account_risk

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

FRAUD_TYPES = [
    "UPI Social Engineering",
    "Fake Investment Scam",
    "Part-Time Task Scam",
    "Telegram Loan Fraud",
    "Multiple Victims Convergence",
    "Transaction Splitting & Structuring",
    "Crypto On-Ramp Arbitrage",
    "Utility Bill Electricity Fraud",
    "Dating App Honeytrap Scam",
    "Tech Support Remote Access Extortion",
    "SMS Phishing & SIM Swap",
    "Credit Card Rewards Cloning",
    "Customs Clearance Impersonation",
    "Fake Travel Booking Portal",
    "Real Estate Lease Fraud"
]

ATM_LIST = ["ATM-Z03", "ATM-Z11", "ATM-Z07", "ATM-Z09", "ATM-Z05", "ATM-Z14", "ATM-Z18", "ATM-Z22"]

def generate_indian_phone():
    return f"+91 {random.randint(6, 9)}{random.randint(100000000, 999999999)}"

def seed_db():
    db = SessionLocal()
    
    # Drop and recreate all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    print("Re-creating entities and seeding rich synthetic dataset...")

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
        system_access="LEVEL 3 - NATIONAL FRAUD REGISTRY"
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

        # CASE 2: Fake Investment Scam (High-value)
        {
            "case_id": "CF-2026-00422",
            "victim_name": "Kishore Kumar",
            "victim_acc": "30921477401",
            "victim_bank": "ICICI Bank",
            "fraud_type": "Fake Investment Scam",
            "amount": 240000.0,
            "priority": "CRITICAL",
            "assigned_officer": "Officer Sanjay M.",
            "mules": [
                {"number": "MULE-M221", "holder": "Nitesh Patel", "bank": "HDFC Bank", "ifsc": "HDFC0001221", "age": 12, "classification": "HIGH RISK", "factors": {"Large amount spike": 26, "Multiple recipients": 20, "Velocity anomaly": 18}},
                {"number": "MULE-M874", "holder": "Preeti Sen", "bank": "ICICI Bank", "ifsc": "ICIC0000874", "age": 8, "classification": "HIGH RISK", "factors": {"Rapid fund dispersal": 22, "Short holding window": 15}},
                {"number": "MULE-M991", "holder": "Vikrant Bose", "bank": "Axis Bank", "ifsc": "UTIB0000991", "age": 5, "classification": "HIGH RISK", "factors": {"ATM withdrawal linkage": 25, "Layering ratio": 18}}
            ],
            "txs": [
                {"id": "TXN-2026-90501", "from": "30921477401", "to": "MULE-M221", "amount": 240000.0, "type": "IMPS", "risk": 99.0, "time_offset": 120},
                {"id": "TXN-2026-90502", "from": "MULE-M221", "to": "MULE-M874", "amount": 150000.0, "type": "IMPS", "risk": 82.0, "time_offset": 110},
                {"id": "TXN-2026-90503", "from": "MULE-M221", "to": "MULE-M991", "amount": 90000.0, "type": "IMPS", "risk": 75.0, "time_offset": 105},
                {"id": "TXN-2026-90504", "from": "MULE-M874", "to": "ATM-Z11", "amount": 80000.0, "type": "ATM_WITHDRAWAL", "risk": 93.0, "time_offset": 90},
                {"id": "TXN-2026-90505", "from": "MULE-M991", "to": "ATM-Z11", "amount": 45000.0, "type": "ATM_WITHDRAWAL", "risk": 88.0, "time_offset": 85}
            ],
            "predictions": [
                {"target": "ATM-Z11", "prob": 0.88, "type": "CASH_OUT", "mins": 30, "explanation": "High withdrawal velocity logged at Bandra Reclamation ATM Cluster 11."},
                {"target": "MULE-M991", "prob": 0.23, "type": "NEXT_HOP", "mins": 45, "explanation": "Linked IP logins suggest secondary transfers to M991 are active."}
            ],
            "alerts": [
                {"id": "ALT-00422-01", "severity": "CRITICAL", "title": "Large Splitting Triggered", "desc": "MULE-M221 divided ₹2.4 Lakh into M874 and M991 within 15 minutes.", "mule": "MULE-M221", "risk_amt": 240000.0, "offset": 108},
                {"id": "ALT-00422-02", "severity": "CRITICAL", "title": "Bandra ATM Threat Active", "desc": "Withdrawal spike detected at ATM-Z11 linked to Axis MULE-M991.", "mule": "MULE-M991", "risk_amt": 45000.0, "offset": 86}
            ],
            "timeline": [
                {"step": 1, "title": "High Value Fraud Complaint", "desc": "Kishore Kumar reported loss of ₹2,40,000 on WhatsApp fake IPO portal."},
                {"step": 2, "title": "HDFC Entry", "desc": "Funds transferred to Nitesh Patel HDFC account MULE-M221."},
                {"step": 3, "title": "M221 Evaluated", "desc": "Risk rating hits 99% due to rapid ledger depletion."},
                {"step": 4, "title": "Bandra ATM Cash-Out", "desc": "ATM withdrawals logged at Bandra Reclamation Cluster 11."}
            ],
            "notes": [
                "Victim lured under pretense of guaranteed institutional IPO returns. Initiated transfer from ICICI.",
                "Requested freeze lock to HDFC Bank and Axis Bank fraud control divisions."
            ],
            "evidence": [
                {"title": "WhatsApp Fraud Group Chat Export", "desc": "Chat transcripts showing impersonation of SEBI-registered broker.", "file_type": "PDF", "size": "3.1 MB"},
                {"title": "Bank Transaction UTR Receipt", "desc": "ICICI IMPS transfer confirmation slip for ₹2,40,000.", "file_type": "PDF", "size": "820 KB"}
            ]
        },

        # CASE 3: Telegram Task Fraud
        {
            "case_id": "CF-2026-00423",
            "victim_name": "Arvind Swamy",
            "victim_acc": "30451122891",
            "victim_bank": "Union Bank of India",
            "fraud_type": "Part-Time Task Scam",
            "amount": 75000.0,
            "priority": "HIGH",
            "assigned_officer": "Inspector Neha G.",
            "mules": [
                {"number": "MULE-K102", "holder": "Gautam Rao", "bank": "State Bank of India", "ifsc": "SBIN0000102", "age": 25, "classification": "HIGH RISK", "factors": {"Rapid fund dispersal": 22, "Multiple recipients": 18}},
                {"number": "MULE-K447", "holder": "Dinesh Joshi", "bank": "Bank of Baroda", "ifsc": "BARB0MANDVI", "age": 14, "classification": "HIGH RISK", "factors": {"ATM withdrawal linkage": 20, "Velocity spike": 16}},
                {"number": "MULE-K882", "holder": "Meena Iyer", "bank": "Canara Bank", "ifsc": "CNRB0001002", "age": 9, "classification": "SUSPICIOUS", "factors": {"Unusual transaction amount": 15}}
            ],
            "txs": [
                {"id": "TXN-2026-90601", "from": "30451122891", "to": "MULE-K102", "amount": 75000.0, "type": "UPI", "risk": 91.0, "time_offset": 95},
                {"id": "TXN-2026-90602", "from": "MULE-K102", "to": "MULE-K447", "amount": 45000.0, "type": "IMPS", "risk": 74.0, "time_offset": 88},
                {"id": "TXN-2026-90603", "from": "MULE-K102", "to": "MULE-K882", "amount": 30000.0, "type": "IMPS", "risk": 71.0, "time_offset": 87},
                {"id": "TXN-2026-90604", "from": "MULE-K447", "to": "ATM-Z07", "amount": 20000.0, "type": "ATM_WITHDRAWAL", "risk": 82.0, "time_offset": 80}
            ],
            "predictions": [
                {"target": "ATM-Z07", "prob": 0.74, "type": "CASH_OUT", "mins": 15, "explanation": "Kurla East ATM-Z07 displays high matching withdrawn signatures."},
                {"target": "MULE-K882", "prob": 0.20, "type": "NEXT_HOP", "mins": 25, "explanation": "Further transfers to K882 suspected to balance remaining IMPS layers."}
            ],
            "alerts": [
                {"id": "ALT-00423-01", "severity": "WARNING", "title": "Part-Time Task Splitting", "desc": "₹75,000 entry in SBI MULE-K102 split into BOB and Canara accounts.", "mule": "MULE-K102", "risk_amt": 75000.0, "offset": 88},
                {"id": "ALT-00423-02", "severity": "CRITICAL", "title": "Kurla Cash-Out Active", "desc": "Withdrawal of ₹20,000 flagged at Kurla ATM-Z07.", "mule": "MULE-K447", "risk_amt": 20000.0, "offset": 79}
            ],
            "timeline": [
                {"step": 1, "title": "Telegram Task Fraud complaint", "desc": "Victim Arvind Swamy defrauded under 'Telegram hotel rating' job scheme."},
                {"step": 2, "title": "SBI Injection", "desc": "₹75,000 deposited in SBI MULE-K102."},
                {"step": 3, "title": "Kurla East Withdrawals", "desc": "Partial cash-out observed at ATM-Z07 Kurla East."}
            ],
            "notes": [
                "Victim performed hotel reviews tasks on Telegram portal, paid escalating security deposits.",
                "Traced cash-out location to Kurla. CCTV footage request submitted to BOB Dadar branch."
            ],
            "evidence": [
                {"title": "Telegram Task Chat Screenshots", "desc": "Screenshots of fake job manager assigning rating tasks.", "file_type": "PNG", "size": "1.5 MB"}
            ]
        },

        # CASE 4: Multiple Victims Convergence (Fan-in topology)
        {
            "case_id": "CF-2026-00424",
            "victim_name": "Lata Mangeshkar",
            "victim_acc": "30114995208",
            "victim_bank": "Axis Bank",
            "fraud_type": "Multiple Victims Convergence",
            "amount": 230000.0,
            "priority": "CRITICAL",
            "assigned_officer": "Inspector Neha G.",
            "mules": [
                {"number": "MULE-L309", "holder": "Vijay Grover", "bank": "Union Bank of India", "ifsc": "UBIN0538129", "age": 18, "classification": "HIGH RISK", "factors": {"Multiple unrelated senders": 28, "Convergence anomaly": 25, "Velocity spike": 20}},
                {"number": "MULE-L511", "holder": "Gauri Patil", "bank": "Punjab National Bank", "ifsc": "PUNB0511000", "age": 15, "classification": "HIGH RISK", "factors": {"Large single cash-out": 26, "Rapid holding exit": 20}}
            ],
            "txs": [
                {"id": "TXN-2026-90701", "from": "30114995208", "to": "MULE-L309", "amount": 100000.0, "type": "UPI", "risk": 95.0, "time_offset": 100},
                {"id": "TXN-2026-90702", "from": "VIC-ACC-424B", "to": "MULE-L309", "amount": 80000.0, "type": "UPI", "risk": 95.0, "time_offset": 90},
                {"id": "TXN-2026-90703", "from": "VIC-ACC-424C", "to": "MULE-L309", "amount": 50000.0, "type": "UPI", "risk": 95.0, "time_offset": 85},
                {"id": "TXN-2026-90704", "from": "MULE-L309", "to": "MULE-L511", "amount": 210000.0, "type": "IMPS", "risk": 98.0, "time_offset": 52},
                {"id": "TXN-2026-90705", "from": "MULE-L511", "to": "ATM-Z09", "amount": 190000.0, "type": "ATM_WITHDRAWAL", "risk": 99.0, "time_offset": 45}
            ],
            "predictions": [
                {"target": "ATM-Z09", "prob": 0.91, "type": "CASH_OUT", "mins": 20, "explanation": "ATM-Z09 Andheri West shows high activity correlations linked to PNB MULE-L511."}
            ],
            "alerts": [
                {"id": "ALT-00424-01", "severity": "CRITICAL", "title": "Multiple Victims Convergence", "desc": "MULE-L309 receives convergent payments from 3 distinct, unrelated bank accounts within 15 minutes.", "mule": "MULE-L309", "risk_amt": 230000.0, "offset": 80},
                {"id": "ALT-00424-02", "severity": "CRITICAL", "title": "Andheri West ATM Spike", "desc": "MULE-L511 withdrew ₹1,90,000 cash at Andheri Station ATM Cluster 09.", "mule": "MULE-L511", "risk_amt": 190000.0, "offset": 46}
            ],
            "timeline": [
                {"step": 1, "title": "Convergent Scam Complaint", "desc": "Multiple victim reports logged at NCRP targeting account UBI MULE-L309."},
                {"step": 2, "title": "Multiple Inflows", "desc": "₹1,00,000, ₹80,000 and ₹50,000 entered UBI MULE-L309 from distinct sources."},
                {"step": 3, "title": "Risk Anomaly Flagged", "desc": "Mule L309 risk rating hit critical due to convergence logic (+28 senders)."},
                {"step": 4, "title": "Andheri West Cash Out", "desc": "Immediate cash withdrawals detected at Andheri Station ATM."}
            ],
            "notes": [
                "Unusually high sender count convergence. Standard signature of organized mule renting syndicate.",
                "Andheri ATM CCTV coordinates requested from PNB nodal desk."
            ],
            "evidence": [
                {"title": "Multi-Complainant NCRP Dossier", "desc": "Consolidated complaints report from 3 independent victims.", "file_type": "PDF", "size": "4.2 MB"}
            ]
        },

        # CASE 5: Transaction Splitting (Structuring / Smurfing)
        {
            "case_id": "CF-2026-00425",
            "victim_name": "Sachin Tendulkar",
            "victim_acc": "30521480109",
            "victim_bank": "State Bank of India",
            "fraud_type": "Transaction Splitting & Structuring",
            "amount": 350000.0,
            "priority": "CRITICAL",
            "assigned_officer": "Officer Rajesh K.",
            "mules": [
                {"number": "MULE-S501", "holder": "Jyoti Mishra", "bank": "Axis Bank", "ifsc": "UTIB0000501", "age": 30, "classification": "HIGH RISK", "factors": {"Transaction splitting": 28, "Structuring evasion": 24, "Velocity anomaly": 20}},
                {"number": "MULE-S702", "holder": "Manoj Deshmukh", "bank": "HDFC Bank", "ifsc": "HDFC0000702", "age": 14, "classification": "HIGH RISK", "factors": {"Layering hop": 18}},
                {"number": "MULE-S803", "holder": "Dev Pandey", "bank": "ICICI Bank", "ifsc": "ICIC0000803", "age": 22, "classification": "HIGH RISK", "factors": {"ATM withdrawal linkage": 22}},
                {"number": "MULE-S904", "holder": "Nisha Verma", "bank": "Canara Bank", "ifsc": "CNRB0001904", "age": 11, "classification": "HIGH RISK", "factors": {"Split recipient": 16}}
            ],
            "txs": [
                {"id": "TXN-2026-90801", "from": "30521480109", "to": "MULE-S501", "amount": 350000.0, "type": "UPI", "risk": 99.0, "time_offset": 150},
                {"id": "TXN-2026-90802", "from": "MULE-S501", "to": "MULE-S702", "amount": 100000.0, "type": "RTGS", "risk": 88.0, "time_offset": 140},
                {"id": "TXN-2026-90803", "from": "MULE-S501", "to": "MULE-S803", "amount": 120000.0, "type": "IMPS", "risk": 82.0, "time_offset": 138},
                {"id": "TXN-2026-90805", "from": "MULE-S501", "to": "MULE-S904", "amount": 80000.0, "type": "IMPS", "risk": 82.0, "time_offset": 135},
                {"id": "TXN-2026-90804", "from": "MULE-S803", "to": "ATM-Z05", "amount": 90000.0, "type": "ATM_WITHDRAWAL", "risk": 94.0, "time_offset": 120}
            ],
            "predictions": [
                {"target": "ATM-Z05", "prob": 0.85, "type": "CASH_OUT", "mins": 40, "explanation": "ATM-Z05 Borivali West coordinates show withdrawals matching structuring patterns."},
                {"target": "MULE-S904", "prob": 0.15, "type": "NEXT_HOP", "mins": 30, "explanation": "Remaining Axis balance likely transferring to ICICI MULE-S904."}
            ],
            "alerts": [
                {"id": "ALT-00425-01", "severity": "CRITICAL", "title": "Structuring Splitting Detected", "desc": "₹3.5 Lakh split into multiple sub-₹1.2L deposits to evade standard automated compliance triggers.", "mule": "MULE-S501", "risk_amt": 350000.0, "offset": 138},
                {"id": "ALT-00425-02", "severity": "CRITICAL", "title": "Borivali Cash-Out Threat", "desc": "RTGS routing to Borivali West ATM Z05 mapped at ₹90,000.", "mule": "MULE-S803", "risk_amt": 90000.0, "offset": 121}
            ],
            "timeline": [
                {"step": 1, "title": "Structuring Complaint Filed", "desc": "KYC update netbanking SMS fraud reported by victim."},
                {"step": 2, "title": "Axis Inflow", "desc": "₹3.5 Lakh deposited into Axis MULE-S501."},
                {"step": 3, "title": "Structuring/Splitting", "desc": "Funds split out to MULE-S702 (₹100K), MULE-S803 (₹120K), MULE-S904 (₹80K)."},
                {"step": 4, "title": "Borivali Cash Out", "desc": "ATM cash-out logged at Borivali Cluster 05."}
            ],
            "notes": [
                "Victim entered credentials on lookalike netbanking page. RTGS initiated shortly after.",
                "Nodal officer coordinates dispatched to Borivali police station check post."
            ],
            "evidence": [
                {"title": "Phishing Domain WHOIS Analysis", "desc": "Lookup revealing domain registered 48 hours prior in offshore hosting.", "file_type": "PDF", "size": "1.1 MB"}
            ]
        }
    ]

    # Generate additional cases 6 to 20 to complete the 20 Cases requirement
    for i in range(26, 41):
        case_id = f"CF-2026-004{i}"
        v_name = f"{random.choice(INDIAN_FIRST_NAMES)} {random.choice(INDIAN_LAST_NAMES)}"
        v_acc = f"30{i}148{random.randint(10000, 99999)}"
        bank_name, ifsc_prefix = random.choice(BANKS)
        amount = float(80000 + (i - 25) * 15000)
        f_type = FRAUD_TYPES[(i - 26) % len(FRAUD_TYPES)]
        atm_id = ATM_LIST[i % len(ATM_LIST)]
        atm_loc = atms_dict[atm_id].location_name

        mule_a = f"MULE-{i}A"
        mule_b = f"MULE-{i}B"
        mule_c = f"MULE-{i}C"

        c_scenario = {
            "case_id": case_id,
            "victim_name": v_name,
            "victim_acc": v_acc,
            "victim_bank": bank_name,
            "fraud_type": f_type,
            "amount": amount,
            "priority": "CRITICAL" if amount > 150000 else "HIGH" if amount > 100000 else "MEDIUM",
            "assigned_officer": "Officer Rajesh K.",
            "mules": [
                {"number": mule_a, "holder": f"{random.choice(INDIAN_FIRST_NAMES)} {random.choice(INDIAN_LAST_NAMES)}", "bank": "Canara Bank", "ifsc": "CNRB0002104", "age": 28, "classification": "HIGH RISK", "factors": {"Rapid fund movement": 22, "Layering hop": 18}},
                {"number": mule_b, "holder": f"{random.choice(INDIAN_FIRST_NAMES)} {random.choice(INDIAN_LAST_NAMES)}", "bank": "Union Bank", "ifsc": "UBIN0532415", "age": 14, "classification": "HIGH RISK", "factors": {"Multiple transfers": 19, "Short holding time": 14}},
                {"number": mule_c, "holder": f"{random.choice(INDIAN_FIRST_NAMES)} {random.choice(INDIAN_LAST_NAMES)}", "bank": "State Bank of India", "ifsc": "SBIN0001092", "age": 9, "classification": "HIGH RISK", "factors": {"ATM withdrawal linkage": 25, "Velocity anomaly": 17}}
            ],
            "txs": [
                {"id": f"TXN-2026-{i}01", "from": v_acc, "to": mule_a, "amount": amount, "type": "UPI", "risk": 92.0, "time_offset": 50},
                {"id": f"TXN-2026-{i}02", "from": mule_a, "to": mule_b, "amount": round(amount * 0.65, 2), "type": "IMPS", "risk": 78.0, "time_offset": 45},
                {"id": f"TXN-2026-{i}03", "from": mule_b, "to": mule_c, "amount": round(amount * 0.45, 2), "type": "IMPS", "risk": 82.0, "time_offset": 40},
                {"id": f"TXN-2026-{i}04", "from": mule_c, "to": atm_id, "amount": round(amount * 0.35, 2), "type": "ATM_WITHDRAWAL", "risk": 88.0, "time_offset": 30}
            ],
            "predictions": [
                {"target": atm_id, "prob": round(0.70 + (i % 15) / 100, 2), "type": "CASH_OUT", "mins": 20 + (i % 25), "explanation": f"Targeted ATM {atm_loc} based on access profiles and historical cash-out velocities."}
            ],
            "alerts": [
                {"id": f"ALT-{i}-01", "severity": "WARNING", "title": "Suspicious Mule Linkage", "desc": f"Mule account {mule_a} linked to {f_type} complaint.", "mule": mule_a, "risk_amt": amount, "offset": 48},
                {"id": f"ALT-{i}-02", "severity": "CRITICAL", "title": f"Cash-Out Alert: {atm_id}", "desc": f"Potential cash-out detected at {atm_loc} from {mule_c}.", "mule": mule_c, "risk_amt": round(amount * 0.35, 2), "offset": 32}
            ],
            "timeline": [
                {"step": 1, "title": "Incident Logged", "desc": f"Registered {f_type} incident reported by {v_name}."},
                {"step": 2, "title": "Mule chain activity", "desc": f"Funds routed to layering mule network {mule_a} -> {mule_b} -> {mule_c}."},
                {"step": 3, "title": "Cash-Out Predicted", "desc": f"High risk cash-out predicted at {atm_loc}."}
            ],
            "notes": [f"KYC registries and IP access logs requested from banking nodal desks for case {case_id}."],
            "evidence": [
                {"title": "Initial Complaint Intake Record", "desc": f"Citizen complaint receipt for {f_type}.", "file_type": "PDF", "size": "1.4 MB"}
            ]
        }
        case_scenarios.append(c_scenario)

    # 4. Insert all Seed Records
    print("Writing cases, accounts, transactions, and evidence...")
    accounts_written = {}
    
    for case_data in case_scenarios:
        # Create Case
        case = models.Case(
            case_id=case_data["case_id"],
            victim_ref=f"VIC-{case_data['case_id'].split('-')[-1]}",
            fraud_type=case_data["fraud_type"],
            amount=case_data["amount"],
            current_status="ACTIVE",
            risk_score=91.0 if case_data["case_id"] == "CF-2026-00421" else 88.0 if case_data["case_id"] == "CF-2026-00422" else 78.0,
            assigned_officer=case_data.get("assigned_officer", "Officer Rajesh K."),
            last_activity="Intelligence Live",
            priority=case_data.get("priority", "HIGH"),
            created_at=datetime.utcnow() - timedelta(minutes=150)
        )
        db.add(case)

        # Create Victim References
        victim = models.VictimReference(
            victim_id=f"VIC-{case_data['case_id'].split('-')[-1]}",
            name=case_data["victim_name"],
            phone=generate_indian_phone(),
            bank_name=case_data["victim_bank"],
            account_number=case_data["victim_acc"],
            disputed_amount=case_data["amount"],
            report_timestamp=datetime.utcnow() - timedelta(minutes=150)
        )
        db.add(victim)

        # Create Victim Account in Accounts registry
        if case_data["victim_acc"] not in accounts_written:
            vic_acc = models.Account(
                account_number=case_data["victim_acc"],
                holder_name=case_data["victim_name"],
                bank_name=case_data["victim_bank"],
                ifsc_code="SBIN0001020",
                phone_number=generate_indian_phone(),
                risk_score=5.0,
                classification="SAFE",
                is_mule=False,
                created_at=datetime.utcnow() - timedelta(days=1000)
            )
            db.add(vic_acc)
            accounts_written[case_data["victim_acc"]] = vic_acc

        # Create Mules
        for m in case_data["mules"]:
            if m["number"] not in accounts_written:
                mule_acc = models.Account(
                    account_number=m["number"],
                    holder_name=m["holder"],
                    bank_name=m["bank"],
                    ifsc_code=m["ifsc"],
                    phone_number=generate_indian_phone(),
                    risk_score=85.0 if "HIGH" in m.get("classification", "HIGH") else 55.0,
                    classification=m.get("classification", "HIGH RISK"),
                    risk_factors=m.get("factors", {"Rapid fund movement": 22, "Multiple senders": 18}),
                    is_mule=True,
                    is_watchlist=True if m["number"] in ["MULE-A457", "MULE-C912", "MULE-M221"] else False,
                    linked_case_id=case_data["case_id"],
                    created_at=datetime.utcnow() - timedelta(days=m.get("age", 20))
                )
                db.add(mule_acc)
                accounts_written[m["number"]] = mule_acc

        # Create Transactions
        for tx in case_data["txs"]:
            db_tx = models.Transaction(
                transaction_id=tx["id"],
                sender_account=tx["from"],
                receiver_account=tx["to"],
                amount=tx["amount"],
                transaction_type=tx["type"],
                risk_score=tx["risk"],
                is_simulated=False,
                status="COMPLETED",
                linked_case_id=case_data["case_id"],
                timestamp=datetime.utcnow() - timedelta(minutes=tx["time_offset"])
            )
            db.add(db_tx)

        # Create Predictions
        for prd in case_data["predictions"]:
            db_prd = models.Prediction(
                prediction_id=f"PRD-{case_data['case_id'].split('-')[-1]}-{random.randint(10, 99)}",
                case_id=case_data["case_id"],
                source_account=case_data["txs"][1]["to"] if len(case_data["txs"]) > 1 else case_data["mules"][0]["number"],
                target_entity=prd["target"],
                probability=prd["prob"],
                predicted_type=prd["type"],
                time_window_mins=prd["mins"],
                factors={"Pattern similarity": 30, "Velocity window": 25, "Historical correlation": 25},
                explanation=prd.get("explanation", "Predictive sequence correlation matches known mule layering patterns.")
            )
            db.add(db_prd)
            
            # If cash-out, add to cashout_predictions
            if prd["type"] == "CASH_OUT":
                atm_obj = atms_dict.get(prd["target"])
                db_cop = models.CashoutPrediction(
                    prediction_id=f"COP-{case_data['case_id'].split('-')[-1]}-{random.randint(10, 99)}",
                    case_id=case_data["case_id"],
                    account_number=case_data["txs"][-1]["from"] if len(case_data["txs"]) > 0 else case_data["mules"][-1]["number"],
                    predicted_location=atm_obj.location_name if atm_obj else "ATM Cluster Dadar West",
                    atm_id=prd["target"],
                    probability=prd["prob"],
                    time_window_mins=prd["mins"],
                    factors={"ATM withdrawal velocity": 40, "Geographical clustering": 30, "Transfer structuring": 30},
                    timestamp=datetime.utcnow()
                )
                db.add(db_cop)

        # Create Alerts
        for al in case_data["alerts"]:
            db_al = models.Alert(
                alert_id=al["id"],
                case_id=case_data["case_id"],
                severity=al["severity"],
                title=al["title"],
                description=al["desc"],
                account_number=al["mule"],
                amount_at_risk=al["risk_amt"],
                status="ACTIVE",
                timestamp=datetime.utcnow() - timedelta(minutes=al.get("offset", 60))
            )
            db.add(db_al)

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

        # Create Investigation Notes
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
            db_evidence = models.Evidence(
                evidence_id=f"EVD-{case_data['case_id'].split('-')[-1]}-{idx+1}",
                case_id=case_data["case_id"],
                title=ev_item["title"],
                description=ev_item["desc"],
                file_type=ev_item["file_type"],
                file_size=ev_item.get("size", "1.2 MB"),
                hash_checksum=f"SHA256:{uuid.uuid4().hex[:16].upper()}",
                timestamp=datetime.utcnow() - timedelta(minutes=80 - idx * 20)
            )
            db.add(db_evidence)

    # 5. Seed Watchlist Accounts
    watchlist_seeds = [
        {"acc": "MULE-A457", "holder": "Mohammad Farooq", "bank": "Canara Bank", "reason": "High-velocity layer-1 mule in Case CF-2026-00421", "risk": "CRITICAL"},
        {"acc": "MULE-C912", "holder": "Sunil Dutt Gowda", "bank": "Union Bank of India", "reason": "Terminal cash-out relay account near Dadar cluster", "risk": "CRITICAL"},
        {"acc": "MULE-M221", "holder": "Nitesh Patel", "bank": "HDFC Bank", "reason": "High-value investment fraud layering node in Case CF-2026-00422", "risk": "HIGH"},
        {"acc": "MULE-L309", "holder": "Vijay Grover", "bank": "Union Bank of India", "reason": "Multiple victim convergence nexus in Case CF-2026-00424", "risk": "CRITICAL"},
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

    # 6. Seed Audit Logs
    audit_seeds = [
        {"action": "SESSION_INITIALIZED", "case": None, "details": "Officer Rajesh K. logged in via Level 3 Cyber Intelligence Gateway."},
        {"action": "CASE_OPENED", "case": "CF-2026-00421", "details": "Opened Case CF-2026-00421 (UPI Social Engineering) for active investigation."},
        {"action": "PREDICTION_REFRESHED", "case": "CF-2026-00421", "details": "Recalculated next-hop transition probabilities for MULE-B821."},
        {"action": "WATCHLIST_ADDED", "case": "CF-2026-00421", "details": "Added MULE-C912 to national proactive surveillance watchlist."},
        {"action": "ATM_CLUSTER_GEOCODED", "case": "CF-2026-00421", "details": "Mapped ATM Cluster 03 (Dadar West) cash-out risk window: 20-40 min."},
    ]
    for idx, a in enumerate(audit_seeds):
        audit_log = models.AuditLog(
            log_id=f"AUD-{1000 + idx}",
            officer="Officer Rajesh K.",
            action=a["action"],
            case_id=a["case"],
            details=a["details"],
            timestamp=datetime.utcnow() - timedelta(minutes=90 - idx * 15),
            ip_address="10.42.0.8 (LE_VPN)"
        )
        db.add(audit_log)

    db.commit()
    db.close()
    print("Database seeding completed successfully with 20 complete cases!")

if __name__ == "__main__":
    seed_db()
