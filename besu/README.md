# Hyperledger Besu Permissioned Blockchain Network for VIGILANT

This directory contains the Docker Compose cluster, genesis configuration, and deployment scripts for the **VIGILANT** permissioned audit ledger.

---

## 1. Quick Start: Launching the Network

### Step 1: Start the Hyperledger Besu Multi-Node Cluster
```bash
docker compose -f besu/docker-compose.yml up -d
```
* **RPC Endpoint:** `http://127.0.0.1:8545`
* **WebSocket Endpoint:** `ws://127.0.0.1:8546`
* **Consensus:** QBFT / PoA (1-second block periods, 0 gas price)

### Step 2: Deploy `AuditLedger.sol`
```bash
python besu/deploy.py
```
This will compile `contracts/AuditLedger.sol`, deploy it to the Besu node, and configure `AUDIT_CONTRACT_ADDRESS` in `.env`.

### Step 3: Start Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

---

## 2. Testing & Verification

### Run Automated Test Suite
```bash
cd backend
pytest tests/test_blockchain_audit.py -v
```

### Verify Integrity via API
```bash
curl -X POST http://127.0.0.1:8000/api/audit-logs/verify
```

### Test Tamper Detection (Demo)
```bash
curl -X POST http://127.0.0.1:8000/api/audit-logs/simulate-tamper \
  -H "Content-Type: application/json" \
  -d '{"log_id": "AUD-2026-0001", "tampered_details": "Malicious Modification"}'
```
Then call verify again to observe `TAMPERING_DETECTED`!

---

## 3. Stopping and Restarting

### Stop Network
```bash
docker compose -f besu/docker-compose.yml down
```

### Restart with Persistent State
```bash
docker compose -f besu/docker-compose.yml start
```
