import random
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
    "Part-Time Task Scam", "Lottery Gift Card Scam", "Utility Bill Fraud", "Dating App Scam", 
    "Crypto Investment Fraud", "Tech Support Extortion", "SMS Phishing Attack", "Identity Theft", 
    "Fake E-Commerce Store", "Vishing Blackmail", "Credit Card Cloning", "Sextortion Blackmail",
    "Fake Travel Booking", "Real Estate Lease Fraud", "Customs Clearance Impersonation"
]

ATM_LIST = ["ATM-Z03", "ATM-Z11", "ATM-Z07", "ATM-Z09", "ATM-Z05"]

def generate_indian_phone():
    return f"+91 {random.randint(6, 9)}{random.randint(100000000, 999999999)}"

def seed_db():
    db = SessionLocal()
    
    # Re-create tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    print("Re-creating entities...")

    # 1. Seed ATMs
    atms_dict = {
        "ATM-Z03": models.ATM(atm_id="ATM-Z03", location_name="ATM Cluster 03 - Dadar West", city="Mumbai", latitude=19.0210, longitude=72.8424, risk_level="CRITICAL", withdrawal_velocity=480000.0),
        "ATM-Z11": models.ATM(atm_id="ATM-Z11", location_name="ATM Cluster 11 - Bandra Reclamation", city="Mumbai", latitude=19.0425, longitude=72.8368, risk_level="HIGH", withdrawal_velocity=350000.0),
        "ATM-Z07": models.ATM(atm_id="ATM-Z07", location_name="ATM Cluster 07 - Kurla East", city="Mumbai", latitude=19.0600, longitude=72.8730, risk_level="HIGH", withdrawal_velocity=290000.0),
        "ATM-Z09": models.ATM(atm_id="ATM-Z09", location_name="ATM Cluster 09 - Andheri West Station", city="Mumbai", latitude=19.1190, longitude=72.8470, risk_level="CRITICAL", withdrawal_velocity=520000.0),
        "ATM-Z05": models.ATM(atm_id="ATM-Z05", location_name="ATM Cluster 05 - Borivali West Sector 4", city="Mumbai", latitude=19.2300, longitude=72.8570, risk_level="MEDIUM", withdrawal_velocity=180000.0)
    }
    for atm in atms_dict.values():
        db.add(atm)
        
    # Additional random ATMs
    for i in range(1, 10):
        atm_id = f"ATM-{i:03d}"
        if atm_id not in atms_dict:
            atm = models.ATM(
                atm_id=atm_id,
                location_name=f"ATM Branch {i:02d} - Chembur Road",
                city="Mumbai",
                latitude=19.0620 + random.uniform(-0.05, 0.05),
                longitude=72.8980 + random.uniform(-0.05, 0.05),
                risk_level=random.choice(["LOW", "MEDIUM", "HIGH"]),
                withdrawal_velocity=float(random.randint(50000, 200000))
            )
            db.add(atm)

    # 2. Seed Officers/Users
    officer_user = models.User(
        username="officer1",
        name="Investigating Officer Rajesh K.",
        role="Senior Cyber Inspector",
        system_access="LEVEL 3 - NATIONAL FRAUD REGISTRY"
    )
    db.add(officer_user)
    db.commit()

    # 3. Create Case Scenarios (Case A to E)
    case_scenarios = [
        # CASE 1: UPI Social Engineering
        {
            "case_id": "CF-2026-00421",
            "victim_name": "Ramesh Chandra",
            "victim_acc": "30291488102",
            "victim_bank": "State Bank of India",
            "fraud_type": "UPI Social Engineering",
            "amount": 100000.0,
            "assigned_officer": "Investigating Officer Rajesh K.",
            "mules": [
                {"number": "MULE-A457", "holder": "Mohammad Farooq", "bank": "Canara Bank", "ifsc": "CNRB0001042", "age": 45},
                {"number": "MULE-B821", "holder": "Karan Malhotra", "bank": "Punjab National Bank", "ifsc": "PUNB0249100", "age": 20},
                {"number": "MULE-C912", "holder": "Sunil Dutt Gowda", "bank": "Union Bank of India", "ifsc": "UBIN0542318", "age": 10}
            ],
            "txs": [
                {"id": "TXN-2026-90401", "from": "30291488102", "to": "MULE-A457", "amount": 100000.0, "type": "UPI", "risk": 99.0, "time_offset": 78},
                {"id": "TXN-2026-90402", "from": "MULE-A457", "to": "MULE-B821", "amount": 60000.0, "type": "IMPS", "risk": 78.0, "time_offset": 72},
                {"id": "TXN-2026-90403", "from": "MULE-A457", "to": "MULE-C912", "amount": 30000.0, "type": "IMPS", "risk": 85.0, "time_offset": 71},
                {"id": "TXN-2026-90407", "from": "MULE-A457", "to": "MULE-C912", "amount": 10000.0, "type": "IMPS", "risk": 85.0, "time_offset": 70},
                {"id": "TXN-2026-90404", "from": "MULE-C912", "to": "ATM-Z03", "amount": 26000.0, "type": "ATM_WITHDRAWAL", "risk": 91.0, "time_offset": 68},
                {"id": "TXN-2026-90410", "from": "MULE-C912", "to": "ATM-Z03", "amount": 5000.0, "type": "ATM_WITHDRAWAL", "risk": 91.0, "time_offset": 67}
            ],
            "predictions": [
                {"target": "MULE-C912", "prob": 0.78, "type": "NEXT_HOP", "mins": 15, "explanation": "Similar transactions previously moved from B821 to C912. Velocity pattern correlates."},
                {"target": "ATM-Z03", "prob": 0.82, "type": "CASH_OUT", "mins": 25, "explanation": "ATM-Z03 selected due to physical proximity to logged mobile IP."}
            ],
            "alerts": [
                {"id": "ALT-00421-01", "severity": "WARNING", "title": "Transaction Splitting Layer", "desc": "MULE-A457 split ₹1,00,000 incoming fraud funds into two outgoing transfers to B821 and C912.", "mule": "MULE-A457", "risk_amt": 100000.0, "offset": 71},
                {"id": "ALT-00421-02", "severity": "CRITICAL", "title": "Dadar ATM Withdrawal Alert", "desc": "Withdrawal of ₹26,000 at ATM-Z03 (Dadar West) from MULE-C912 within 10 minutes of receiving split.", "mule": "MULE-C912", "risk_amt": 26000.0, "offset": 68}
            ],
            "timeline": [
                {"step": 1, "title": "Complaint Received", "desc": "Cyber portal registered complaint from Ramesh Chandra at 10:32 AM."},
                {"step": 2, "title": "Fund Entry", "desc": "₹1,00,000 entered Canara Bank MULE-A457 from SBI account."},
                {"step": 3, "title": "Risk Escalation", "desc": "MULE-A457 risk score evaluated to 99% (HIGH RISK) due to unusual amount."},
                {"step": 4, "title": "Mule B Layering", "desc": "₹60,000 transferred MULE-A457 -> PNB MULE-B821 via IMPS."},
                {"step": 5, "title": "Mule C Layering", "desc": "₹40,000 transferred MULE-A457 -> Union Bank MULE-C912 via IMPS."},
                {"step": 6, "title": "Splitting Detected", "desc": "Transaction splitting alert triggered on MULE-A457 (outgoing ratio 1.0)."}
            ],
            "notes": [
                "Victim filed complaint through portal at 10:32 AM. Traced transfer to Canara Bank MULE-A457.",
                "Canara Bank confirms holder Farooq resides in village, but transaction IP logged in Dadar, Mumbai."
            ]
        },
        # CASE 2: Fake Investment Scam
        {
            "case_id": "CF-2026-00422",
            "victim_name": "Kishore Kumar",
            "victim_acc": "30921477401",
            "victim_bank": "ICICI Bank",
            "fraud_type": "Fake Investment Scam",
            "amount": 240000.0,
            "assigned_officer": "Officer Sanjay M.",
            "mules": [
                {"number": "MULE-M221", "holder": "Nitesh Patel", "bank": "HDFC Bank", "ifsc": "HDFC0001221", "age": 12},
                {"number": "MULE-M874", "holder": "Preeti Sen", "bank": "ICICI Bank", "ifsc": "ICIC0000874", "age": 8},
                {"number": "MULE-M991", "holder": "Vikrant Bose", "bank": "Axis Bank", "ifsc": "UTIB0000991", "age": 5}
            ],
            "txs": [
                {"id": "TXN-2026-90501", "from": "30921477401", "to": "MULE-M221", "amount": 240000.0, "type": "IMPS", "risk": 99.0, "time_offset": 120},
                {"id": "TXN-2026-90502", "from": "MULE-M221", "to": "MULE-M874", "amount": 150000.0, "type": "IMPS", "risk": 82.0, "time_offset": 110},
                {"id": "TXN-2026-90503", "from": "MULE-M221", "to": "MULE-M991", "amount": 90000.0, "type": "IMPS", "risk": 75.0, "time_offset": 105},
                {"id": "TXN-2026-90504", "from": "MULE-M874", "to": "ATM-Z11", "amount": 80000.0, "type": "ATM_WITHDRAWAL", "risk": 93.0, "time_offset": 90},
                {"id": "TXN-2026-90505", "from": "MULE-M991", "to": "ATM-Z11", "amount": 45000.0, "type": "ATM_WITHDRAWAL", "risk": 88.0, "time_offset": 85}
            ],
            "predictions": [
                {"target": "ATM-Z11", "prob": 0.67, "type": "CASH_OUT", "mins": 35, "explanation": "High withdrawal velocity logged at Bandra Reclamation ATM Cluster 11."},
                {"target": "MULE-M991", "prob": 0.23, "type": "NEXT_HOP", "mins": 45, "explanation": "Linked IP logins suggest secondary transfers to M991 are possible."}
            ],
            "alerts": [
                {"id": "ALT-00422-01", "severity": "CRITICAL", "title": "Large Splitting Triggered", "desc": "MULE-M221 divided ₹2.4 Lakh into M874 and M991 within 15 minutes.", "mule": "MULE-M221", "risk_amt": 240000.0, "offset": 108},
                {"id": "ALT-00422-02", "severity": "WARNING", "title": "Bandra ATM Threat Active", "desc": "Withdrawal spike detected at ATM-Z11 linked to Axis MULE-M991.", "mule": "MULE-M991", "risk_amt": 45000.0, "offset": 86}
            ],
            "timeline": [
                {"step": 1, "title": "High Value Fraud Complaint", "desc": "Kishore Kumar reported loss of ₹2,40,000 on WhatsApp fake group portal."},
                {"step": 2, "title": "HDFC Entry", "desc": "Funds transferred to Nitesh Patel HDFC account MULE-M221."},
                {"step": 3, "title": "M221 Evaluated", "desc": "Risk rating hits 99% due to rapid ledger depletion."},
                {"step": 4, "title": "Bandra ATM Cash-Out", "desc": "ATM withdrawals logged at Bandra Reclamation Cluster 11."}
            ],
            "notes": [
                "Victim lured under pretense of IPO investment returns. Initiated transfer from ICICI.",
                "Requested freeze request to HDFC Bank and Axis Bank security divisions."
            ]
        },
        # CASE 3: Loan Scam
        {
            "case_id": "CF-2026-00423",
            "victim_name": "Arvind Swamy",
            "victim_acc": "30451122891",
            "victim_bank": "Union Bank of India",
            "fraud_type": "Loan Scam",
            "amount": 75000.0,
            "assigned_officer": "Inspector Neha G.",
            "mules": [
                {"number": "MULE-K102", "holder": "Gautam Rao", "bank": "State Bank of India", "ifsc": "SBIN0000102", "age": 25},
                {"number": "MULE-K447", "holder": "Dinesh Joshi", "bank": "Bank of Baroda", "ifsc": "BARB0MANDVI", "age": 14},
                {"number": "MULE-K882", "holder": "Meena Iyer", "bank": "Canara Bank", "ifsc": "CNRB0001002", "age": 9}
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
                {"step": 1, "title": "Telegram Task Fraud complaint", "desc": "Victim Arvind Swamy defrauded under 'Telegram rating task' job scheme."},
                {"step": 2, "title": "SBI Injection", "desc": "₹75,000 deposited in SBI MULE-K102."},
                {"step": 3, "title": "Kurla East Withdrawals", "desc": "Partial cash-out observed at ATM-Z07 Kurla East."}
            ],
            "notes": [
                "Victim was asked to perform hotel ratings tasks on a fraudulent Telegram portal.",
                "Traced cash-out location to Kurla. CCTV footage request submitted to BOB Dadar branch."
            ]
        },
        # CASE 4: Multiple Victims (Convergence into same Mule Account)
        {
            "case_id": "CF-2026-00424",
            "victim_name": "Lata Mangeshkar", # Primary victim
            "victim_acc": "30114995208",
            "victim_bank": "Axis Bank",
            "fraud_type": "Multiple Victims Convergence",
            "amount": 230000.0, # Combined amount
            "assigned_officer": "Inspector Neha G.",
            "mules": [
                {"number": "MULE-L309", "holder": "Vijay Grover", "bank": "Union Bank of India", "ifsc": "UBIN0538129", "age": 18},
                {"number": "MULE-L511", "holder": "Gauri Patil", "bank": "Punjab National Bank", "ifsc": "PUNB0511000", "age": 15}
            ],
            "txs": [
                # Incoming from Victim 1 (Lata Mangeshkar)
                {"id": "TXN-2026-90701", "from": "30114995208", "to": "MULE-L309", "amount": 100000.0, "type": "UPI", "risk": 95.0, "time_offset": 100},
                # Incoming from Victim 2
                {"id": "TXN-2026-90702", "from": "VIC-424-V2", "to": "MULE-L309", "amount": 80000.0, "type": "UPI", "risk": 95.0, "time_offset": 90},
                # Incoming from Victim 3
                {"id": "TXN-2026-90703", "from": "VIC-424-V3", "to": "MULE-L309", "amount": 50000.0, "type": "UPI", "risk": 95.0, "time_offset": 85},
                # Outgoing transfers
                {"id": "TXN-2026-90704", "from": "MULE-L309", "to": "MULE-L511", "amount": 210000.0, "type": "IMPS", "risk": 98.0, "time_offset": 52},
                {"id": "TXN-2026-90705", "from": "MULE-L511", "to": "ATM-Z09", "amount": 190000.0, "type": "ATM_WITHDRAWAL", "risk": 99.0, "time_offset": 45}
            ],
            "predictions": [
                {"target": "ATM-Z09", "prob": 0.91, "type": "CASH_OUT", "mins": 20, "explanation": "ATM-Z09 Andheri West shows high activity correlations linked to PNB MULE-L511."},
                {"target": "Other", "prob": 0.09, "type": "OTHER", "mins": 60, "explanation": "Possible layering to virtual crypto wallets."}
            ],
            "alerts": [
                {"id": "ALT-00424-01", "severity": "CRITICAL", "title": "Multiple Victims Convergence", "desc": "MULE-L309 receives convergent payments from 3 distinct, unrelated bank accounts.", "mule": "MULE-L309", "risk_amt": 230000.0, "offset": 80},
                {"id": "ALT-00424-02", "severity": "CRITICAL", "title": "Andheri West ATM Spike", "desc": "MULE-L511 withdrew ₹1,90,000 cash at Andheri Station ATM Cluster 09.", "mule": "MULE-L511", "risk_amt": 190000.0, "offset": 46}
            ],
            "timeline": [
                {"step": 1, "title": "Convergent Scam Complaint", "desc": "Multiple victim reports logged at NCRP targeting account UBI MULE-L309."},
                {"step": 2, "title": "Multiple Deposits", "desc": "₹1,00,000, ₹80,000 and ₹50,000 entered UBI MULE-L309 from distinct sources."},
                {"step": 3, "title": "Risk Anomaly Flagged", "desc": "Mule L309 risk rating hit critical due to convergence logic (+19 senders)."},
                {"step": 4, "title": "Andheri West Cash Out", "desc": "Immediate cash withdrawals detected at Andheri Station ATM."}
            ],
            "notes": [
                "Unusually high sender count convergence. Standard signature of organized mule renting ring.",
                "Andheri ATM CCTV coordinates requested from PNB nodal desk."
            ]
        },
        # CASE 5: Transaction Splitting (Structuring)
        {
            "case_id": "CF-2026-00425",
            "victim_name": "Sachin Tendulkar",
            "victim_acc": "30521480109",
            "victim_bank": "State Bank of India",
            "fraud_type": "Transaction Splitting",
            "amount": 350000.0,
            "assigned_officer": "Officer Rajesh K.",
            "mules": [
                {"number": "MULE-S501", "holder": "Jyoti Mishra", "bank": "Axis Bank", "ifsc": "UTIB0000501", "age": 30},
                {"number": "MULE-S702", "holder": "Manoj Deshmukh", "bank": "HDFC Bank", "ifsc": "HDFC0000702", "age": 14},
                {"number": "MULE-S803", "holder": "Dev Pandey", "bank": "ICICI Bank", "ifsc": "ICIC0000803", "age": 22},
                {"number": "MULE-S904", "holder": "Nisha Verma", "bank": "Canara Bank", "ifsc": "CNRB0001904", "age": 11}
            ],
            "txs": [
                {"id": "TXN-2026-90801", "from": "30521480109", "to": "MULE-S501", "amount": 350000.0, "type": "UPI", "risk": 99.0, "time_offset": 150},
                {"id": "TXN-2026-90802", "from": "MULE-S501", "to": "MULE-S702", "amount": 25000.0, "type": "RTGS", "risk": 88.0, "time_offset": 140},
                {"id": "TXN-2026-90803", "from": "MULE-S501", "to": "MULE-S803", "amount": 25000.0, "type": "IMPS", "risk": 82.0, "time_offset": 138},
                {"id": "TXN-2026-90805", "from": "MULE-S501", "to": "MULE-S904", "amount": 20000.0, "type": "IMPS", "risk": 82.0, "time_offset": 135},
                {"id": "TXN-2026-90804", "from": "MULE-S803", "to": "ATM-Z05", "amount": 20000.0, "type": "ATM_WITHDRAWAL", "risk": 94.0, "time_offset": 120}
            ],
            "predictions": [
                {"target": "ATM-Z05", "prob": 0.85, "type": "CASH_OUT", "mins": 40, "explanation": "ATM-Z05 Borivali West coordinates show withdrawals matching HDFC patterns."},
                {"target": "MULE-S904", "prob": 0.15, "type": "NEXT_HOP", "mins": 30, "explanation": "Remaining Axis balance likely transferring to ICICI MULE-S904."}
            ],
            "alerts": [
                {"id": "ALT-00425-01", "severity": "CRITICAL", "title": "Structuring Splitting Detected", "desc": "₹3.5 Lakh split into multiple sub-₹30,000 deposits to evade standard KYC thresholds.", "mule": "MULE-S501", "risk_amt": 350000.0, "offset": 138},
                {"id": "ALT-00425-02", "severity": "CRITICAL", "title": "Borivali Cash-Out Threat", "desc": "RTGS routing to Borivali West ATM Z05 mapped at ₹20,000.", "mule": "MULE-S803", "risk_amt": 20000.0, "offset": 121}
            ],
            "timeline": [
                {"step": 1, "title": "Structuring Complaint Filed", "desc": "KYC update netbanking SMS fraud reported by Sachin Tendulkar."},
                {"step": 2, "title": "Axis Inflow", "desc": "₹3.5 Lakh deposited into Axis MULE-S501."},
                {"step": 3, "title": "Structuring/Splitting", "desc": "Funds structure-split out to MULE-S702 (₹25K), MULE-S803 (₹25K), MULE-S904 (₹20K)."},
                {"step": 4, "title": "Borivali Cash Out", "desc": "ATM cash-out logged at Borivali Cluster 05."}
            ],
            "notes": [
                "Victim entered credentials on lookalike netbanking page. RTGS initiated shortly after.",
                "Nodal officer coordinates dispatched to Borivali police station check post."
            ]
        }
    ]

    # 4. Generate remaining cases 6 to 20 to complete the 20 Cases requirement
    for i in range(26, 41):
        case_id = f"CF-2026-004{i}"
        v_name = f"{random.choice(INDIAN_FIRST_NAMES)} {random.choice(INDIAN_LAST_NAMES)}"
        v_acc = f"VIC-ACC-{i}"
        bank, _ = random.choice(BANKS)
        amount = float(60000 + i * 5000)
        f_type = FRAUD_TYPES[(i - 26) % len(FRAUD_TYPES)]
        atm_id = ATM_LIST[i % len(ATM_LIST)]
        atm_loc = atms_dict[atm_id].location_name

        c_scenario = {
            "case_id": case_id,
            "victim_name": v_name,
            "victim_acc": v_acc,
            "victim_bank": bank,
            "fraud_type": f_type,
            "amount": amount,
            "assigned_officer": "Officer Rajesh K.",
            "mules": [
                {"number": f"MULE-{i}A", "holder": f"{random.choice(INDIAN_FIRST_NAMES)} Kumar", "bank": "Canara Bank", "ifsc": "CNRB0002104", "age": 28},
                {"number": f"MULE-{i}B", "holder": f"{random.choice(INDIAN_FIRST_NAMES)} Lal", "bank": "Union Bank", "ifsc": "UBIN0532415", "age": 14},
                {"number": f"MULE-{i}C", "holder": f"{random.choice(INDIAN_FIRST_NAMES)} Sen", "bank": "SBI", "ifsc": "SBIN0001092", "age": 9}
            ],
            "txs": [
                {"id": f"TXN-2026-{i}01", "from": v_acc, "to": f"MULE-{i}A", "amount": amount, "type": "UPI", "risk": 90.0, "time_offset": 50},
                {"id": f"TXN-2026-{i}02", "from": f"MULE-{i}A", "to": f"MULE-{i}B", "amount": amount * 0.7, "type": "IMPS", "risk": 75.0, "time_offset": 45},
                {"id": f"TXN-2026-{i}03", "from": f"MULE-{i}B", "to": f"MULE-{i}C", "amount": amount * 0.5, "type": "IMPS", "risk": 75.0, "time_offset": 40},
                {"id": f"TXN-2026-{i}04", "from": f"MULE-{i}C", "to": atm_id, "amount": amount * 0.3, "type": "ATM_WITHDRAWAL", "risk": 85.0, "time_offset": 30}
            ],
            "predictions": [
                {"target": atm_id, "prob": 0.72 + (i % 10) / 100, "type": "CASH_OUT", "mins": 20 + i, "explanation": f"Targeted ATM {atm_loc} based on access profiles."}
            ],
            "alerts": [
                {"id": f"ALT-{i}-01", "severity": "WARNING", "title": "Suspicious Account Linkage", "desc": f"Mule account MULE-{i}A linked to active case.", "mule": f"MULE-{i}A", "risk_amt": amount, "offset": 48}
            ],
            "timeline": [
                {"step": 1, "title": "Incident Logged", "desc": f"Registered {f_type} incident reported by {v_name}."},
                {"step": 2, "title": "Mule chain activity", "desc": "Funds routed to layering mule network."}
            ],
            "notes": ["KYC registries requested from banking nodes."]
        }
        case_scenarios.append(c_scenario)

    # 5. Insert all Seed Records
    print("Writing cases and relationships...")
    accounts_written = {}
    
    for case_data in case_scenarios:
        # Create Case
        case = models.Case(
            case_id=case_data["case_id"],
            victim_ref=f"VIC-{case_data['case_id'].split('-')[-1]}",
            fraud_type=case_data["fraud_type"],
            amount=case_data["amount"],
            current_status="ACTIVE",
            risk_score=91.0 if case_data["case_id"] == "CF-2026-00421" else 82.0 if case_data["case_id"] == "CF-2026-00422" else 75.0,
            assigned_officer=case_data["assigned_officer"],
            last_activity="Intelligence Loaded",
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
                ifsc_code="VICIFSC102",
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
                    risk_score=0.0,
                    classification="HIGH RISK",
                    is_mule=True,
                    linked_case_id=case_data["case_id"],
                    created_at=datetime.utcnow() - timedelta(days=m["age"])
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
                factors={"Pattern similarity": 30, "Velocity window": 25, "Historical correlation": 25}
            )
            db.add(db_prd)
            
            # If it's a cashout prediction, also add it to cashout_predictions table
            if prd["type"] == "CASH_OUT":
                db_cop = models.CashoutPrediction(
                    prediction_id=f"COP-{case_data['case_id'].split('-')[-1]}-{random.randint(10, 99)}",
                    case_id=case_data["case_id"],
                    account_number=case_data["txs"][-1]["from"] if len(case_data["txs"]) > 0 else case_data["mules"][-1]["number"],
                    predicted_location=atms_dict[prd["target"]].location_name if prd["target"] in atms_dict else "ATM Terminal Dadar",
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
                timestamp=datetime.utcnow() - timedelta(minutes=al["offset"])
            )
            db.add(db_al)

        # Create Timeline events
        for se in case_data["timeline"]:
            db_se = models.InvestigationEvent(
                event_id=f"EV-{case_data['case_id'].split('-')[-1]}-{se['step']}",
                case_id=case_data["case_id"],
                step_num=se["step"],
                title=se["title"],
                description=se["desc"],
                timestamp=datetime.utcnow() - timedelta(minutes=150 - se["step"] * 10)
            )
            db.add(db_se)

        # Create Notes
        for idx, content in enumerate(case_data["notes"]):
            db_note = models.InvestigationNote(
                note_id=f"NTE-{case_data['case_id'].split('-')[-1]}-{idx+1}",
                case_id=case_data["case_id"],
                officer=case_data["assigned_officer"],
                content=content,
                timestamp=datetime.utcnow() - timedelta(minutes=100 - idx * 20)
            )
            db.add(db_note)

        # Create Evidence files
        ev1 = models.Evidence(
            evidence_id=f"EVD-{case_data['case_id'].split('-')[-1]}-1",
            case_id=case_data["case_id"],
            title="Victim NCRP Statement PDF",
            description="Official complaint logged at National Cyber Crime portal.",
            file_type="PDF",
            timestamp=datetime.utcnow() - timedelta(minutes=140)
        )
        ev2 = models.Evidence(
            evidence_id=f"EVD-{case_data['case_id'].split('-')[-1]}-2",
            case_id=case_data["case_id"],
            title="Mule Account KYC Ledger",
            description="Verified KYC records pulled from the primary banking node.",
            file_type="CSV",
            timestamp=datetime.utcnow() - timedelta(minutes=110)
        )
        db.add_all([ev1, ev2])

    db.commit()

    # 6. Populate random background accounts and transactions
    print("Generating background accounts...")
    accounts_list = list(accounts_written.values())
    for i in range(1, 200):
        first_name = random.choice(INDIAN_FIRST_NAMES)
        last_name = random.choice(INDIAN_LAST_NAMES)
        holder = f"{first_name} {last_name}"
        bank, ifsc_pfx = random.choice(BANKS)
        ifsc = f"{ifsc_pfx}0{random.randint(100000, 999999)}"
        acc_num = f"ACC-{random.randint(10000000, 99999999)}"
        
        is_mule_flag = random.random() < 0.05
        classif = "SAFE"
        score = random.uniform(0, 35)
        if is_mule_flag:
            classif = random.choice(["SUSPICIOUS", "HIGH RISK"])
            score = random.uniform(60, 95)
            
        acc = models.Account(
            account_number=acc_num,
            holder_name=holder,
            bank_name=bank,
            ifsc_code=ifsc,
            phone_number=generate_indian_phone(),
            risk_score=score,
            classification=classif,
            is_mule=is_mule_flag,
            created_at=datetime.utcnow() - timedelta(days=random.randint(10, 500))
        )
        db.add(acc)
        accounts_list.append(acc)
        
    db.commit()
    
    # Generate background transactions
    print("Generating background transactions...")
    tx_count = 0
    safe_accounts = [acc for acc in accounts_list if acc.classification == "SAFE"]
    
    for _ in range(800):
        sender = random.choice(safe_accounts)
        receiver = random.choice(safe_accounts)
        if sender.account_number == receiver.account_number:
            continue
            
        amount = round(random.uniform(100, 15000), 2)
        tx_time = datetime.utcnow() - timedelta(hours=random.randint(1, 240))
        tx_type = random.choice(["UPI", "IMPS", "RTGS", "NEFT"])
        
        tx = models.Transaction(
            transaction_id=f"TXN-{10000000 + tx_count}",
            sender_account=sender.account_number,
            receiver_account=receiver.account_number,
            amount=amount,
            timestamp=tx_time,
            transaction_type=tx_type,
            risk_score=random.uniform(0, 15),
            is_simulated=False
        )
        db.add(tx)
        tx_count += 1

    # Recalculate dynamic risks on all Case Mules to populate RiskAssessment and classification features
    print("Recalculating dynamic risk profiles...")
    for acc in accounts_written.values():
        if acc.is_mule:
            recalculate_account_risk(db, acc.account_number)

    db.commit()
    db.close()
    print("Database fully seeded with 20 complete unique case scenarios.")

if __name__ == "__main__":
    seed_db()
