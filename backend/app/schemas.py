from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any

class UserBase(BaseModel):
    username: str
    name: str
    role: str
    system_access: str

class UserSchema(UserBase):
    id: int

    class Config:
        from_attributes = True

class CaseBase(BaseModel):
    case_id: str
    victim_ref: str
    fraud_type: str
    amount: float
    current_status: str
    risk_score: float
    assigned_officer: str
    last_activity: str

class CaseSchema(CaseBase):
    created_at: datetime

    class Config:
        from_attributes = True

class VictimReferenceBase(BaseModel):
    victim_id: str
    name: str
    phone: str
    bank_name: str
    account_number: str
    disputed_amount: float

class VictimReferenceSchema(VictimReferenceBase):
    report_timestamp: datetime

    class Config:
        from_attributes = True

class AccountBase(BaseModel):
    account_number: str
    holder_name: str
    bank_name: str
    ifsc_code: str
    phone_number: str
    risk_score: float
    classification: str
    risk_factors: Dict[str, int]
    is_mule: bool
    linked_case_id: Optional[str] = None

class AccountSchema(AccountBase):
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    transaction_id: str
    sender_account: str
    receiver_account: str
    amount: float
    transaction_type: str
    risk_score: float
    is_simulated: bool
    linked_case_id: Optional[str] = None

class TransactionSchema(TransactionBase):
    timestamp: datetime

    class Config:
        from_attributes = True

class ATMSchema(BaseModel):
    atm_id: str
    location_name: str
    city: str
    latitude: float
    longitude: float
    risk_level: str
    withdrawal_velocity: float

    class Config:
        from_attributes = True

class PredictionSchema(BaseModel):
    prediction_id: str
    case_id: Optional[str]
    source_account: str
    target_entity: str
    probability: float
    predicted_type: str
    time_window_mins: int
    factors: Dict[str, float]

    class Config:
        from_attributes = True

class AlertBase(BaseModel):
    alert_id: str
    case_id: str
    severity: str
    title: str
    description: str
    account_number: str
    amount_at_risk: float
    status: str

class AlertSchema(AlertBase):
    timestamp: datetime

    class Config:
        from_attributes = True

class InvestigationNoteCreate(BaseModel):
    content: str

class InvestigationNoteSchema(BaseModel):
    note_id: str
    case_id: str
    officer: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True

class EvidenceSchema(BaseModel):
    evidence_id: str
    case_id: str
    title: str
    description: str
    timestamp: datetime
    file_type: str

    class Config:
        from_attributes = True

# Composite structures
class CaseDetailSchema(BaseModel):
    case: CaseSchema
    victim: Optional[VictimReferenceSchema] = None
    alerts: List[AlertSchema] = []
    notes: List[InvestigationNoteSchema] = []
    evidence: List[EvidenceSchema] = []
    
    class Config:
        from_attributes = True

class SimulationStateSchema(BaseModel):
    running: bool
    current_step: int
    total_steps: int
    case_id: str
    last_event: Optional[str] = None

class LiveStreamEventSchema(BaseModel):
    timestamp: str
    amount: float
    description: str
    risk_level: str
    event_type: str # TRANSACTION, ALERT, RISK_UPDATE, PREDICTION
    meta: Dict[str, Any]

class RiskAssessmentSchema(BaseModel):
    assessment_id: str
    case_id: str
    account_number: str
    risk_score: float
    classification: str
    factors: Dict[str, int]
    timestamp: datetime

    class Config:
        from_attributes = True

class CashoutPredictionSchema(BaseModel):
    prediction_id: str
    case_id: str
    account_number: str
    predicted_location: str
    atm_id: str
    probability: float
    time_window_mins: int
    factors: Dict[str, int]
    timestamp: datetime

    class Config:
        from_attributes = True

class SimulationEventSchema(BaseModel):
    event_id: str
    case_id: Optional[str] = None
    step_num: int
    title: str
    description: str
    timestamp: datetime

    class Config:
        from_attributes = True

class InvestigationEventSchema(SimulationEventSchema):
    pass

class SearchResultSchema(BaseModel):
    id: str
    type: str # CASE, ACCOUNT, TRANSACTION, ALERT
    title: str
    subtitle: str
