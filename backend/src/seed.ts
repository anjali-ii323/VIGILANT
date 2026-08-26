import bcrypt from 'bcrypt';
import prisma from './prisma';

const INDIAN_FIRST_NAMES = [
  "Amit", "Priya", "Rajesh", "Sunita", "Vikram", "Neha", "Sanjay", "Deepa", "Rahul", "Anjali", 
  "Arjun", "Kiran", "Vijay", "Meera", "Rohan", "Shalini", "Manish", "Divya", "Suresh", "Pooja",
  "Abhishek", "Aishwarya", "Anil", "Aparna", "Dev", "Gauri", "Harish", "Jyoti", "Manoj", "Nisha"
];
const INDIAN_LAST_NAMES = [
  "Sharma", "Patel", "Kumar", "Singh", "Joshi", "Mehta", "Nair", "Reddy", "Gupta", "Rao", 
  "Verma", "Choudhury", "Das", "Sen", "Pillai", "Iyer", "Banerjee", "Mishra", "Patil", "Deshmukh"
];

const CATEGORIES = [
  "UPI Social Engineering", "Fake Investment Scam", "Loan Scam", 
  "Part-Time Task Scam", "Lottery Gift Card Scam", "Utility Bill Fraud",
  "Dating App Scam", "Crypto Investment Fraud", "Tech Support Extortion",
  "SMS Phishing Attack", "Identity Theft", "Fake E-Commerce Store",
  "Vishing Blackmail", "Credit Card Cloning", "Sextortion Blackmail"
];

const BANKS = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", 
  "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India"
];

const STATES = [
  { name: "Maharashtra", lat: 19.7515, lng: 75.7139, city: "Mumbai" },
  { name: "Delhi", lat: 28.6139, lng: 77.2090, city: "New Delhi" },
  { name: "Karnataka", lat: 15.3173, lng: 75.7139, city: "Bengaluru" },
  { name: "Tamil Nadu", lat: 11.1271, lng: 78.6569, city: "Chennai" },
  { name: "Telangana", lat: 18.1124, lng: 79.0193, city: "Hyderabad" },
  { name: "Gujarat", lat: 22.2587, lng: 71.1924, city: "Ahmedabad" },
  { name: "West Bengal", lat: 22.9868, lng: 87.8550, city: "Kolkata" },
  { name: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, city: "Lucknow" }
];

