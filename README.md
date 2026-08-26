# Vigilant
### Proactive Financial Cybercrime Intelligence and Cash-Out Prediction Platform
**Smart India Hackathon Prototype - SIH26184**

---

### Simulation Mode Disclaimer
This application is a functional prototype built for the Smart India Hackathon (Problem Statement SIH26184). It operates using simulated banking trails and does not connect to production banking cores, NPCI gateways, police databases, or official I4C portals.

---

### Project Overview
Cybercriminals layer stolen funds at high velocities, transferring resources across multiple intermediary accounts in minutes before withdrawing them as cash. Traditional investigative responses are retrospective, identifying withdrawal locations days after the funds have disappeared.

**Vigilant** shifts response operations from retrospective tracking to proactive intervention. The platform monitors transaction networks, evaluates recipient node anomalies, forecasts the most likely next destination hops, and identifies ATM cash-out hotspots—providing law enforcement officers with actionable windows to initiate freeze blocks.

---

### Core Architecture
* **Frontend**: React (Vite + TypeScript), Tailwind CSS, Recharts (timeseries velocity visualization), Leaflet + OpenStreetMap (geospatial predictive mapping), and interactive SVG relationship graphs.
* **Backend**: Python, FastAPI, SQLAlchemy ORM, WebSockets (real-time telemetry broadcasting).
* **Database**: SQLite (local database configuration).
* **Machine Learning**: Isolation Forest anomaly classifiers and a next-hop transition probability predictor.

---

### Setup and Execution

#### Option A: Docker Compose (Recommended)
Ensure Docker and Docker Compose are installed on the host system:
1. Navigate to the project root directory:
   ```bash
   cd calm-nobel
   ```
2. Build and run the containers:
   ```bash
   docker-compose up --build
   ```
3. Access points:
   * Frontend Command Center: `http://localhost:5173`
   * FastAPI Swagger API Documentation: `http://localhost:8000/docs`

---

#### Option B: Manual Local Setup

##### 1. Backend Setup
Ensure Python 3.10+ is installed:
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Initialize and activate a virtual environment:
   * On Windows:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * On macOS/Linux:
     ```bash
     python -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend web server (the database is automatically initialized and seeded on startup):
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

##### 2. Frontend Setup
Ensure Node.js 18+ is installed:
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the user interface at: `http://localhost:5173`

---

### Guided Hackathon Presentation Workflow
Use this structured sequence during evaluation to demonstrate the platform:

1. **Dashboard Overview**
   * Access the Overview page (`http://localhost:5173`). Highlight the operational metrics (Funds Under Risk, Active Cases, and Transacting Velocity).
   * Select case `CF-2026-00421` from the priority queue and click **Investigate**.

2. **Case Workspace and Evidence**
   * Review Case `CF-2026-00421` information. Note the complainant's profile and details.
   * Access the **Evidence** tab to inspect uploaded cyber complaints and KYC files.

3. **Money Trail Animation**
   * Open the **Money Trail** tab in the workspace.
   * Click **Play Trail Sequence** to watch the visual transaction hops build sequentially: Victim to Mule A, splitting to Mule B and C, and leading to Dadar ATM cash-out. Click nodes to inspect associated KYC details.

4. **Account Risk Auditing**
   * Open the **Risk Intelligence** section (or the **Accounts** tab). Inspect the Canara Bank account `MULE-A457`.
   * Show that the 91% risk rating is derived from explainable factors (velocity anomalies, split-amount ratios, etc.).

5. **Next Movement Prediction**
   * Open the **Predictions** tab. Under `MULE-B821` (holding ₹25,000), review the next-hop predictive list (e.g., 78% probability of transferring to `MULE-C912`).
   * Trigger a simulated transaction step. The system updates via WebSockets, creating a new ledger record, escalating threat ratings, and generating live alerts.

6. **ATM Cash-Out Hotspot Mapping**
   * Open the **Live Monitoring** page to review active threats. Note the geospatial Leaflet map.
   * Click the pulsing red marker representing **ATM-Z03 (Dadar West)**. Highlight the predicted withdrawal window (20–40 mins) and risk factors.

7. **Proactive Intervention Action**
   * In the case detail sidebar, click the **PROACTIVE ACTION** action button.
   * Transmit a mock cryptographic freeze block to NPCI / banking endpoints. The system logs the lock on the ledger, updates the case status to "RESOLVED", and displays the clearance indicator.
