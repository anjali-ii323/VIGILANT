export interface MockCase {
  case_id: string;
  victim_ref: string;
  victim_name: string;
  victim_bank: string;
  fraud_type: string;
  amount: number;
  current_status: string;
  risk_score: number;
  assigned_officer: string;
  last_activity: string;
  priority: string;
  created_at: string;
  transactions: any[];
  accounts: any[];
  predictions: any[];
  timeline: any[];
  alerts: any[];
}

export const MOCK_CASES_DATA: MockCase[] = [
  // 1. Case CF-2026-00421
  {
    case_id: "CF-2026-00421",
    victim_ref: "30291488102",
    victim_name: "Ramesh Chandra",
    victim_bank: "State Bank of India",
    fraud_type: "UPI Social Engineering",
    amount: 100000,
    current_status: "ACTIVE",
    risk_score: 91,
    assigned_officer: "Officer Rajesh K. (Cyber Division)",
    last_activity: "2 mins ago",
    priority: "CRITICAL",
    created_at: new Date().toISOString(),
    accounts: [
      { account_number: "30291488102", holder_name: "Ramesh Chandra", bank_name: "State Bank of India", ifsc_code: "SBIN0001824", risk_score: 5, is_mule: false, classification: "VICTIM" },
      { account_number: "MULE-A457", holder_name: "Mohammad Farooq", bank_name: "Canara Bank", ifsc_code: "CNRB0001042", risk_score: 99, is_mule: true, classification: "HIGH RISK" },
      { account_number: "MULE-B821", holder_name: "Karan Malhotra", bank_name: "Punjab National Bank", ifsc_code: "PUNB0249100", risk_score: 78, is_mule: true, classification: "HIGH RISK" },
      { account_number: "MULE-C912", holder_name: "Sunil Dutt Gowda", bank_name: "Union Bank of India", ifsc_code: "UBIN0542318", risk_score: 95, is_mule: true, classification: "HIGH RISK" },
      { account_number: "MULE-D441", holder_name: "Deepak Verma", bank_name: "State Bank of India", ifsc_code: "SBIN0004412", risk_score: 62, is_mule: true, classification: "SUSPICIOUS" }
    ],
    transactions: [
      { transaction_id: "TX-9010", sender_account: "30291488102", receiver_account: "MULE-A457", amount: 100000, transaction_type: "UPI", risk_score: 99, timestamp: "2026-09-01T10:32:00Z" },
      { transaction_id: "TX-9011", sender_account: "MULE-A457", receiver_account: "MULE-B821", amount: 60000, transaction_type: "IMPS", risk_score: 78, timestamp: "2026-09-01T10:38:00Z" },
      { transaction_id: "TX-9012", sender_account: "MULE-A457", receiver_account: "MULE-C912", amount: 40000, transaction_type: "IMPS", risk_score: 95, timestamp: "2026-09-01T10:41:00Z" },
      { transaction_id: "TX-9013", sender_account: "MULE-B821", receiver_account: "MULE-D441", amount: 25000, transaction_type: "NEFT", risk_score: 62, timestamp: "2026-09-01T10:46:00Z" },
      { transaction_id: "TX-9014", sender_account: "MULE-C912", receiver_account: "ATM-Z03", amount: 40000, transaction_type: "ATM_WITHDRAWAL", risk_score: 95, timestamp: "2026-09-01T10:52:00Z" }
    ],
    predictions: [
      { prediction_id: "P-101", predicted_type: "ATM_WITHDRAWAL", target_entity: "ATM-Z03 (Dadar West)", probability: 0.88, time_window_mins: "20–40", explanation: "Target ATM cluster correlated with known cash-out syndicates." },
      { prediction_id: "P-102", predicted_type: "MULE_TRANSFER", target_entity: "MULE-D441 (SBI)", probability: 0.12, time_window_mins: "15–30", explanation: "Secondary dispersal branch." }
    ],
    timeline: [
      { event_id: "E-1", title: "Victim Fraud Reported", timestamp: "2026-09-01T10:30:00Z", description: "Ramesh Chandra reported unauthorized ₹1,00,000 debit via fraudulent utility bill link." },
      { event_id: "E-2", title: "Primary Inflow Detected", timestamp: "2026-09-01T10:32:00Z", description: "₹1,00,000 credited to Canara Bank mule node A457." },
      { event_id: "E-3", title: "Rapid Dispersal & Splitting", timestamp: "2026-09-01T10:41:00Z", description: "A457 split funds into B821 (₹60,000) and C912 (₹40,000)." },
      { event_id: "E-4", title: "Cash-Out Imminent", timestamp: "2026-09-01T10:52:00Z", description: "C912 routed ₹40,000 towards ATM Cluster 03 (Dadar West)." }
    ],
    alerts: [
      { alert_id: "AL-101", case_id: "CF-2026-00421", severity: "CRITICAL", title: "Imminent ATM Cash-Out", description: "₹40,000 predicted to reach ATM Cluster 03 (Dadar West) within 20–40 minutes.", account_number: "MULE-C912", amount_at_risk: 40000, timestamp: "2026-09-01T10:42:00Z", status: "ACTIVE" },
      { alert_id: "AL-102", case_id: "CF-2026-00421", severity: "CRITICAL", title: "High Velocity Dispersal", description: "Account MULE-A457 dispersed 100% of incoming funds within 9 minutes.", account_number: "MULE-A457", amount_at_risk: 100000, timestamp: "2026-09-01T10:35:00Z", status: "ACTIVE" }
    ]
  },

  // 2. Case CF-2026-00892 (Fake Investment Scam)
  {
    case_id: "CF-2026-00892",
    victim_ref: "50192837190",
    victim_name: "Anita Verma",
    victim_bank: "HDFC Bank",
    fraud_type: "Fake Investment Scam",
    amount: 450000,
    current_status: "ACTIVE",
    risk_score: 94,
    assigned_officer: "Inspector S. Iyer (Cyber Cell)",
    last_activity: "5 mins ago",
    priority: "CRITICAL",
    created_at: new Date().toISOString(),
    accounts: [
      { account_number: "50192837190", holder_name: "Anita Verma", bank_name: "HDFC Bank", ifsc_code: "HDFC0000128", risk_score: 5, is_mule: false, classification: "VICTIM" },
      { account_number: "MULE-N104", holder_name: "Raju Shinde", bank_name: "ICICI Bank", ifsc_code: "ICIC0000912", risk_score: 96, is_mule: true, classification: "HIGH RISK" },
      { account_number: "MULE-N105", holder_name: "Dinesh Kadam", bank_name: "Axis Bank", ifsc_code: "UTIB0001924", risk_score: 88, is_mule: true, classification: "HIGH RISK" },
      { account_number: "MULE-N106", holder_name: "Vijay Gaikwad", bank_name: "Bank of Baroda", ifsc_code: "BARB0002914", risk_score: 92, is_mule: true, classification: "HIGH RISK" }
    ],
    transactions: [
      { transaction_id: "TX-9021", sender_account: "50192837190", receiver_account: "MULE-N104", amount: 450000, transaction_type: "RTGS", risk_score: 96, timestamp: "2026-09-01T11:10:00Z" },
      { transaction_id: "TX-9022", sender_account: "MULE-N104", receiver_account: "MULE-N105", amount: 250000, transaction_type: "IMPS", risk_score: 88, timestamp: "2026-09-01T11:15:00Z" },
      { transaction_id: "TX-9023", sender_account: "MULE-N104", receiver_account: "MULE-N106", amount: 200000, transaction_type: "IMPS", risk_score: 92, timestamp: "2026-09-01T11:18:00Z" },
      { transaction_id: "TX-9024", sender_account: "MULE-N105", receiver_account: "ATM-Z09", amount: 150000, transaction_type: "ATM_WITHDRAWAL", risk_score: 95, timestamp: "2026-09-01T11:25:00Z" },
      { transaction_id: "TX-9025", sender_account: "MULE-N106", receiver_account: "ATM-Z11", amount: 180000, transaction_type: "ATM_WITHDRAWAL", risk_score: 92, timestamp: "2026-09-01T11:30:00Z" }
    ],
    predictions: [
      { prediction_id: "P-201", predicted_type: "ATM_WITHDRAWAL", target_entity: "ATM-Z09 (Andheri West)", probability: 0.91, time_window_mins: "15–30", explanation: "Massive liquidity outflow towards suburban extraction hub." }
    ],
    timeline: [
      { event_id: "E-10", title: "Fake Stock App Inflow", timestamp: "2026-09-01T11:10:00Z", description: "Anita Verma induced to wire ₹4,50,000 to fake institutional trading account." }
    ],
    alerts: [
      { alert_id: "AL-201", case_id: "CF-2026-00892", severity: "CRITICAL", title: "Large Volume Extraction", description: "₹3,30,000 converging towards Andheri & Bandra ATM clusters.", account_number: "MULE-N104", amount_at_risk: 450000, timestamp: "2026-09-01T11:12:00Z", status: "ACTIVE" }
    ]
  },

  // 3. Case CF-2026-01205 (Part-Time Task Scam)
  {
    case_id: "CF-2026-01205",
    victim_ref: "60293847102",
    victim_name: "Sanjay Kumar",
    victim_bank: "ICICI Bank",
    fraud_type: "Part-Time Task Scam",
    amount: 180000,
    current_status: "ACTIVE",
    risk_score: 87,
    assigned_officer: "Officer Rajesh K. (Cyber Division)",
    last_activity: "8 mins ago",
    priority: "HIGH",
    created_at: new Date().toISOString(),
    accounts: [
      { account_number: "60293847102", holder_name: "Sanjay Kumar", bank_name: "ICICI Bank", ifsc_code: "ICIC0001082", risk_score: 5, is_mule: false, classification: "VICTIM" },
      { account_number: "MULE-K201", holder_name: "Pooja Hegde", bank_name: "Canara Bank", ifsc_code: "CNRB0002914", risk_score: 89, is_mule: true, classification: "HIGH RISK" },
      { account_number: "MULE-K202", holder_name: "Manoj Tiwari", bank_name: "Union Bank of India", ifsc_code: "UBIN0541920", risk_score: 84, is_mule: true, classification: "HIGH RISK" }
    ],
    transactions: [
      { transaction_id: "TX-9031", sender_account: "60293847102", receiver_account: "MULE-K201", amount: 180000, transaction_type: "UPI", risk_score: 89, timestamp: "2026-09-01T11:40:00Z" },
      { transaction_id: "TX-9032", sender_account: "MULE-K201", receiver_account: "MULE-K202", amount: 140000, transaction_type: "IMPS", risk_score: 84, timestamp: "2026-09-01T11:46:00Z" },
      { transaction_id: "TX-9033", sender_account: "MULE-K202", receiver_account: "ATM-Z07", amount: 120000, transaction_type: "ATM_WITHDRAWAL", risk_score: 88, timestamp: "2026-09-01T11:55:00Z" }
    ],
    predictions: [
      { prediction_id: "P-301", predicted_type: "ATM_WITHDRAWAL", target_entity: "ATM-Z07 (Kurla East)", probability: 0.82, time_window_mins: "20–35", explanation: "Transit speed consistent with Kurla rail terminal cluster." }
    ],
    timeline: [
      { event_id: "E-20", title: "Task Deposit Initiated", timestamp: "2026-09-01T11:40:00Z", description: "Victim paid prepaid task deposit under promise of 30% commission." }
    ],
    alerts: [
      { alert_id: "AL-301", case_id: "CF-2026-01205", severity: "HIGH", title: "Telegram Task Inflow", description: "Dispersal to Kurla mule ring detected.", account_number: "MULE-K201", amount_at_risk: 180000, timestamp: "2026-09-01T11:42:00Z", status: "ACTIVE" }
    ]
  },

  // 4. Case CF-2026-01588 (Crypto On-Ramp Arbitrage)
  {
    case_id: "CF-2026-01588",
    victim_ref: "70192837492",
    victim_name: "Priya Nair",
    victim_bank: "Axis Bank",
    fraud_type: "Crypto On-Ramp Arbitrage",
    amount: 320000,
    current_status: "ACTIVE",
    risk_score: 93,
    assigned_officer: "Inspector S. Iyer (Cyber Cell)",
    last_activity: "12 mins ago",
    priority: "CRITICAL",
    created_at: new Date().toISOString(),
    accounts: [
      { account_number: "70192837492", holder_name: "Priya Nair", bank_name: "Axis Bank", ifsc_code: "UTIB0001092", risk_score: 5, is_mule: false, classification: "VICTIM" },
      { account_number: "MULE-X701", holder_name: "Harish Bose", bank_name: "Punjab National Bank", ifsc_code: "PUNB0192840", risk_score: 94, is_mule: true, classification: "HIGH RISK" },
      { account_number: "MULE-X702", holder_name: "Gauri Menon", bank_name: "State Bank of India", ifsc_code: "SBIN0002914", risk_score: 91, is_mule: true, classification: "HIGH RISK" }
    ],
    transactions: [
      { transaction_id: "TX-9041", sender_account: "70192837492", receiver_account: "MULE-X701", amount: 320000, transaction_type: "IMPS", risk_score: 94, timestamp: "2026-09-01T12:05:00Z" },
      { transaction_id: "TX-9042", sender_account: "MULE-X701", receiver_account: "MULE-X702", amount: 280000, transaction_type: "IMPS", risk_score: 91, timestamp: "2026-09-01T12:12:00Z" },
      { transaction_id: "TX-9043", sender_account: "MULE-X702", receiver_account: "ATM-Z14", amount: 200000, transaction_type: "ATM_WITHDRAWAL", risk_score: 90, timestamp: "2026-09-01T12:20:00Z" }
    ],
    predictions: [
      { prediction_id: "P-401", predicted_type: "ATM_WITHDRAWAL", target_entity: "ATM-Z14 (Thane South)", probability: 0.86, time_window_mins: "15–30", explanation: "Target ATM matches active mule operating zone." }
    ],
    timeline: [
      { event_id: "E-30", title: "P2P Arbitrage Fraud", timestamp: "2026-09-01T12:05:00Z", description: "P2P buyer escrow fraud executed on telegram arbitrage group." }
    ],
    alerts: [
      { alert_id: "AL-401", case_id: "CF-2026-01588", severity: "CRITICAL", title: "Arbitrage Mule Layer", description: "Rapid transit to Thane withdrawal point.", account_number: "MULE-X701", amount_at_risk: 320000, timestamp: "2026-09-01T12:07:00Z", status: "ACTIVE" }
    ]
  },

  // 5. Case CF-2026-01934 (Utility Bill Electricity Fraud)
  {
    case_id: "CF-2026-01934",
    victim_ref: "80192847591",
    victim_name: "Sunita Joshi",
    victim_bank: "State Bank of India",
    fraud_type: "Utility Bill Electricity Fraud",
    amount: 75000,
    current_status: "ACTIVE",
    risk_score: 79,
    assigned_officer: "Officer Rajesh K. (Cyber Division)",
    last_activity: "15 mins ago",
    priority: "HIGH",
    created_at: new Date().toISOString(),
    accounts: [
      { account_number: "80192847591", holder_name: "Sunita Joshi", bank_name: "State Bank of India", ifsc_code: "SBIN0003910", risk_score: 5, is_mule: false, classification: "VICTIM" },
      { account_number: "MULE-U501", holder_name: "Nisha Trivedi", bank_name: "Canara Bank", ifsc_code: "CNRB0001924", risk_score: 82, is_mule: true, classification: "HIGH RISK" },
      { account_number: "MULE-U502", holder_name: "Abhishek Pandey", bank_name: "HDFC Bank", ifsc_code: "HDFC0001092", risk_score: 76, is_mule: true, classification: "HIGH RISK" }
    ],
    transactions: [
      { transaction_id: "TX-9051", sender_account: "80192847591", receiver_account: "MULE-U501", amount: 75000, transaction_type: "UPI", risk_score: 82, timestamp: "2026-09-01T12:30:00Z" },
      { transaction_id: "TX-9052", sender_account: "MULE-U501", receiver_account: "MULE-U502", amount: 50000, transaction_type: "IMPS", risk_score: 76, timestamp: "2026-09-01T12:35:00Z" },
      { transaction_id: "TX-9053", sender_account: "MULE-U502", receiver_account: "ATM-Z05", amount: 40000, transaction_type: "ATM_WITHDRAWAL", risk_score: 78, timestamp: "2026-09-01T12:42:00Z" }
    ],
    predictions: [
      { prediction_id: "P-501", predicted_type: "ATM_WITHDRAWAL", target_entity: "ATM-Z05 (Borivali Sector 4)", probability: 0.74, time_window_mins: "25–45", explanation: "Target ATM in suburban zone matching previous incidents." }
    ],
    timeline: [
      { event_id: "E-40", title: "Electricity Bill Disconnect SMS", timestamp: "2026-09-01T12:30:00Z", description: "Victim warned electricity would be cut in 2 hours unless paid via APK." }
    ],
    alerts: [
      { alert_id: "AL-501", case_id: "CF-2026-01934", severity: "HIGH", title: "Utility APK Inflow", description: "Account U501 flagged for instant dispersal.", account_number: "MULE-U501", amount_at_risk: 75000, timestamp: "2026-09-01T12:32:00Z", status: "ACTIVE" }
    ]
  },

  // 6. Case CF-2026-02310 (Tech Support Remote Access Extortion)
  {
    case_id: "CF-2026-02310",
    victim_ref: "90192837401",
    victim_name: "Vikram Mehta",
    victim_bank: "Punjab National Bank",
    fraud_type: "Tech Support Remote Access Extortion",
    amount: 210000,
    current_status: "ACTIVE",
    risk_score: 89,
    assigned_officer: "Inspector S. Iyer (Cyber Cell)",
    last_activity: "20 mins ago",
    priority: "CRITICAL",
    created_at: new Date().toISOString(),
    accounts: [
      { account_number: "90192837401", holder_name: "Vikram Mehta", bank_name: "Punjab National Bank", ifsc_code: "PUNB0192831", risk_score: 5, is_mule: false, classification: "VICTIM" },
      { account_number: "MULE-T301", holder_name: "Aparna Bose", bank_name: "Bank of Baroda", ifsc_code: "BARB0001092", risk_score: 91, is_mule: true, classification: "HIGH RISK" },
      { account_number: "MULE-T302", holder_name: "Dev Prasad", bank_name: "Union Bank of India", ifsc_code: "UBIN0541928", risk_score: 87, is_mule: true, classification: "HIGH RISK" }
    ],
    transactions: [
      { transaction_id: "TX-9061", sender_account: "90192837401", receiver_account: "MULE-T301", amount: 210000, transaction_type: "NEFT", risk_score: 91, timestamp: "2026-09-01T12:50:00Z" },
      { transaction_id: "TX-9062", sender_account: "MULE-T301", receiver_account: "MULE-T302", amount: 160000, transaction_type: "IMPS", risk_score: 87, timestamp: "2026-09-01T12:56:00Z" },
      { transaction_id: "TX-9063", sender_account: "MULE-T302", receiver_account: "ATM-Z18", amount: 100000, transaction_type: "ATM_WITHDRAWAL", risk_score: 85, timestamp: "2026-09-01T13:05:00Z" }
    ],
    predictions: [
      { prediction_id: "P-601", predicted_type: "ATM_WITHDRAWAL", target_entity: "ATM-Z18 (Vashi Sector 17)", probability: 0.81, time_window_mins: "20–40", explanation: "Extraction route towards Navi Mumbai corridor." }
    ],
    timeline: [
      { event_id: "E-50", title: "AnyDesk Screen Share Takeover", timestamp: "2026-09-01T12:50:00Z", description: "Extortion caller claimed computer had expired security license." }
    ],
    alerts: [
      { alert_id: "AL-601", case_id: "CF-2026-02310", severity: "CRITICAL", title: "Remote Takeover Inflow", description: "High risk recipient T301 flagged.", account_number: "MULE-T301", amount_at_risk: 210000, timestamp: "2026-09-01T12:52:00Z", status: "ACTIVE" }
    ]
  }
];

export const MOCK_CASES_LIST = MOCK_CASES_DATA.map(c => ({
  case_id: c.case_id,
  victim_ref: c.victim_ref,
  fraud_type: c.fraud_type,
  amount: c.amount,
  current_status: c.current_status,
  risk_score: c.risk_score,
  assigned_officer: c.assigned_officer,
  last_activity: c.last_activity,
  priority: c.priority,
  created_at: c.created_at
}));

export const MOCK_ALERTS_LIST = MOCK_CASES_DATA.flatMap(c => c.alerts);