async function main() {
  console.log("----- Starting Database Seeding -----");

  // 1. Clean Database
  console.log("Purging existing records...");
  await prisma.notification.deleteMany();
  await prisma.investigationNote.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.report.deleteMany();
  await prisma.investigationEvent.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.hotspot.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.aTM.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash Password for Users
  console.log("Generating password hashes...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 3. Create Users
  console.log("Registering system users...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@cyberintel.gov",
      password: hashedPassword,
      name: "Director General I4C",
      role: "ADMIN"
    }
  });

  const lea = await prisma.user.create({
    data: {
      email: "lea@cyberintel.gov",
      password: hashedPassword,
      name: "Inspector Rajesh Kumar",
      role: "LEA"
    }
  });

  const bank = await prisma.user.create({
    data: {
      email: "bank@cyberintel.gov",
      password: hashedPassword,
      name: "Nodal Officer Suresh Patel",
      role: "BANK",
      bankName: "State Bank of India"
    }
  });

  // 4. Seed ATMs (500+ ATMs)
  console.log("Seeding 500+ ATM node terminals...");
  const atmsData: any[] = [];
  const atmIds = ["ATM-Z03", "ATM-Z11", "ATM-Z07", "ATM-Z09", "ATM-Z05"];
  
  // Specific demo ATMs
  atmsData.push({ atmId: "ATM-Z03", locationName: "Dadar West Branch ATM Cluster 3", city: "Mumbai", state: "Maharashtra", latitude: 19.0210, longitude: 72.8424, riskLevel: "CRITICAL", withdrawalVelocity: 480000.0 });
  atmsData.push({ atmId: "ATM-Z11", locationName: "Bandra Reclamation Terminal ATM 11", city: "Mumbai", state: "Maharashtra", latitude: 19.0425, longitude: 72.8368, riskLevel: "HIGH", withdrawalVelocity: 350000.0 });
  atmsData.push({ atmId: "ATM-Z07", locationName: "Kurla East Hub ATM 7", city: "Mumbai", state: "Maharashtra", latitude: 19.0600, longitude: 72.8730, riskLevel: "HIGH", withdrawalVelocity: 290000.0 });
  atmsData.push({ atmId: "ATM-Z09", locationName: "Andheri West Station Gate ATM 9", city: "Mumbai", state: "Maharashtra", latitude: 19.1190, longitude: 72.8470, riskLevel: "CRITICAL", withdrawalVelocity: 520000.0 });
  atmsData.push({ atmId: "ATM-Z05", locationName: "Borivali West Metro Plaza ATM 5", city: "Mumbai", state: "Maharashtra", latitude: 19.2300, longitude: 72.8570, riskLevel: "MEDIUM", withdrawalVelocity: 180000.0 });

  // Generate 500 random ATMs in major states/cities
  for (let i = 1; i <= 510; i++) {
    const atmId = `ATM-${i.toString().padStart(3, '0')}`;
    if (atmIds.includes(atmId)) continue;

    const state = STATES[i % STATES.length];
    // Slightly offset center lat/lng of state to mimic scatter coordinates
    const latitude = state.lat + (Math.random() - 0.5) * 0.15;
    const longitude = state.lng + (Math.random() - 0.5) * 0.15;
    const riskLevel = Math.random() > 0.85 ? "CRITICAL" : Math.random() > 0.65 ? "HIGH" : Math.random() > 0.35 ? "MEDIUM" : "LOW";
    const withdrawalVelocity = parseFloat((Math.floor(Math.random() * 40) * 10000 + 50000).toString());

    atmsData.push({
      atmId,
      locationName: `${state.city} Roadside Cluster ATM ${i}`,
      city: state.city,
      state: state.name,
      latitude,
      longitude,
      riskLevel,
      withdrawalVelocity
    });
  }

  await prisma.aTM.createMany({ data: atmsData });
  console.log(`Seeded ${atmsData.length} ATMs.`);

  // 5. Seed Complaints (5,000+ complaints)
  console.log("Seeding 5000+ cybercrime complaints...");
  const complaintsData: any[] = [];
  const accountsData: any[] = [];
  const transactionsData: any[] = [];
  const alertsData: any[] = [];
  const timelineEventsData: any[] = [];
  const hotspotsData: any[] = [];
  const predictionsData: any[] = [];

  // Seed the first 5 core scenario cases with high fidelity details
  const activeCases = [
    { id: "CF-2026-00421", victim: "Ramesh Chandra", phone: "+91 9820012345", acc: "30291488102", bank: "State Bank of India", amount: 100000.0, category: "UPI Social Engineering", state: "Maharashtra", city: "Mumbai", lat: 19.076, lng: 72.877 },
    { id: "CF-2026-00422", victim: "Kishore Kumar", phone: "+91 9110294819", acc: "30921477401", bank: "ICICI Bank", amount: 240000.0, category: "Fake Investment Scam", state: "Karnataka", city: "Bengaluru", lat: 12.9716, lng: 77.5946 },
    { id: "CF-2026-00423", victim: "Arvind Swamy", phone: "+91 9444109823", acc: "30451122891", bank: "Union Bank of India", amount: 75000.0, category: "Loan Scam", state: "Tamil Nadu", city: "Chennai", lat: 13.0827, lng: 80.2707 },
    { id: "CF-2026-00424", victim: "Lata Mangeshkar", phone: "+91 9322049103", acc: "30114995208", bank: "Axis Bank", amount: 230000.0, category: "Multiple Victims Convergence", state: "Telangana", city: "Hyderabad", lat: 17.3850, lng: 78.4867 },
    { id: "CF-2026-00425", victim: "Sachin Tendulkar", phone: "+91 9821098765", acc: "30521480109", bank: "State Bank of India", amount: 350000.0, category: "Transaction Splitting", state: "Maharashtra", city: "Mumbai", lat: 19.076, lng: 72.877 }
  ];

  for (const c of activeCases) {
    complaintsData.push({
      id: c.id,
      victimName: c.victim,
      victimPhone: c.phone,
      victimAccount: c.acc,
      victimBank: c.bank,
      amount: c.amount,
      category: c.category,
      status: "UNDER_REVIEW",
      sourceCity: c.city,
      sourceState: c.state,
      sourceLat: c.lat,
      sourceLng: c.lng,
      createdAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
      assignedOfficerId: lea.id
    });

    // Baseline timeline
    timelineEventsData.push({
      caseId: c.id,
      stepNum: 1,
      title: "Complaint Logged",
      description: `Official cyber complaint registered for ${c.victim} on category ${c.category}.`
    });

    // Accounts
    accountsData.push({
      accountNumber: c.acc,
      holderName: c.victim,
      bankName: c.bank,
      ifscCode: "IFSC00102",
      phoneNumber: c.phone,
      riskScore: 5.0,
      classification: "SAFE",
      isMule: false
    });
  }

  // Generate 5,000 Complaints
  for (let i = 1; i <= 5000; i++) {
    const caseIdNum = 425 + i;
    const id = `CF-2026-00${caseIdNum}`;
    
    // Skip if conflict with core demo cases
    if (activeCases.some(ac => ac.id === id)) continue;

    const state = STATES[i % STATES.length];
    const category = CATEGORIES[i % CATEGORIES.length];
    const bank = BANKS[i % BANKS.length];
    const amount = parseFloat((Math.floor(Math.random() * 95) * 5000 + 10000).toString());
    const victimFirst = INDIAN_FIRST_NAMES[i % INDIAN_FIRST_NAMES.length];
    const victimLast = INDIAN_LAST_NAMES[(i + 1) % INDIAN_LAST_NAMES.length];
    const victimName = `${victimFirst} ${victimLast}`;
    const victimPhone = `+91 9${Math.floor(Math.random() * 900000000 + 100000000)}`;
    const victimAccount = `30${(i + 1000000).toString()}`;
    const status = i % 15 === 0 ? "RESOLVED" : i % 5 === 0 ? "INVESTIGATING" : i % 3 === 0 ? "UNDER_REVIEW" : "NEW";

    const dateOffsetMins = Math.floor(Math.random() * 20000);
    const createdAt = new Date(Date.now() - 60000 * dateOffsetMins);

    complaintsData.push({
      id,
      victimName,
      victimPhone,
      victimAccount,
      victimBank: bank,
      amount,
      category,
      status,
      sourceCity: state.city,
      sourceState: state.name,
      sourceLat: state.lat + (Math.random() - 0.5) * 0.1,
      sourceLng: state.lng + (Math.random() - 0.5) * 0.1,
      createdAt,
      assignedOfficerId: status !== "NEW" ? lea.id : null
    });

    if (i <= 100) {
      // Seed account profiles
      accountsData.push({
        accountNumber: victimAccount,
        holderName: victimName,
        bankName: bank,
        ifscCode: "IFSC00109",
        phoneNumber: victimPhone,
        riskScore: 4.5,
        classification: "SAFE",
        isMule: false
      });
    }
  }

  await prisma.complaint.createMany({ data: complaintsData });
  console.log(`Seeded ${complaintsData.length} Complaints.`);

  // 6. Seed Mules & Transactions (10,000+ Transactions)
  console.log("Seeding 10000+ financial transaction hops...");
  
  // Specific transactions for Dadar Scenario (CF-2026-00421)
  const dadarTx = [
    { id: "TXN-2026-90401", senderAccount: "30291488102", receiverAccount: "MULE-A457", amount: 100000.0, transactionType: "UPI", riskScore: 99.0, isSimulated: false, linkedComplaintId: "CF-2026-00421", timestamp: new Date(Date.now() - 3600000 * 3.5) },
    { id: "TXN-2026-90402", senderAccount: "MULE-A457", receiverAccount: "MULE-B821", amount: 60000.0, transactionType: "IMPS", riskScore: 78.0, isSimulated: false, linkedComplaintId: "CF-2026-00421", timestamp: new Date(Date.now() - 3600000 * 3.0) },
    { id: "TXN-2026-90403", senderAccount: "MULE-A457", receiverAccount: "MULE-C912", amount: 30000.0, transactionType: "IMPS", riskScore: 85.0, isSimulated: false, linkedComplaintId: "CF-2026-00421", timestamp: new Date(Date.now() - 3600000 * 2.8) },
    { id: "TXN-2026-90407", senderAccount: "MULE-A457", receiverAccount: "MULE-C912", amount: 10000.0, transactionType: "IMPS", riskScore: 85.0, isSimulated: false, linkedComplaintId: "CF-2026-00421", timestamp: new Date(Date.now() - 3600000 * 2.7) },
    { id: "TXN-2026-90404", senderAccount: "MULE-C912", receiverAccount: "ATM-Z03", amount: 26000.0, transactionType: "ATM_WITHDRAWAL", riskScore: 91.0, isSimulated: false, linkedComplaintId: "CF-2026-00421", timestamp: new Date(Date.now() - 3600000 * 2.5) }
  ];
  dadarTx.forEach(tx => transactionsData.push(tx));

  // Dadar accounts
  accountsData.push({ accountNumber: "MULE-A457", holderName: "Mohammad Farooq", bankName: "Canara Bank", ifscCode: "CNRB0001042", phoneNumber: "+91 9876543210", riskScore: 91.0, classification: "HIGH_RISK", isMule: true, linkedCaseId: "CF-2026-00421" });
  accountsData.push({ accountNumber: "MULE-B821", holderName: "Karan Malhotra", bankName: "Punjab National Bank", ifscCode: "PUNB0249100", phoneNumber: "+91 9123456789", riskScore: 78.0, classification: "SUSPICIOUS", isMule: true, linkedCaseId: "CF-2026-00421" });
  accountsData.push({ accountNumber: "MULE-C912", holderName: "Sunil Dutt Gowda", bankName: "Union Bank of India", ifscCode: "UBIN0542318", phoneNumber: "+91 9456781230", riskScore: 88.0, classification: "HIGH_RISK", isMule: true, linkedCaseId: "CF-2026-00421" });

  // Dadar predictions / hotspots / alerts
  predictionsData.push({ caseId: "CF-2026-00421", sourceAccount: "MULE-A457", targetEntity: "ATM-Z03", probability: 0.82, predictedType: "CASH_OUT", timeWindowMins: 30, factors: JSON.stringify({ "Withdrawal Velocity Spike": 40, "Dadar geographical match": 35 }) });
  hotspotsData.push({ caseId: "CF-2026-00421", locationName: "Dadar West Branch ATM Cluster 3", city: "Mumbai", state: "Maharashtra", latitude: 19.0210, longitude: 72.8424, riskScore: 82.0, riskLevel: "CRITICAL", predictedWindowMins: 60, factors: JSON.stringify({ "Withdrawal Velocity Spike": 40, "Dadar geographical match": 35 }) });
  alertsData.push({ caseId: "CF-2026-00421", severity: "CRITICAL", title: "Dadar ATM Withdrawal Predicted", description: "Inference triggers matching patterns for ATM dadar west. Velocity and proximity check validated.", accountNumber: "MULE-C912", amountAtRisk: 26000.0, status: "ACTIVE" });

  // Auto-generate transaction paths for the first 100 cases
  for (let i = 1; i <= 100; i++) {
    const complaint = complaintsData[i];
    if (!complaint || complaint.id === "CF-2026-00421") continue;

    const victimAcc = complaint.victimAccount;
    const m1 = `MULE-${complaint.id.split('-').pop()}A`;
    const m2 = `MULE-${complaint.id.split('-').pop()}B`;
    const atmId = ATM_LIST_INDEX(i);

    // Accounts
    accountsData.push({
      accountNumber: m1,
      holderName: `${complaint.victimName} Handler A`,
      bankName: complaint.victimBank,
      ifscCode: "IFSC00192",
      phoneNumber: "+91 9882200119",
      riskScore: 88.0,
      classification: "HIGH_RISK",
      isMule: true,
      linkedCaseId: complaint.id
    });
    accountsData.push({
      accountNumber: m2,
      holderName: `${complaint.victimName} Handler B`,
      bankName: BANKS[i % BANKS.length],
      ifscCode: "IFSC00193",
      phoneNumber: "+91 9882200120",
      riskScore: 92.0,
      classification: "HIGH_RISK",
      isMule: true,
      linkedCaseId: complaint.id
    });

    // Transactions
    const txTime = new Date(complaint.createdAt);
    const amount = complaint.amount;
    transactionsData.push({
      id: `TXN-2026-${i}0001`,
      senderAccount: victimAcc,
      receiverAccount: m1,
      amount,
      transactionType: "UPI",
      riskScore: 91.0,
      isSimulated: false,
      linkedComplaintId: complaint.id,
      timestamp: new Date(txTime.getTime() + 15 * 60000)
    });
    transactionsData.push({
      id: `TXN-2026-${i}0002`,
      senderAccount: m1,
      receiverAccount: m2,
      amount: amount * 0.7,
      transactionType: "IMPS",
      riskScore: 83.0,
      isSimulated: false,
      linkedComplaintId: complaint.id,
      timestamp: new Date(txTime.getTime() + 35 * 60000)
    });
    transactionsData.push({
      id: `TXN-2026-${i}0003`,
      senderAccount: m2,
      receiverAccount: atmId,
      amount: amount * 0.4,
      transactionType: "ATM_WITHDRAWAL",
      riskScore: 95.0,
      isSimulated: false,
      linkedComplaintId: complaint.id,
      timestamp: new Date(txTime.getTime() + 50 * 60000)
    });

    // Seed prediction
    predictionsData.push({
      caseId: complaint.id,
      sourceAccount: m2,
      targetEntity: atmId,
      probability: 0.80,
      predictedType: "CASH_OUT",
      timeWindowMins: 45,
      factors: JSON.stringify({ "High temporal density": 45, "Atm velocity match": 35 })
    });
  }

  // Helper function to resolve ATM targets
  function ATM_LIST_INDEX(idx: number): string {
    const list = ["ATM-Z03", "ATM-Z11", "ATM-Z07", "ATM-Z09", "ATM-Z05"];
    return list[idx % list.length];
  }

  // Create accounts
  await prisma.account.createMany({ data: accountsData });
  console.log(`Seeded ${accountsData.length} Accounts.`);

  // Generate background noise transactions (up to 10,000+ total transactions)
  const bgTxCount = 10000 - transactionsData.length;
  console.log(`Generating ${bgTxCount} background noise transactions...`);
  
  for (let j = 0; j < bgTxCount; j++) {
    const sender = `30${(j + 200000).toString()}`;
    const receiver = `30${(j + 300000).toString()}`;
    const amt = parseFloat((Math.floor(Math.random() * 20) * 1000 + 500).toString());
    const type = Math.random() > 0.8 ? "RTGS" : Math.random() > 0.5 ? "IMPS" : "UPI";
    const risk = Math.random() > 0.95 ? 75.0 : 5.0;

    transactionsData.push({
      id: `TXN-BG-${1000000 + j}`,
      senderAccount: sender,
      receiverAccount: receiver,
      amount: amt,
      transactionType: type,
      riskScore: risk,
      isSimulated: false,
      timestamp: new Date(Date.now() - 3600000 * Math.floor(Math.random() * 240))
    });
  }

  await prisma.transaction.createMany({ data: transactionsData });
  console.log(`Seeded ${transactionsData.length} Transactions.`);

  // Write Predictions / Hotspots / Alerts
  await prisma.prediction.createMany({ data: predictionsData });
  await prisma.hotspot.createMany({ data: hotspotsData });
  await prisma.alert.createMany({ data: alertsData });
  await prisma.investigationEvent.createMany({ data: timelineEventsData });

  // 7. Audit log seeding
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      username: admin.email,
      role: admin.role,
      action: "DATABASE_INITIALIZATION",
      resource: "Database",
      result: "SUCCESS",
      ipAddress: "127.0.0.1"
    }
  });

  console.log("----- Database Seeding Completed Successfully -----");
}

main()
  .catch((e) => {
    console.error("Seeding Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
