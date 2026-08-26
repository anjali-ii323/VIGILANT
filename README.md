  * # VIGILANT
### Predictive Analytics Command Center for Real-Time Cybercrime Complaint Interdiction
**Smart India Hackathon Prototype - Problem Statement SIH26184**

---

### Executive Summary
Traditional cybercrime systems trace bank account money trails retrospectively, often discovering where stolen funds went days after the money has been physically withdrawn at ATMs. 

Vigilant shifts cyber investigation from retrospective tracking to proactive interdiction. By analyzing banking transactions in real time, the platform maps layering paths, predicts the next logical account hop, forecasts physical ATM cash-out hotspots, and automates freeze requests—intercepting cyber criminals before withdrawals occur.

---

### The Innovation: Why This Solution Wins
* **Retrospective to Predictive Transition**: Vigilant identifies transaction chains at high velocities, predicting next-movement locations within minutes of complaint registration.
* **Explainable AI Anomaly Engine**: The system does not present black-box results. All threat scores are broken down by contributing mathematical weights (transaction velocities, split-amount ratios, timing anomalies) for judicial validation.
* **Automated Enforcement (NPCI & Police Hops)**: Integrates action-triggering gateways to directly notify National Payments Corporation of India (NPCI) nodes to lock suspect accounts and dispatch geolocated alerts to local patrol units near targeted ATMs.
* **WebSocket Live Telemetry Feed**: Real-time server-client pipelines ensure transaction streams and active alarms are visualised in the command center with zero polling delay.

---

### System Architecture & Tech Stack

#### 1. Ingestion Layer
* **FastAPI Router**: High-throughput REST API and WebSockets server managing transaction pipelines.
* **SQLAlchemy ORM**: Flexible object-relational abstraction layer.
* **SQLite / PostgreSQL**: Relational database storing victim profiles, ledger records, and ATM directories.

#### 2. Machine Learning Analytics
* **Isolation Forest Classifier**: Scikit-Learn based anomaly classifier trained on transaction attributes to identify suspicious mule accounts.
* **Markovian Next-Hop Predictor**: Transition probability predictor forecasting the next target account path.
* **ATM Hotspot Heuristics Model**: Relates historical withdrawal velocities and geodetic distances to forecast exact cash-out terminals.

#### 3. Surveillance UI
* **React (Vite + TypeScript)**: Responsive single-page application framework.
* **SVG DAG Network Graph**: Dynamic Directed Acyclic Graph rendering money trails on the fly from database records.
* **Leaflet & OpenStreetMap**: Vector-mapped geospatial plotting of ATM coordinates and predicted zones.
* **Tailwind CSS**: Low-latency, high-performance styling layout.

---

### System Execution Guide

#### Method A: Docker Compose (Recommended)
Verify Docker is running on your system, then execute:
```bash
# Clone and enter the repository folder
cd calm-nobel

# Build and start the platform containers
docker-compose up --build
