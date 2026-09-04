import json

AUDIT_LEDGER_ABI_JSON = """
[
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "auditId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "caseId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "eventHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "submitter",
        "type": "address"
      }
    ],
    "name": "AuditRecorded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "auditId",
        "type": "string"
      }
    ],
    "name": "getAudit",
    "outputs": [
      {
        "internalType": "string",
        "name": "caseId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      },
      {
        "internalType": "bytes32",
        "name": "eventHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "submitter",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAuditCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getAuditIdAtIndex",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "auditId",
        "type": "string"
      },
      {
        "internalType": "bytes32",
        "name": "computedHash",
        "type": "bytes32"
      }
    ],
    "name": "isAuditValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "auditId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "caseId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "eventType",
        "type": "string"
      },
      {
        "internalType": "bytes32",
        "name": "eventHash",
        "type": "bytes32"
      }
    ],
    "name": "recordAudit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
"""

AUDIT_LEDGER_ABI = json.loads(AUDIT_LEDGER_ABI_JSON.strip())

# Fetch bytecode from compilation
import solcx
try:
    solcx.set_solc_version('0.8.20')
    from pathlib import Path
    contract_p = Path(__file__).resolve().parent.parent.parent.parent / "contracts" / "AuditLedger.sol"
    if contract_p.exists():
        comp = solcx.compile_files([str(contract_p)], output_values=['bin'])
        k = [k for k in comp.keys() if 'AuditLedger' in k][0]
        AUDIT_LEDGER_BYTECODE = comp[k]['bin']
    else:
        AUDIT_LEDGER_BYTECODE = ""
except Exception:
    AUDIT_LEDGER_BYTECODE = ""
