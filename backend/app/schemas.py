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
    priority: Optional[str] = "HIGH"

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
    city: Optional[str] = "Mumbai"

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
    risk_factors: Dict[str, Any]
    is_mule: bool
    is_watchlist: Optional[bool] = False
    is_frozen: Optional[bool] = False
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
    status: Optional[str] = "COMPLETED"
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
    active_incidents: Optional[int] = 0

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
    factors: Dict[str, Any]
    explanation: Optional[str] = None

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
    officer: Optional[str] = "Officer Rajesh K."
    category: Optional[str] = "GENERAL"

class InvestigationNoteSchema(BaseModel):
    note_id: str
    case_id: str
    officer: str
    content: str
    timestamp: datetime
    category: Optional[str] = "GENERAL"

    class Config:
        from_attributes = True

class EvidenceCreate(BaseModel):
    title: str
    description: str
    file_type: Optional[str] = "PDF"

class EvidenceSchema(BaseModel):
    evidence_id: str
    case_id: str
    title: str
    description: str
    timestamp: datetime
    file_type: str
    file_size: Optional[str] = "1.2 MB"
    hash_checksum: Optional[str] = None

    class Config:
        from_attributes = True

class InterventionRequestCreate(BaseModel):
    account_number: str
    target_entity: str
    action_type: str # FREEZE_ACCOUNT, REVERSE_TRANSACTION, DISPATCH_PATROL, SURVEILLANCE_FLAG
    reason: str
    requested_by: Optional[str] = "Officer Rajesh K. (Cyber Division)"

class InterventionRequestSchema(BaseModel):
    request_id: str
    case_id: str
    account_number: str
    target_entity: str
    action_type: str
    status: str
    requested_by: str
    reason: str
    created_at: datetime
    response_data: Dict[str, Any] = {}

    class Config:
        from_attributes = True

class WatchlistAccountCreate(BaseModel):
    account_number: str
    holder_name: Optional[str] = None
    bank_name: Optional[str] = None
    reason: str
    added_by: Optional[str] = "Officer Rajesh K."
    risk_level: Optional[str] = "HIGH"

class WatchlistAccountSchema(BaseModel):
    id: int
    account_number: str
    holder_name: Optional[str] = None
    bank_name: Optional[str] = None
    added_by: str
    reason: str
    added_at: datetime
    risk_level: str
    active: bool

    class Config:
        from_attributes = True

class AuditLogCreate(BaseModel):
    action: str
    case_id: Optional[str] = None
    details: str
    officer: Optional[str] = "Officer Rajesh K."

class AuditLogSchema(BaseModel):
    log_id: str
    officer: str
    action: str
    case_id: Optional[str] = None
    details: str
    timestamp: datetime
    ip_address: str

    class Config:
        from_attributes = True

# Composite structures
class CaseDetailSchema(BaseModel):
    case: CaseSchema
    victim: Optional[VictimReferenceSchema] = None
    alerts: List[AlertSchema] = []
    notes: List[InvestigationNoteSchema] = []
    evidence: List[EvidenceSchema] = []
    predictions: List[PredictionSchema] = []
    interventions: List[InterventionRequestSchema] = []
    
    class Config:
        from_attributes = True

class GraphNodeSchema(BaseModel):
    id: str
    label: str
    type: str # VICTIM, MULE, MERCHANT, ATM, BANK_ACCOUNT
    riskScore: float
    x: float
    y: float
    holder_name: Optional[str] = None
    bank_name: Optional[str] = None
    classification: Optional[str] = None
    is_mule: Optional[bool] = False

class GraphEdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    amount: float
    type: str
    riskScore: float
    timestamp: Optional[str] = None

class CaseNetworkSchema(BaseModel):
    case_id: str
    nodes: List[GraphNodeSchema]
    edges: List[GraphEdgeSchema]
    total_amount: float
    hops_count: int
    mule_count: int
    cashout_points: List[str]

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
    factors: Dict[str, Any]
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
    factors: Dict[str, Any]
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

class CaseComparisonSchema(BaseModel):
    case_1: CaseDetailSchema
    case_2: CaseDetailSchema
    common_nodes: List[str]
    velocity_comparison: Dict[str, Any]
    layering_depth: Dict[str, int]
