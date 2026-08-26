# FinTrace AI 🛡️
### "Proactive Financial Cybercrime Intelligence & Cash-Out Prediction Platform"
**Smart India Hackathon Prototype - SIH26184**

> **🚨 SIMULATION MODE DISCLAIMER**: This application is a fully functional prototype designed for SIH26184. It uses simulated synthetic banking trails. It does NOT connect to real production banks, police database systems, NPCI, or I4C portals.

---

## 💡 The Core Problem & Product Story
Cyber fraud criminals layer money at rapid velocities, transferring funds across multiple accounts in minutes before withdrawing them as cash. Traditional systems discover where money went *days after* cash withdrawals are completed. 

**FinTrace AI** shifts response from retrospective to **proactive**. It continuously follows transaction chains, evaluates anomalies, predicts the most likely next destination hops, and flags high-risk ATM clusters—giving response officers critical time to initiate freeze locks.

---

## 🛠️ Technology Stack
- **Frontend**: React (Vite + TypeScript), Tailwind CSS, Recharts (timeseries velocities), Leaflet + OpenStreetMap (geospatial mapping), Custom interactive SVG graph visualization (money trail topologies).
- **Backend**: Python, FastAPI, SQLAlchemy ORM, WebSockets (real-time stream synchronization).
- **Database**: SQLite (default for instant setup), ready for PostgreSQL / PostGIS.
- **Machine Learning**: `scikit-learn` Isolation Forest (anomaly detection) and a Markov sequence transition probability predictor with explainable AI factor breakdowns.

---

## 🚀 Execution & Setup Guide

### Method A: Docker Compose (Recommended)
Make sure you have Docker and Docker Compose installed:
```bash
# 1. Clone the repository and enter the directory
cd calm-nobel

# 2. Spin up the containers
docker-compose up --build
```
- Access the **Frontend UI**: `http://localhost:5173`
- Access the **FastAPI Swagger Docs**: `http://localhost:8000/docs`

---

### Method B: Manual Local Setup (Run out of the box)

#### 1. Backend Setup
Ensure you have Python 3.10+ installed:
```bash
# Enter backend folder
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server (automatically seeds the database on first run)
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
Ensure you have Node.js 18+ installed:
```bash
# Enter frontend folder
cd frontend

# Install package dependencies
npm install

# Run Vite dev server
npm run dev
```
Open your browser to `http://localhost:5173` to explore the command center.

---

## 📺 Guided Hackathon Presentation Workflow

Follow this sequence to showcase the platform's core real-time intelligence capability to the judges:

1. **Step 1: Dashboard Overview**
   - Open `Overview` (`http://localhost:5173`). Show the operational metrics (₹2.84 Cr Funds Under Risk, high-risk accounts, hourly transacting velocities).
   - Point out Case **`CF-2026-00421`** at the top of the priority list. Click **Investigate**.
2. **Step 2: Case Workspace & Evidence**
   - Review Case `CF-2026-00421`. Show the horizontal pipeline steps and the victim's profile.
   - Go to the **Evidence** tab to show recorded cyber portal complaints.
3. **Step 3: Animate the Money Trail**
   - Open the **Money Trail** tab. Click **Play Trail Sequence**. 
   - Watch the graph animate sequentially: Victim $\to$ Mule A $\to$ split to Mule B and C $\to$ Dadar ATM cash-out. Click nodes to load holder KYC records.
4. **Step 4: Audit Account Risk**
   - Go to **Risk Intelligence** (or the **Accounts** tab). Inspect Canara Bank account `MULE-A457`.
   - Point out that the 91% risk score is fully explainable (Rapid fund movement $+24$, splitting $+14$, etc.), showing judges it is not a black-box AI guess.
5. **Step 5: Predict Next Hop & Simulate**
   - Open **Next-Movement Prediction**. Under `MULE-B821` (which still holds ₹25,000), review predicted next hops (78% probability of transferring to `MULE-C912`).
   - Click the red **GENERATE NEXT TRANSACTION** button. 
   - *Watch the screen update live!* The system simulates the transfer, pushes WebSocket packets, registers a new transaction, escalates C912's risk score, and issues a critical alert.
6. **Step 6: Map ATM Cash-Out Threats**
   - Open **Cash-Out Prediction**. Look at the OpenStreetMap Leaflet viewport.
   - Locate the pulsing red marker for **ATM-Z03 (Dadar West)**. Point out the estimated cash-out withdrawal window (20–40 mins) and distance calculation factors.
7. **Step 7: Proactive Lock Command**
   - Go back to the **Mule Accounts** card. Click the **PROACTIVE ACTION** action button.
   - Instantly send a cryptographic freeze request to PNB and SBI. The system records the lock, updates the timeline, and marks the case as "RESOLVED" with a green shield.
   - Showcase this immediate intervention flow to judges as the ultimate value proposition.
