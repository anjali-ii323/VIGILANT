import solcx
import json
from pathlib import Path

solcx.set_solc_version('0.8.20')
contract_path = Path("contracts/AuditLedger.sol")
compiled = solcx.compile_files([str(contract_path)], output_values=['abi', 'bin'])

key = [k for k in compiled.keys() if 'AuditLedger' in k][0]
contract_data = compiled[key]

abi = contract_data['abi']
bytecode = contract_data['bin']

output_file = Path("backend/app/blockchain/contracts.py")
output_file.parent.mkdir(parents=True, exist_ok=True)

content = f'''"""
Compiled Smart Contract ABI and Bytecode for AuditLedger.sol.
Generated for VIGILANT Hyperledger Besu integration.
"""

AUDIT_LEDGER_ABI = {json.dumps(abi, indent=2)}

AUDIT_LEDGER_BYTECODE = "{bytecode}"
'''

with open(output_file, "w") as f:
    f.write(content)

print("[+] Successfully compiled AuditLedger.sol to backend/app/blockchain/contracts.py")
