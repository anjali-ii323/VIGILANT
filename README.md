   # VIGILANT

### Predictive Intelligence for Proactive Cyber-Fraud Intervention

**Smart India Hackathon Prototype — Problem Statement SIH26184**

> From tracing where the money went to predicting where it is likely to go next.

---

## The Problem

Cyber-fraud investigations are often reactive. By the time a transaction trail is reconstructed, fraudulent funds may have already moved through multiple intermediary or mule accounts and been withdrawn as cash.

This creates a critical gap:

**Fraud Reported → Investigation → Money Traced → Cash Withdrawn**

VIGILANT aims to shift this workflow towards proactive intervention:

**Fraud Reported → Transaction Intelligence → Prediction → Alert → Intervention**

---

## What is VIGILANT?

VIGILANT is a predictive analytics and intelligence platform designed to help Law Enforcement Agencies identify suspicious financial activity and estimate the next likely movement and cash-out location of fraudulent funds.

Instead of analysing only where the money has already moved, VIGILANT analyses:

* Transaction relationships
* Multi-hop money movement
* Account behaviour
* Transaction velocity
* Amount-splitting patterns
* Temporal anomalies
* Historical fraud patterns
* Geospatial relationships between transactions and cash-out points

The system converts these signals into actionable intelligence:

**Risk Score + Predicted Next Hop + Top Cash-out Hotspots + Expected Time Window**

---

## Core Innovation

### From Retrospective Investigation to Predictive Intervention

Traditional investigation primarily answers:

> Where did the money go?

VIGILANT additionally attempts to answer:

> Where is the money likely to go next?

This enables investigators to receive intelligence about probable future cash-out activity and prioritize appropriate preventive action.

---

## How VIGILANT Works

```text
Cyber Fraud Data
      |
      v
Transaction Graph Construction
      |
      v
Risk & Anomaly Analysis
      |
      v
Next-Hop Prediction
      |
      v
Cash-out Hotspot Prediction
      |
      v
Risk Score + Top 3 Locations
      |
      v
LEA Alert
      |
      v
Proactive Intervention
```

---

## Key Capabilities

### 1. Multi-Hop Transaction Intelligence

VIGILANT represents financial activity as a connected transaction network.

Example:

```text
Victim
   |
   v
Mule Account
   |
   v
Intermediary Account
   |
   v
Cash-out Point
```

This allows investigators to analyse relationships that may not be visible when transactions are examined individually.

---

### 2. Anomaly and Mule Account Detection

The platform analyses transaction behaviour to identify suspicious patterns such as:

* Unusual transaction velocity
* Sudden inflow or outflow spikes
* Rapid movement of funds
* Repeated split transactions
* Abnormal transaction timing
* Unusual account activity

The prototype uses **Isolation Forest** to generate anomaly signals from transaction-level features.

A high-risk score is treated as an investigative indicator and does not by itself establish criminal liability.

---

### 3. Next-Hop Prediction

After identifying suspicious transaction behaviour, VIGILANT estimates the most probable next account transition.

The prototype uses a **Markov Transition Model** to estimate transition probabilities from available historical or simulated transaction data.

Example:

```text
Current Account
      |
      +---- Account A    18%
      |
      +---- Account B    67%   <- Most Probable
      |
      +---- Account C    15%
```

The predicted transition is subsequently used as an input for cash-out forecasting.

---

### 4. Predictive Cash-out Intelligence

VIGILANT combines transaction, behavioural, temporal and geospatial signals to rank potential cash-out locations.

Example:

```text
Rank 1
Location A
Confidence: 82%
Expected Window: ~18 min

Rank 2
Location B
Confidence: 64%

Rank 3
Location C
Confidence: 51%
```

The system provides ranked possibilities rather than treating a prediction as a guaranteed outcome.

---

## Geospatial Intelligence

The platform uses ATM and location data to analyse relationships between:

* Previous transaction locations
* Known cash-out points
* Geographic distance
* Historical withdrawal behaviour
* Time patterns
* Predicted transaction movement

The resulting intelligence is presented through an interactive map with risk-ranked hotspots.

---

## Explainable Risk Scoring

VIGILANT is designed to provide interpretable risk signals rather than presenting predictions without context.

Potential contributing factors include:

```text
Transaction Velocity
Amount Pattern
Timing Anomaly
Account Behaviour
Network Connectivity
Historical Similarity
```

These factors can be presented alongside the overall risk score to help investigators understand why an event has been prioritized.

---

## Real-Time Monitoring

VIGILANT uses a WebSocket-based telemetry layer to update the command center as new events are received.

The monitoring interface can display:

* Newly detected suspicious transactions
* Active alerts
* Current risk levels
* Predicted cash-out locations
* Expected time windows
* Current hotspot status
* Data-feed and system status

### Separation of Functions

**Cases**
Detailed investigation information and money trails.

**Transaction Network**
Interactive relationships between accounts and transactions across cases.

**Live Monitoring**
Real-time activity, alerts and current predictions.

---

## Transaction Network

The platform provides an interactive transaction graph where:

* Nodes represent accounts or relevant entities
* Edges represent transactions
* Arrows represent money movement
* Transaction amounts and timestamps provide context
* Suspicious nodes can be highlighted
* Multiple cases can be searched and explored

Investigators can search using:

**Case ID | Account ID | Transaction ID**

The corresponding transaction network can then be retrieved and examined.

