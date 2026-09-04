import hashlib
import json
from datetime import datetime
from typing import Dict, Any, Tuple, Union

def normalize_timestamp(ts: Union[datetime, str, float, int]) -> str:
    """
    Normalizes any timestamp format into a deterministic UTC ISO-8601 string: YYYY-MM-DDTHH:MM:SSZ.
    Ensures second-level deterministic precision across database engines and JSON serializers.
    """
    if isinstance(ts, datetime):
        return ts.strftime("%Y-%m-%dT%H:%M:%SZ")
    elif isinstance(ts, (int, float)):
        return datetime.utcfromtimestamp(ts).strftime("%Y-%m-%dT%H:%M:%SZ")
    elif isinstance(ts, str):
        # Parse ISO format or common strings
        clean_ts = ts.strip().replace("Z", "").split(".")[0]
        try:
            dt = datetime.fromisoformat(clean_ts)
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except Exception:
            return ts.strip()
    return str(ts)

def create_canonical_payload(
    log_id: str,
    action: str,
    details: str,
    timestamp: Union[datetime, str],
    case_id: str = None,
    officer: str = None
) -> Dict[str, str]:
    """
    Constructs the canonical dictionary representation of an audit event.
    Only immutable, essential fields required for judicial integrity are included.
    """
    return {
        "action": str(action).strip(),
        "case_id": str(case_id if case_id else "GLOBAL").strip(),
        "details": str(details).strip(),
        "log_id": str(log_id).strip(),
        "officer": str(officer if officer else "Officer Rajesh K.").strip(),
        "timestamp": normalize_timestamp(timestamp)
    }

def canonicalize_to_json(payload: Dict[str, Any]) -> str:
    """
    Generates a deterministic canonical JSON string:
      1. Keys sorted alphabetically (sort_keys=True)
      2. No extra whitespace (separators=(',', ':'))
      3. UTF-8 normalized encoding
    """
    return json.dumps(payload, sort_keys=True, separators=(',', ':'), ensure_ascii=False)

def compute_canonical_hash(
    log_id: str,
    action: str,
    details: str,
    timestamp: Union[datetime, str],
    case_id: str = None,
    officer: str = None
) -> Tuple[bytes, str, str]:
    """
    Computes the canonical representation and SHA-256 hash.
    
    Returns:
      Tuple of (hash_bytes32, hash_hex, canonical_json_string)
    """
    payload = create_canonical_payload(
        log_id=log_id,
        action=action,
        details=details,
        timestamp=timestamp,
        case_id=case_id,
        officer=officer
    )
    canonical_json = canonicalize_to_json(payload)
    hash_obj = hashlib.sha256(canonical_json.encode('utf-8'))
    hash_bytes32 = hash_obj.digest()
    hash_hex = f"0x{hash_obj.hexdigest()}"
    
    return hash_bytes32, hash_hex, canonical_json
