from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    name = Column(String)
    role = Column(String)
    system_access = Column(String)

class Case(Base):
    __tablename__ = "cases"
    
    case_id = Column(String, primary_key=True, index=True)
    victim_ref = Column(String, index=True)
    fraud_type = Column(String)
    amount = Column(Float)
    current_status = Column(String, default="ACTIVE") # ACTIVE, UNDER_REVIEW, RESOLVED, FROZEN
    risk_score = Column(Float, default=75.0) # 0 to 100
    created_at = Column(DateTime, default=datetime.utcnow)
    assigned_officer = Column(String, default="Officer Rajesh K. (Cyber Division)")
    last_activity = Column(String, default="Just now")
    priority = Column(String, default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    
    alerts = relationship("Alert", back_populates="case", cascade="all, delete-orphan")
    notes = relationship("InvestigationNote", back_populates="case", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="case", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="case", cascade="all, delete-orphan")
    cashout_predictions = relationship("CashoutPrediction", back_populates="case", cascade="all, delete-orphan")
    investigation_events = relationship("InvestigationEvent", back_populates="case", cascade="all, delete-orphan")
    interventions = relationship("InterventionRequest", back_populates="case", cascade="all, delete-orphan")

class VictimReference(Base):
    __tablename__ = "victim_references"
    
    victim_id = Column(String, primary_key=True, index=True)
    name = Column(String)
    phone = Column(String)
    bank_name = Column(String)
    account_number = Column(String)
    disputed_amount = Column(Float)
    report_timestamp = Column(DateTime, default=datetime.utcnow)
    city = Column(String, default="Mumbai")

class Account(Base):
    __tablename__ = "accounts"
    
    account_number = Column(String, primary_key=True, index=True)
    holder_name = Column(String)
    bank_name = Column(String)
    ifsc_code = Column(String)
    phone_number = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    risk_score = Column(Float, default=0.0)
    classification = Column(String, default="SAFE") # SAFE, SUSPICIOUS, HIGH_RISK, MULE, MERCHANT, OUTLET
    risk_factors = Column(JSON, default=dict) # key-value pair of explanation factors
    is_mule = Column(Boolean, default=False)
    is_watchlist = Column(Boolean, default=False)
    is_frozen = Column(Boolean, default=False)
    
    # Custom attributes for simulation & case mapping
    linked_case_id = Column(String, nullable=True)

class Transaction(Base):
    __tablename__ = "transactions"
    
    transaction_id = Column(String, primary_key=True, index=True)
    sender_account = Column(String, index=True)
    receiver_account = Column(String, index=True)
    amount = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    transaction_type = Column(String) # UPI, IMPS, RTGS, NEFT, CASH_WITHDRAWAL, ATM_WITHDRAWAL
    risk_score = Column(Float, default=0.0)
    is_simulated = Column(Boolean, default=False)
    status = Column(String, default="COMPLETED") # COMPLETED, FLAGGED, BLOCKED, REVERSED
    
    # Custom metadata to link transactions to specific scenarios
    linked_case_id = Column(String, nullable=True)

class ATM(Base):
    __tablename__ = "atms"
    
    atm_id = Column(String, primary_key=True, index=True)
    location_name = Column(String)
    city = Column(String, default="Mumbai")
    latitude = Column(Float)
    longitude = Column(Float)
    risk_level = Column(String, default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    withdrawal_velocity = Column(Float, default=0.0) # Daily withdrawal frequency/volume
    active_incidents = Column(Integer, default=0)

class Prediction(Base):
    __tablename__ = "predictions"
    
    prediction_id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=True)
    source_account = Column(String, index=True)
    target_entity = Column(String) # Account number or ATM ID
    probability = Column(Float) # 0.0 to 1.0
    predicted_type = Column(String) # NEXT_HOP, CASH_OUT, MERCHANT_HOP
    time_window_mins = Column(Integer) # e.g., 20
    factors = Column(JSON, default=dict)
    explanation = Column(String, nullable=True)
    
    case = relationship("Case", back_populates="predictions")

class Alert(Base):
    __tablename__ = "alerts"
    
    alert_id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"))
    severity = Column(String) # INFO, WARNING, CRITICAL
    title = Column(String)
    description = Column(String)
    account_number = Column(String, index=True)
    amount_at_risk = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="ACTIVE") # ACTIVE, REVIEWED, RESOLVED, DISMISSED
    
    case = relationship("Case", back_populates="alerts")

class InvestigationNote(Base):
    __tablename__ = "investigation_notes"
    
    note_id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"))
    officer = Column(String, default="Officer Rajesh K.")
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    category = Column(String, default="GENERAL") # GENERAL, INTELLIGENCE, EVIDENCE, ESCALATION
    
    case = relationship("Case", back_populates="notes")

class Evidence(Base):
    __tablename__ = "evidence"
    
    evidence_id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"))
    title = Column(String)
    description = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    file_type = Column(String) # PDF, CSV, PNG, JSON, LOG
    file_size = Column(String, default="1.2 MB")
    hash_checksum = Column(String, nullable=True)
    
    case = relationship("Case", back_populates="evidence")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    assessment_id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"))
    account_number = Column(String, index=True)
    risk_score = Column(Float)
    classification = Column(String)
    factors = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    case = relationship("Case", back_populates="risk_assessments")

class CashoutPrediction(Base):
    __tablename__ = "cashout_predictions"
    
    prediction_id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"))
    account_number = Column(String, index=True)
    predicted_location = Column(String)
    atm_id = Column(String, index=True)
    probability = Column(Float)
    time_window_mins = Column(Integer)
    factors = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    case = relationship("Case", back_populates="cashout_predictions")

class InvestigationEvent(Base):
    __tablename__ = "investigation_events"
    
    event_id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=True)
    step_num = Column(Integer)
    title = Column(String)
    description = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    case = relationship("Case", back_populates="investigation_events")

SimulationEvent = InvestigationEvent

class InterventionRequest(Base):
    __tablename__ = "intervention_requests"
    
    request_id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"))
    account_number = Column(String, index=True)
    target_entity = Column(String) # Bank name, ATM ID, Police Zone
    action_type = Column(String) # FREEZE_ACCOUNT, REVERSE_TRANSACTION, DISPATCH_PATROL, SURVEILLANCE_FLAG
    status = Column(String, default="EXECUTED_SIMULATED") # PENDING, EXECUTED_SIMULATED, FAILED
    requested_by = Column(String, default="Officer Rajesh K. (Cyber Division)")
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    response_data = Column(JSON, default=dict)
    
    case = relationship("Case", back_populates="interventions")

class WatchlistAccount(Base):
    __tablename__ = "watchlist_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String, unique=True, index=True)
    holder_name = Column(String)
    bank_name = Column(String)
    added_by = Column(String, default="Officer Rajesh K.")
    reason = Column(String)
    added_at = Column(DateTime, default=datetime.utcnow)
    risk_level = Column(String, default="HIGH")
    active = Column(Boolean, default=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    log_id = Column(String, primary_key=True, index=True)
    officer = Column(String, default="Officer Rajesh K.")
    action = Column(String) # CASE_OPENED, NOTE_ADDED, INTERVENTION_CREATED, PREDICTION_REFRESHED, WATCHLIST_UPDATED, REPORT_GENERATED
    case_id = Column(String, nullable=True)
    details = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, default="10.42.0.8 (LE_VPN)")
