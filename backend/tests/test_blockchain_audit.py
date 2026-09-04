import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app import models
from app.blockchain.canonical import compute_canonical_hash, create_canonical_payload, canonicalize_to_json
from app.blockchain.client import BesuBlockchainClient, besu_client
from app.blockchain.service import (
    record_audit_event,
    verify_audit_log,
    verify_all_audit_logs,
    simulate_database_tampering
)

# Test in-memory SQLite database for isolated test execution
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_canonical_hashing_determinism():
    """
    Test 0: Canonical Hashing Determinism
    Ensures that identical inputs produce the exact same byte-for-byte SHA-256 hash.
    """
    log_id = "AUD-TEST-0001"
    action = "CASE_OPENED"
    details = "Opened investigation into UPI syndicate"
    timestamp = "2026-09-04T12:00:00Z"
    case_id = "CF-2026-00421"
    officer = "Officer Rajesh K."

    bytes1, hex1, json1 = compute_canonical_hash(log_id, action, details, timestamp, case_id, officer)
    bytes2, hex2, json2 = compute_canonical_hash(log_id, action, details, timestamp, case_id, officer)

    assert bytes1 == bytes2
    assert hex1 == hex2
    assert json1 == json2
    assert hex1.startswith("0x")
    assert len(bytes1) == 32

def test_successful_audit_recording(db_session):
    """
    Test 1: Successful Audit Recording
    Expected:
      - Database record exists
      - Blockchain transaction hash exists
      - Block number exists
      - Status is CONFIRMED_ON_CHAIN
    """
    log = record_audit_event(
        db=db_session,
        action="PROACTIVE_INTERVENTION",
        details="Placed temporary hold on mule account MULE-A457",
        case_id="CF-2026-00421",
        officer="Inspector S. Iyer"
    )

    assert log is not None
    assert log.log_id.startswith("AUD-2026-")
    assert log.blockchain_tx_hash is not None
    assert log.blockchain_tx_hash.startswith("0x")
    assert log.blockchain_block_number is not None
    assert log.blockchain_status == "CONFIRMED_ON_CHAIN"
    assert log.canonical_hash is not None

def test_successful_verification(db_session):
    """
    Test 2: Successful Verification
    Expected:
      - Calling verify_audit_log returns is_valid=True and status='VALID'
      - Database hash matches blockchain hash exactly
    """
    log = record_audit_event(
        db=db_session,
        action="EVIDENCE_ANCHORED",
        details="Attached bank statement with checksum SHA256:8F43...",
        case_id="CF-2026-00421",
        officer="Officer Rajesh K."
    )

    result = verify_audit_log(db_session, log.log_id)

    assert result["is_valid"] is True
    assert result["status"] == "VALID"
    assert result["database_hash"].lower() == result["blockchain_hash"].lower()
    assert result["tx_hash"] == log.blockchain_tx_hash

def test_tampering_detection(db_session):
    """
    Test 3: Tampering Detection
    Intentionally modifies the database details.
    Expected:
      - Calling verify_audit_log returns is_valid=False and status='TAMPERING_DETECTED'
      - Recomputed database hash differs from on-chain recorded hash
    """
    log = record_audit_event(
        db=db_session,
        action="CASE_PRIORITY_UPDATE",
        details="Priority escalated to CRITICAL",
        case_id="CF-2026-00421",
        officer="Officer Rajesh K."
    )

    # Verify initially valid
    initial_verify = verify_audit_log(db_session, log.log_id)
    assert initial_verify["is_valid"] is True

    # Tamper with the record directly in the database
    simulate_database_tampering(
        db=db_session,
        log_id=log.log_id,
        new_details="Priority maliciously reduced to LOW (TAMPERED)"
    )

    # Verify tampering is caught
    tampered_verify = verify_audit_log(db_session, log.log_id)
    assert tampered_verify["is_valid"] is False
    assert tampered_verify["status"] == "TAMPERING_DETECTED"
    assert "TAMPERING DETECTED" in tampered_verify["reason"].upper()
    assert tampered_verify["database_hash"].lower() != tampered_verify["blockchain_hash"].lower()

def test_duplicate_submission_prevention(db_session):
    """
    Test 4: Duplicate Submission Prevention
    Ensures smart contract rejects submitting the same audit ID twice.
    """
    audit_id = "AUD-TEST-DUPLICATE-001"
    case_id = "CF-2026-00421"
    event_type = "ACCOUNT_FLAGGED"
    hash_bytes, _, _ = compute_canonical_hash(
        audit_id, event_type, "First attempt", "2026-09-04T12:00:00Z", case_id
    )

    # First submission should succeed
    receipt1 = besu_client.record_audit(audit_id, case_id, event_type, hash_bytes)
    assert receipt1["blockchain_status"] == "CONFIRMED_ON_CHAIN"

    # Second submission with same ID must raise ValueError
    with pytest.raises(ValueError) as exc_info:
        besu_client.record_audit(audit_id, case_id, event_type, hash_bytes)
    assert "already exists on-chain" in str(exc_info.value)

def test_verify_all_audit_logs(db_session):
    """
    Test 5: Batch Integrity Verification
    Records multiple logs, tampered with one, and verifies batch summary report.
    """
    log1 = record_audit_event(db_session, "EVENT_1", "Legitimate entry 1")
    log2 = record_audit_event(db_session, "EVENT_2", "Legitimate entry 2")
    log3 = record_audit_event(db_session, "EVENT_3", "Legitimate entry 3")

    # Tamper log2
    simulate_database_tampering(db_session, log2.log_id, "Tampered details 2")

    batch_res = verify_all_audit_logs(db_session)
    assert batch_res["total_records"] == 3
    assert batch_res["verified_count"] == 2
    assert batch_res["tampered_count"] == 1
    assert batch_res["is_valid"] is False
    assert batch_res["status"] == "TAMPERING_DETECTED"
