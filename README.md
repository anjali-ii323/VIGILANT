# VIGILANT

### Predictive Intelligence for Proactive Cyber-Fraud Intervention
**Smart India Hackathon Prototype &mdash; Problem Statement SIH26184**

> *"From tracing where the money went to predicting where it is likely to go next."*

---

## Simulation Mode & Synthetic Data Notice
This application is a functional cybercrime intelligence workstation built for the **Smart India Hackathon (Problem Statement SIH26184)**. It operates strictly on **synthetic, mathematically generated banking trails** and local machine learning models. It does not connect to live NPCI, I4C, police, or government banking networks.

---

## The Problem

Cyber-fraud investigations are often reactive. By the time a transaction trail is reconstructed, fraudulent funds may have already moved through multiple intermediary or mule accounts and been withdrawn as cash.

This creates a critical operational bottleneck:
**Fraud Reported &rarr; Investigation &rarr; Money Traced &rarr; Cash Already Withdrawn**

VIGILANT shifts this workflow towards proactive interdiction:
**Fraud Reported &rarr; Transaction Intelligence &rarr; Prediction &rarr; Alert &rarr; Proactive Freeze**

---

## What is VIGILANT?

VIGILANT is a predictive analytics and intelligence platform designed to help Law Enforcement Agencies identify suspicious financial activity and estimate the next likely movement and cash-out location of fraudulent funds.

Instead of analysing only where the money has already moved, VIGILANT analyses:
* Multi-hop transaction relationships (Directed Acyclic Graphs)
* Account behavioral anomaly scores
* Transaction velocity and time-of-flight
* Amount-splitting and structuring patterns
* Geospatial relationships between transactions and ATM cash-out clusters

The system converts these signals into actionable operational intelligence:
**Explainable Risk Score + Predicted Next Hop + Top Cash-Out Hotspots + Expected Time Window (20–40 min)**

---

## System Architecture

```text
                                    VIGILANT ARCHITECTURE
  
  [ Browser Client ]
          |
  [ React 18 + TypeScript + Tailwind CSS ]  <--- (Dark Editorial Cybercrime Workstation)
          |
  [ HTTP REST API & WebSockets ]
          |
  [ FastAPI Backend Core (Python 3.12) ]
     ├── ML Anomaly Engine (Scikit-Learn Isolation Forest)
     ├── Probabilistic Transition Matrix (Markov Sequence Forecaster)
     ├── Geospatial Hotspot Classifier (Leaflet + OpenStreetMap)
     └── Cryptographic Freeze & Audit Gateway
          |
  [ SQLite Relational Store (20 Complete Synthetic Fraud Topologies) ]
```

---

## Key Workstation Capabilities

1. **Presentation Landing (`Landing.tsx`)**:
   Capability overview with capability metrics (`99.4%` anomaly precision, `20–40 min` lead time) and one-click workstation entry.

2. **Command Intelligence Center (`Overview.tsx`)**:
   Real-time fund movement DAG with animated transit pulses, priority threat action cards, and live WebSocket telemetry.

3. **Case Intelligence & 8-Tab Workspace (`Cases.tsx`)**:
   Comprehensive case repository with multi-attribute filtering and 8 active tabs:
   * **Case Summary**: Verified complainant KYC & modus operandi.
   * **Money Trail**: SVG graph with playable step-by-step **Transaction Replay**.
   * **Accounts KYC**: Table of victim and mule accounts with one-click Watchlist and Freeze actions.
   * **Destination Predictions**: Markov transition probability matrix.
   * **Cash-Out Map**: Dark Leaflet map with geocoded ATM threat clusters.
   * **Alerts**: Operational queue for threshold alarms.
   * **Evidence Locker**: Verified judicial records with SHA256 checksums.
   * **Timeline & Notes**: Chronological investigation milestones & persistent notes.

4. **Money Network Explorer (`TransactionNetwork.tsx`)**:
   Multi-case topology visualizer with 1-hop search expansion, entity filters, and node/edge inspection drawers.

5. **Explainable Risk Intelligence (`RiskIntelligence.tsx`)**:
   Mathematical point attribution breakdowns (`+24 velocity`, `+19 senders`, `+14 splitting`) paired with behavioral justifications and velocity timeline charts.

6. **Next-Movement Destination Forecasting (`NextMovement.tsx`)**:
   Markov probability rankings (`78% C912`, `13% D441`, `6% ATM-Z04`) with interactive **"Generate Next Transaction"** simulation triggers.

7. **Geospatial Cash-Out Intercept (`CashOut.tsx`)**:
   Dark OpenStreetMap Leaflet map with ATM clusters, withdrawal window forecasts, and tactical patrol dispatch buttons.

8. **Printable Dossier Reports & Case Comparison (`Reports.tsx` & `CaseComparison.tsx`)**:
   Court-ready printable intelligence dossiers, CSV ledger exports, and side-by-side case topology comparisons.

---

## Quick Start & Execution

### Option A: One-Click Startup (Windows)
Double-click **`run.bat`** in the root directory.
* Automatically verifies environment, loads SQLite database, and launches the unified server.
* Open your browser at: **`http://localhost:8000`**

---

### Option B: Manual Execution

#### 1. Backend & Unified Server
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m app.seed
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### 2. Frontend Development Server (Optional for Dev Mode)
```bash
cd frontend
npm install
npm run dev
```
* **Frontend Dev Mode**: `http://localhost:5173`
* **FastAPI Backend & Unified App**: `http://localhost:8000`
* **Swagger API Documentation**: `http://localhost:8000/docs`

---

## Zero External API Key Requirement
VIGILANT requires **zero external API keys** (no OpenAI, Google Gemini, Mapbox, or commercial banking keys). All ML scoring, Markov transition predictions, and geospatial tile mappings execute locally and self-contained on CPU.

---

## License & Acknowledgments
Built for **Smart India Hackathon 2026 (SIH26184)**.
All synthetic datasets, accounts, names, and transaction records are simulated for technological demonstration purposes.
