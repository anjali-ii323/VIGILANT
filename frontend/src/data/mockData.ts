// Complete comprehensive 20-case mock dataset for VIGILANT platform

export const MOCK_CASES_DATA = [
  // 1. Case CF-2026-00421 (UPI Social Engineering)
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
      { account_number: "MULE-A457", holder_name: "Mohammad Farooq", bank_name: "Canara Bank", ifsc_code: "CNRB0001042", risk_score: 98, is_mule: true, classification: "HIGH RISK" },
      { account_number: "MULE-B821", holder_name: "Karan Malhotra", bank_name: "Punjab National Bank", ifsc_code: "PUNB0249100", risk_score: 88, is_mule: true, classification: "HIGH RISK" },
      { account_number: "MULE-C912", holder_name: "Sunil Dutt Gowda", bank_name: "Union Bank of India", ifsc_code: "UBIN0542318", risk_score: 95, is_mule: true, classification: "HIGH RISK" },
      { account_number: "MULE-D441", holder_name: "Deepak Verma", bank_name: "State Bank of India", ifsc_code: "SBIN0004412", risk_score: 72, is_mule: true, classification: "SUSPICIOUS" }
    ],
    transactions: [
      { transaction_id: "TX-9010", sender_account: "30291488102", receiver_account: "MULE-A457", amount: 100000, transaction_type: "UPI", risk_score: 99, timestamp: "2026-09-01T10:32:00Z" },
      { transaction_id: "TX-9011", sender_account: "MULE-A457", receiver_account: "MULE-B821", amount: 60000, transaction_type: "IMPS", risk_score: 78, timestamp: "2026-09-01T10:38:00Z" },
      { transaction_id: "TX-9012", sender_account: "MULE-A457", receiver_account: "MULE-C912", amount: 40000, transaction_type: "IMPS", risk_score: 85, timestamp: "2026-09-01T10:39:00Z" },
      { transaction_id: "TX-9013", sender_account: "MULE-B821", receiver_account: "MULE-D441", amount: 45000, transaction_type: "NEFT", risk_score: 72, timestamp: "2026-09-01T10:45:00Z" },
      { transaction_id: "TX-9014", sender_account: "MULE-C912", receiver_account: "ATM-Z03", amount: 40000, transaction_type: "ATM_WITHDRAWAL", risk_score: 95, timestamp: "2026-09-01T10:50:00Z" }
    ],
    predictions: [
      { prediction_id: "P-101", predicted_type: "ATM_WITHDRAWAL", target_entity: "ATM-Z03 (Dadar West)", probability: 0.88, time_window_mins: "20–40", explanation: "Correlation with historic Dadar cash-out corridor." },
      { prediction_id: "P-102", predicted_type: "INTER_BANK_LAYER", target_entity: "MULE-D441", probability: 0.65, time_window_mins: "15–30", explanation: "Secondary dispersal branch." }
    ],
    timeline: [
      { event_id: "E-01", step: 1, title: "UPI Debit Initiated", timestamp: "2026-09-01T10:32:00Z", description: "Victim authorized ₹1,00,000 via malicious QR invoice." },
      { event_id: "E-02", step: 2, title: "Layer-1 Split", timestamp: "2026-09-01T10:38:00Z", description: "MULE-A457 partitioned funds to MULE-B821 and MULE-C912." },
      { event_id: "E-03", step: 3, title: "ATM Prediction Flagged", timestamp: "2026-09-01T10:50:00Z", description: "Predicted terminal extraction at ATM-Z03." }
    ],
    notes: [
      { note_id: "N-101", case_id: "CF-2026-00421", officer: "Officer Rajesh K.", content: "Canara Bank account MULE-A457 flagged under high-velocity structuring ring.", category: "INTELLIGENCE", timestamp: "2026-09-01T10:40:00Z" },
      { note_id: "N-102", case_id: "CF-2026-00421", officer: "Officer Rajesh K.", content: "Notified Dadar local cyber squad of imminent cash extraction.", category: "ESCALATION", timestamp: "2026-09-01T10:52:00Z" }
    ],
    evidence: [
      { evidence_id: "EV-001", case_id: "CF-2026-00421", title: "Victim FIR Intake Statement", description: "Form 14A Cyber Crime Intake document with transaction hash.", file_type: "PDF", file_size: "1.8 MB", hash_checksum: "SHA256:8F43A9182BC4E7D99A0129481920481928401928", ipfs_cid: "bafybeic8f43a9182bc4e7d99a01vigilant", on_chain_tx_hash: "0x7F91B994A2D81C10291480D923E2804A9184B022", block_number: 1982412, smart_contract_address: "0x7F91B994A2D81C10291480D923E2804A9184B022", timestamp: "2026-09-01T10:35:00Z" },
      { evidence_id: "EV-002", case_id: "CF-2026-00421", title: "Canara Bank MULE-A457 Statement", description: "Ledger extract showing rapid outflow within 9 mins.", file_type: "CSV", file_size: "450 KB", hash_checksum: "SHA256:3D9A184F91B82048102948102948102948102948", ipfs_cid: "bafybeic3d9a184f91b82048102948vigilant", on_chain_tx_hash: "0x3D9A184F91B82048102948102948102948102948", block_number: 1982415, smart_contract_address: "0x7F91B994A2D81C10291480D923E2804A9184B022", timestamp: "2026-09-01T10:45:00Z" }
    ],
    alerts: [
      { alert_id: "AL-101", case_id: "CF-2026-00421", severity: "CRITICAL", title: "Imminent ATM Cash-Out", description: "₹40,000 predicted to reach ATM Cluster 03 (Dadar West) within 20–40 minutes.", account_number: "MULE-C912", amount_at_risk: 40000, timestamp: "2026-09-01T10:42:00Z", status: "ACTIVE" },
      { alert_id: "AL-102", case_id: "CF-2026-00421", severity: "CRITICAL", title: "High Velocity Dispersal", description: "Account MULE-A457 dispersed 100% of incoming funds within 9 minutes.", account_number: "MULE-A457", amount_at_risk: 100000, timestamp: "2026-09-01T10:35:00Z", status: "ACTIVE" }
    ]
  },

  // 2. Case CF-2026-00422 (Crypto On-Ramp Arbitrage & Web3 Wallet Off-Ramp)
  {
    case_id: "CF-2026-00422",
    victim_ref: "70192837492",
    victim_name: "Priya Nair",
    victim_bank: "Axis Bank",
    fraud_type: "Crypto On-Ramp Arbitrage",
    amount: 320000,
    current_status: "ACTIVE",
    risk_score: 96,
    assigned_officer: "Officer Rajesh K. (Cyber Division)",
    last_activity: "4 mins ago",
    priority: "CRITICAL",
    created_at: new Date().toISOString(),
    accounts: [
      { account_number: "70192837492", holder_name: "Priya Nair", bank_name: "Axis Bank", ifsc_code: "UTIB0001092", risk_score: 5, is_mule: false, classification: "VICTIM" },
      { account_number: "MULE-X701", holder_name: "Harish Bose", bank_name: "Punjab National Bank", ifsc_code: "PUNB0192840", risk_score: 94, is_mule: true, classification: "HIGH RISK" },
      { account_number: "P2P-ESCROW-BINANCE", holder_name: "Binance P2P Indian Bridge", bank_name: "Virtual Crypto Merchant", ifsc_code: "P2P0008812", risk_score: 85, is_mule: false, classification: "MERCHANT" },
      { account_number: "0x71C9284F91B8", holder_name: "Tether TRC-20 Wallet", bank_name: "Polygon/Tron Blockchain", ifsc_code: "TRC20_WALLET", risk_score: 98, is_mule: true, classification: "CRYPTO_WALLET" }
    ],
    transactions: [
      { transaction_id: "TX-9041", sender_account: "70192837492", receiver_account: "MULE-X701", amount: 320000, transaction_type: "IMPS", risk_score: 94, timestamp: "2026-09-01T12:05:00Z" },
      { transaction_id: "TX-9042", sender_account: "MULE-X701", receiver_account: "P2P-ESCROW-BINANCE", amount: 320000, transaction_type: "P2P_ESCROW", risk_score: 92, timestamp: "2026-09-01T12:12:00Z" },
      { transaction_id: "TX-9043", sender_account: "P2P-ESCROW-BINANCE", receiver_account: "0x71C9284F91B8", amount: 320000, transaction_type: "USDT_TRC20", risk_score: 98, timestamp: "2026-09-01T12:20:00Z" }
    ],
    predictions: [
      { prediction_id: "P-401", predicted_type: "CRYPTO_BRIDGE", target_entity: "0x71C9284F91B8 (Un-hosted Wallet)", probability: 0.94, time_window_mins: "10–20", explanation: "Fiat converted into USDT (TRC-20) and sent to external un-hosted wallet." }
    ],
    timeline: [
      { event_id: "E-30", step: 1, title: "P2P Arbitrage Fraud", timestamp: "2026-09-01T12:05:00Z", description: "P2P buyer escrow fraud executed on telegram arbitrage group." },
      { event_id: "E-31", step: 2, title: "On-Chain USDT Conversion", timestamp: "2026-09-01T12:20:00Z", description: "Funds converted to 3,850 USDT sent to 0x71C9284F91B8." }
    ],
    notes: [
      { note_id: "N-201", case_id: "CF-2026-00422", officer: "Officer Rajesh K.", content: "Blockchain wallet 0x71C9284F91B8 placed under on-chain transaction monitoring.", category: "INTELLIGENCE", timestamp: "2026-09-01T12:25:00Z" }
    ],
    evidence: [
      { evidence_id: "EV-010", case_id: "CF-2026-00422", title: "On-Chain Transaction Receipt - USDT Transfer", description: "Blockchain block explorer hash showing 3,850 USDT transfer.", file_type: "JSON", file_size: "120 KB", hash_checksum: "SHA256:71C9284F91B82048102948102948102948102948", ipfs_cid: "bafybeic71c9284f91b82048102948vigilant", on_chain_tx_hash: "0x71C9284F91B82048102948102948102948102948", block_number: 1982420, smart_contract_address: "0x7F91B994A2D81C10291480D923E2804A9184B022", timestamp: "2026-09-01T12:22:00Z" }
    ],
    alerts: [
      { alert_id: "AL-401", case_id: "CF-2026-00422", severity: "CRITICAL", title: "Crypto Off-Ramp Intercept Alert", description: "₹3,20,000 converted via P2P Escrow to un-hosted wallet 0x71C9284F91B8.", account_number: "MULE-X701", amount_at_risk: 320000, timestamp: "2026-09-01T12:07:00Z", status: "ACTIVE" }
    ]
  },

  // 3. Case CF-2026-00892 (Fake Investment Scam)
  {
    case_id: "CF-2026-00892",
    victim_ref: "50192837190",
    victim_name: "Anita Verma",
    victim_bank: "HDFC Bank",
    fraud_type: "Fake Investment Scam",
    amount: 450000,
    current_status: "ACTIVE",
    risk_score: 94,
    assigned_officer: "Officer Rajesh K. (Cyber Division)",
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
      { event_id: "E-10", step: 1, title: "Fake Stock App Inflow", timestamp: "2026-09-01T11:10:00Z", description: "Anita Verma induced to wire ₹4,50,000 to fake institutional trading account." }
    ],
    notes: [
      { note_id: "N-301", case_id: "CF-2026-00892", officer: "Officer Rajesh K.", content: "Institutional trading scam syndicate active across Bandra-Andheri axis.", category: "INTELLIGENCE", timestamp: "2026-09-01T11:20:00Z" }
    ],
    evidence: [
      { evidence_id: "EV-020", case_id: "CF-2026-00892", title: "HDFC Bank Victim Wire Advice", description: "Electronic funds transfer confirmation for ₹4,50,000.", file_type: "PDF", file_size: "1.5 MB", hash_checksum: "SHA256:501928371902048102948102948102948102948", ipfs_cid: "bafybeic501928371902048102948vigilant", on_chain_tx_hash: "0x501928371902048102948102948102948102948", block_number: 1982425, smart_contract_address: "0x7F91B994A2D81C10291480D923E2804A9184B022", timestamp: "2026-09-01T11:15:00Z" }
    ],
    alerts: [
      { alert_id: "AL-201", case_id: "CF-2026-00892", severity: "CRITICAL", title: "Large Volume Extraction", description: "₹3,30,000 converging towards Andheri & Bandra ATM clusters.", account_number: "MULE-N104", amount_at_risk: 450000, timestamp: "2026-09-01T11:12:00Z", status: "ACTIVE" }
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
