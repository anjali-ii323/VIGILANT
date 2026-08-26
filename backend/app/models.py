from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, JSON, ForeignKey
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
    current_status = Column(String) # e.g., ACTIVE, CLOSED, UNDER_REVIEW
    risk_score = Column(Float) # 0 to 100
    created_at = Column(DateTime, default=datetime.utcnow)
    assigned_officer = Column(String)
    last_activity = Column(String) # e.g., "2 min ago", "1 hour ago"
    
    alerts = relationship("Alert", back_populates="case", cascade="all, delete-orphan")
    notes = relationship("InvestigationNote", back_populates="case", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="case", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="case", cascade="all, delete-orphan")
    cashout_predictions = relationship("CashoutPrediction", back_populates="case", cascade="all, delete-orphan")
    investigation_events = relationship("InvestigationEvent", back_populates="case", cascade="all, delete-orphan")

class VictimReference(Base):
    __tablename__ = "victim_references"
    
    victim_id = Column(String, primary_key=True, index=True)
    name = Column(String)
    phone = Column(String)
    bank_name = Column(String)
    account_number = Column(String)
    disputed_amount = Column(Float)
    report_timestamp = Column(DateTime)

class Account(Base):
    __tablename__ = "accounts"
    
    account_number = Column(String, primary_key=True, index=True)
    holder_name = Column(String)
    bank_name = Column(String)
    ifsc_code = Column(String)
    phone_number = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    risk_score = Column(Float, default=0.0)
    classification = Column(String, default="SAFE") # e.g., SAFE, SUSPICIOUS, HIGH_RISK, MULE
    risk_factors = Column(JSON, default=dict) # key-value pair of explanation factors
    is_mule = Column(Boolean, default=False)
    
    # Custom attributes for simulation
    linked_case_id = Column(String, nullable=True)

class Transaction(Base):
    __tablename__ = "transactions"
    
    transaction_id = Column(String, primary_key=True, index=True)
    sender_account = Column(String, index=True)
    receiver_account = Column(String, index=True)
    amount = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    transaction_type = Column(String) # e.g., UPI, IMPS, RTGS, CASH_WITHDRAWAL, ATM_WITHDRAWAL
    risk_score = Column(Float, default=0.0)
    is_simulated = Column(Boolean, default=False)
    
    # Custom metadata to link transactions to specific scenarios
    linked_case_id = Column(String, nullable=True)

class ATM(Base):
    __tablename__ = "atms"
    
    atm_id = Column(String, primary_key=True, index=True)
    location_name = Column(String)
    city = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    risk_level = Column(String, default="LOW") # e.g., LOW, MEDIUM, HIGH, CRITICAL
    withdrawal_velocity = Column(Float, default=0.0) # Daily withdrawal frequency/volume

class Prediction(Base):
    __tablename__ = "predictions"
    
    prediction_id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"), nullable=True)
    source_account = Column(String, index=True)
    target_entity = Column(String) # Account number or ATM ID
    probability = Column(Float) # 0.0 to 1.0
    predicted_type = Column(String) # NEXT_HOP, CASH_OUT
    time_window_mins = Column(Integer) # e.g., 20
    factors = Column(JSON, default=dict)
    
    case = relationship("Case", back_populates="predictions")

class Alert(Base):
    __tablename__ = "alerts"
    
    alert_id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"))
    severity = Column(String) # e.g., INFO, WARNING, CRITICAL
    title = Column(String)
    description = Column(String)
    account_number = Column(String, index=True)
    amount_at_risk = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="ACTIVE") # e.g., ACTIVE, RESOLVED
    
    case = relationship("Case", back_populates="alerts")

class InvestigationNote(Base):
    __tablename__ = "investigation_notes"
    
    note_id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"))
    officer = Column(String)
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    case = relationship("Case", back_populates="notes")

class Evidence(Base):
    __tablename__ = "evidence"
    
    evidence_id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.case_id", ondelete="CASCADE"))
    title = Column(String)
    description = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    file_type = Column(String) # PDF, CSV, PNG, etc.
    
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

# Compatibility alias
SimulationEvent = InvestigationEvent
