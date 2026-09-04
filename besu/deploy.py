#!/usr/bin/env python3
"""
Hyperledger Besu Smart Contract Deployment Script for VIGILANT.
Deploys AuditLedger.sol to the local Besu network and outputs contract address.
"""
import os
import sys
import json
from pathlib import Path
from web3 import Web3

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.blockchain.contracts import AUDIT_LEDGER_ABI, AUDIT_LEDGER_BYTECODE

def deploy():
    rpc_url = os.getenv("BESU_RPC_URL", "http://127.0.0.1:8545")
    private_key = os.getenv("BESU_PRIVATE_KEY", "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c694be66")
    
    print(f"[+] Connecting to Hyperledger Besu at {rpc_url}...")
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    
    if not w3.is_connected():
        print(f"[-] Error: Could not connect to Besu at {rpc_url}")
        sys.exit(1)
        
    account = w3.eth.account.from_key(private_key)
    print(f"[+] Deployer Account: {account.address}")
    
    AuditLedger = w3.eth.contract(abi=AUDIT_LEDGER_ABI, bytecode=AUDIT_LEDGER_BYTECODE)
    
    nonce = w3.eth.get_transaction_count(account.address)
    print(f"[+] Deploying AuditLedger.sol (Nonce: {nonce})...")
    
    tx = AuditLedger.constructor().build_transaction({
        'from': account.address,
        'nonce': nonce,
        'gas': 3000000,
        'gasPrice': 0,
        'chainId': w3.eth.chain_id
    })
    
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"[+] Submitted Deployment Tx: {tx_hash.hex()}")
    
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    contract_address = receipt.contractAddress
    print(f"[✓] AuditLedger successfully deployed to: {contract_address}")
    print(f"[✓] Block Number: {receipt.blockNumber}")
    print(f"[✓] Gas Used: {receipt.gasUsed}")
    
    # Write to .env or config file
    env_file = backend_dir / ".env"
    print(f"[+] Updating contract address in {env_file}...")
    
    lines = []
    if env_file.exists():
        with open(env_file, "r") as f:
            lines = f.readlines()
            
    updated = False
    new_lines = []
    for line in lines:
        if line.startswith("AUDIT_CONTRACT_ADDRESS="):
            new_lines.append(f"AUDIT_CONTRACT_ADDRESS={contract_address}\n")
            updated = True
        else:
            new_lines.append(line)
            
    if not updated:
        new_lines.append(f"AUDIT_CONTRACT_ADDRESS={contract_address}\n")
        
    with open(env_file, "w") as f:
        f.writelines(new_lines)
        
    print("[✓] Deployment complete and environment updated!")
    return contract_address

if __name__ == "__main__":
    deploy()
