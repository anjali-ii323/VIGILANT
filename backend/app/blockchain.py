import hashlib
import json
import time
from datetime import datetime
from typing import List, Dict, Any, Tuple

def compute_sha256(data: str) -> str:
    """Computes standard cryptographic SHA-256 hex digest."""
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def compute_ipfs_cid(content: str) -> str:
    """Generates a deterministic simulated IPFS v1 CID from content SHA-256 hash."""
    h = compute_sha256(content)
    return f"bafybeic{h[:32]}vigilant"

def compute_merkle_root(items: List[str]) -> str:
    """Computes a binary Merkle root hash for a list of string entries."""
    if not items:
        return compute_sha256("EMPTY_TREE")
    
    current_layer = [compute_sha256(item) for item in items]
    while len(current_layer) > 1:
        if len(current_layer) % 2 == 1:
            current_layer.append(current_layer[-1])
        next_layer = []
        for i in range(0, len(current_layer), 2):
            combined = current_layer[i] + current_layer[i+1]
            next_layer.append(compute_sha256(combined))
        current_layer = next_layer
    return current_layer[0]

def create_block(
    index: int,
    previous_hash: str,
    timestamp: str,
    officer: str,
    action: str,
    details: str,
    case_id: str = None
) -> Dict[str, Any]:
    """
    Creates an immutable cryptographic block entry.
    Block Hash = SHA256(Index + PreviousHash + Timestamp + Officer + Action + CaseId + Details)
    """
    payload_str = f"{index}|{previous_hash}|{timestamp}|{officer}|{action}|{case_id or 'GLOBAL'}|{details}"
    block_hash = compute_sha256(payload_str)
    merkle_root = compute_merkle_root([payload_str, block_hash])
    tx_hash = f"0x{compute_sha256(f'tx_{block_hash}')[:40]}"

    return {
        "block_index": index,
        "previous_hash": previous_hash,
        "block_hash": block_hash,
        "merkle_root": merkle_root,
        "tx_hash": tx_hash,
        "timestamp": timestamp,
        "officer": officer,
        "action": action,
        "case_id": case_id,
        "details": details
    }

def verify_chain(blocks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Cryptographically verifies the entire hash chain from Genesis (Block 0) to latest.
    Checks:
      1. Genesis block previous_hash == "0" * 64
      2. Each block's previous_hash matches preceding block's block_hash
      3. Each block's hash re-computes exactly from its payload
    """
    if not blocks:
        return {"is_valid": True, "block_count": 0, "status": "EMPTY_CHAIN"}

    # Sort by block_index
    sorted_blocks = sorted(blocks, key=lambda b: b.get("block_index", 0))

    for i, block in enumerate(sorted_blocks):
        idx = block.get("block_index", 0)
        prev_hash = block.get("previous_hash", "")
        stored_hash = block.get("block_hash", "")
        timestamp = block.get("timestamp", "")
        officer = block.get("officer", "")
        action = block.get("action", "")
        details = block.get("details", "")
        case_id = block.get("case_id", "")

        # Verify Genesis
        if idx == 0:
            expected_genesis_prev = "0" * 64
            if prev_hash != expected_genesis_prev:
                return {
                    "is_valid": False,
                    "failed_block": 0,
                    "reason": "Genesis block previous_hash mismatch"
                }
        else:
            # Check linkage with previous block
            preceding_block = sorted_blocks[i - 1]
            if prev_hash != preceding_block.get("block_hash"):
                return {
                    "is_valid": False,
                    "failed_block": idx,
                    "reason": f"Block {idx} previous_hash does not match Block {idx-1} block_hash"
                }

        # Re-compute hash
        payload_str = f"{idx}|{prev_hash}|{timestamp}|{officer}|{action}|{case_id or 'GLOBAL'}|{details}"
        calculated_hash = compute_sha256(payload_str)
        if calculated_hash != stored_hash:
            return {
                "is_valid": False,
                "failed_block": idx,
                "reason": f"Block {idx} hash tampering detected (stored: {stored_hash[:10]}..., calculated: {calculated_hash[:10]}...)"
            }

    return {
        "is_valid": True,
        "block_count": len(sorted_blocks),
        "genesis_hash": sorted_blocks[0].get("block_hash", ""),
        "latest_block_hash": sorted_blocks[-1].get("block_hash", ""),
        "latest_block_index": sorted_blocks[-1].get("block_index", 0),
        "status": "CRYPTOGRAPHICALLY_VERIFIED_100_PERCENT_IMMUTABLE"
    }

def execute_smart_contract_freeze(
    account_number: str,
    target_entity: str,
    reason: str,
    officer: str
) -> Dict[str, Any]:
    """
    Simulates a Multi-Signature Smart Contract Interdiction on a Permissioned Inter-Bank Ledger.
    """
    tx_seed = f"{account_number}:{target_entity}:{reason}:{time.time()}"
    tx_hash = f"0x{compute_sha256(tx_seed)[:40]}"
    contract_address = "0x7F91B994A2D81C10291480D923E2804A9184B022" # MultiSigFreezeRegistry Contract
    block_number = 1982400 + int(time.time() % 10000)
    gas_used = 42150

    return {
        "smart_contract_tx": tx_hash,
        "contract_address": contract_address,
        "block_number": block_number,
        "gas_used": gas_used,
        "network": "Hyperledger Besu / Polygon ID Enterprise Consortium",
        "multi_sig_quorum": [
            f"Sign(Investigating Officer): 0x{compute_sha256(officer)[:16]}...",
            f"Sign(Bank Nodal Officer - {target_entity}): 0x{compute_sha256(target_entity)[:16]}...",
            "Sign(NPCI Intercept Oracle): 0x33B18F902148..."
        ],
        "status": "CRYPTOGRAPHIC_HOLD_LOCKED"
    }