---

## LEA Intelligence Dashboard

The dashboard consolidates investigation and predictive intelligence into a single interface.

### Dashboard

* Active cases
* Risk statistics
* Recent alerts
* Predicted hotspots

### Cases

* Case information
* Financial information
* Money trail
* Investigation status

### Transaction Network

* Account relationships
* Multi-hop transaction visualization
* Search and filtering
* Transaction-level details

### Live Monitoring

* Real-time suspicious activity
* Active alerts
* Current predictions

### Hotspot Map

* ATM locations
* Risk zones
* Predicted cash-out locations

---

## System Architecture

```text
                    DATA SOURCES
                         |
          +--------------+--------------+
          |                             |
   Transaction Data               Complaint Data
          |                             |
          +--------------+--------------+
                         |
                         v
                  FASTAPI BACKEND
                         |
             +-----------+-----------+
             |                       |
             v                       v
     Transaction Engine       WebSocket Layer
             |                       |
             v                       v
      ML / Analytics          Live Dashboard
             |
       +-----+------+
       |            |
       v            v
 Anomaly Model   Next-Hop Model
       |            |
       +-----+------+
             |
             v
     ATM Hotspot Engine
             |
             v
      Predictive Intel
             |
             v
          LEA UI
```

---

## Technology Stack

### Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* Leaflet
* OpenStreetMap
* SVG-based transaction visualization

### Backend

* Python
* FastAPI
* WebSockets
* SQLAlchemy

### AI and Machine Learning

* Scikit-learn
* Isolation Forest
* Markov Transition Model
* Pandas
* NumPy
* Graph-based transaction analysis

### Database

* SQLite for prototype and local development
* PostgreSQL for scalable deployment

### Infrastructure

* Docker
* Docker Compose

---

## Security and Responsible Use

VIGILANT is designed as an investigative decision-support system.

The platform:

* Uses risk scores as investigative indicators
* Does not automatically determine criminal liability
* Supports human verification before enforcement
* Minimizes unnecessary exposure of sensitive information
* Can apply redaction to sensitive fields
* Maintains action and audit records where implemented

Real-world integration with banking systems, NPCI infrastructure or Law Enforcement Agency systems would require authorized institutional APIs, legal approvals and appropriate security controls.

---

## End-to-End Workflow

```text
Cyber Fraud Report
       |
       v
Transaction Data Ingestion
       |
       v
Transaction Network Construction
       |
       v
Anomaly and Mule Detection
       |
       v
Risk Scoring
       |
       v
Next-Hop Prediction
       |
       v
Cash-out Hotspot Prediction
       |
       v
LEA Alert
       |
       v
Human Verification
       |
       v
Proactive Intervention
       |
       v
Outcome and Feedback
       |
       v
Future Model Improvement
```

---

## Example Intelligence Output

### High-Risk Case

**Case ID:** VG-2026-1042
**Reported Fraud Amount:** ₹2,40,000
**Risk Score:** 91/100

**Transaction Pattern**

3-hop movement detected with abnormal transaction velocity.

**Predicted Next Hop**

Account B — 67% transition probability

**Predicted Cash-out Locations**

| Rank | Location   | Confidence | Expected Window |
| ---- | ---------- | ---------- | --------------- |
| 1    | ATM Zone A | 82%        | ~18 min         |
| 2    | ATM Zone B | 64%        | ~31 min         |
| 3    | ATM Zone C | 51%        | ~44 min         |

**Priority:** High

> Predictions are intelligence signals intended to support authorized investigation and should be validated before operational action.

---

## Prototype Status

VIGILANT is currently a **prototype and proof-of-concept**.

The prototype demonstrates:

* Transaction ingestion
* Case management
* Transaction network visualization
* Risk and anomaly analysis
* Next-hop prediction
* Cash-out hotspot prediction
* Interactive geospatial visualization
* Real-time dashboard updates
* Searchable transaction networks

Production integrations such as live banking feeds, NPCI infrastructure, official LEA systems and account-freezing workflows are **future integration requirements** and are not represented as live production integrations in this prototype.

---

## Running the Project

### Prerequisites

* Python 3.10+
* Node.js 18+
* npm
* Docker (optional)

### Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn main:app --reload
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

### Docker

```bash
docker compose up --build
```

---

## Future Scope

### Real-Time Financial Data Integration

Integration with authorized banking and payment data sources.

### Advanced Graph Analytics

Graph-based machine learning approaches for complex fraud networks.

### Improved Spatiotemporal Prediction

Combination of time-series and geospatial modelling for improved cash-out forecasting.

### Privacy-Preserving Intelligence

Enhanced anonymization, access control and privacy-preserving analytics.

### Model Feedback Loop

Use verified investigation outcomes to evaluate and improve prediction performance.

### Scalable Deployment

Migration from prototype infrastructure to secure cloud-native deployment capable of handling high-volume transaction streams.

---

## Why VIGILANT?

Cyber-fraud investigation should not stop at understanding **where the money has gone**.

The next question is:

> **Where is it likely to go next?**

VIGILANT converts fragmented transaction data into predictive, explainable and location-aware intelligence, helping authorized agencies move from:

### TRACE → PREDICT → INTERVENE

---

## Project

**VIGILANT**
Predictive Intelligence for Proactive Cyber-Fraud Intervention

**Smart India Hackathon — SIH26184**

