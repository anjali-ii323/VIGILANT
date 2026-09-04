import os
import logging
from typing import Dict, Any, Optional, Tuple
from web3 import Web3
from eth_account import Account
from .contracts import AUDIT_LEDGER_ABI, AUDIT_LEDGER_BYTECODE

logger = logging.getLogger("vigilant.blockchain")

class BesuBlockchainClient:
    """
    Production-grade Web3 client for Hyperledger Besu permissioned blockchain.
    Provides smart contract interactions for the AuditLedger.sol contract.
    """

    def __init__(self):
        self.rpc_url = os.getenv("BESU_RPC_URL", "http://127.0.0.1:8545")
        self.private_key = os.getenv(
            "BESU_PRIVATE_KEY",
            "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c694be66"
        )
        self.contract_address = os.getenv("AUDIT_CONTRACT_ADDRESS", None)
        self.w3: Optional[Web3] = None
        self.contract = None
        self.account = None
        self.is_connected = False
        self.network_name = "Hyperledger Besu (Permissioned QBFT)"
        
        self._initialize_connection()

    def _initialize_connection(self):
        """Attempts connection to external Hyperledger Besu node, falls back to local EVM provider if offline."""
        try:
            # 1. Try external Hyperledger Besu JSON-RPC
            besu_provider = Web3.HTTPProvider(self.rpc_url, request_kwargs={'timeout': 2.5})
            test_w3 = Web3(besu_provider)
            
            if test_w3.is_connected():
                self.w3 = test_w3
                self.is_connected = True
                self.network_name = f"Hyperledger Besu (Chain ID: {self.w3.eth.chain_id})"
                logger.info(f"[✓] Connected to live Hyperledger Besu node at {self.rpc_url}")
            else:
                raise ConnectionError(f"Besu node offline at {self.rpc_url}")
                
        except Exception as e:
            logger.warning(f"[-] Hyperledger Besu offline ({e}). Initializing local EVM tester provider...")
            try:
                from web3.providers.eth_tester import EthereumTesterProvider
                from eth_tester import EthereumTester, PyEVMBackend
                
                tester = EthereumTester(backend=PyEVMBackend())
                self.w3 = Web3(EthereumTesterProvider(tester))
                self.is_connected = True
                self.network_name = "Local EVM Dev Node (Hyperledger Besu Compatible)"
                logger.info("[✓] Initialized local EVM provider for standalone development.")
            except Exception as evm_err:
                logger.error(f"[!] Failed to initialize EVM provider: {evm_err}")
                self.is_connected = False
                return

        # Setup Account
        try:
            if not self.private_key.startswith("0x"):
                self.private_key = f"0x{self.private_key}"
            self.account = self.w3.eth.account.from_key(self.private_key)
        except Exception:
            # Generate temporary local account if key format fails
            self.account = self.w3.eth.account.create()
            self.private_key = self.account.key.hex()

        # Deploy or attach contract
        self._setup_contract()

    def _setup_contract(self):
        """Attaches to existing contract address or deploys contract instance."""
        if not self.is_connected or not self.w3:
            return

        try:
            if self.contract_address and self.w3.is_address(self.contract_address):
                self.contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.contract_address),
                    abi=AUDIT_LEDGER_ABI
                )
                logger.info(f"[✓] Attached to AuditLedger at {self.contract_address}")
            else:
                # Deploy instance
                logger.info("[+] Deploying AuditLedger.sol instance...")
                ContractFactory = self.w3.eth.contract(
                    abi=AUDIT_LEDGER_ABI,
                    bytecode=AUDIT_LEDGER_BYTECODE
                )
                
                # If local tester has accounts, fund our account
                if hasattr(self.w3.provider, 'ethereum_tester'):
                    default_acc = self.w3.eth.accounts[0]
                    self.w3.eth.send_transaction({
                        'from': default_acc,
                        'to': self.account.address,
                        'value': self.w3.to_wei(100, 'ether')
                    })

                nonce = self.w3.eth.get_transaction_count(self.account.address)
                try:
                    gas_price = self.w3.eth.gas_price
                except Exception:
                    gas_price = 0

                deploy_tx = ContractFactory.constructor().build_transaction({
                    'from': self.account.address,
                    'nonce': nonce,
                    'gas': 3000000,
                    'gasPrice': gas_price,
                    'chainId': self.w3.eth.chain_id
                })
                
                signed_tx = self.w3.eth.account.sign_transaction(deploy_tx, private_key=self.private_key)
                tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
                
                self.contract_address = receipt.contractAddress
                self.contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.contract_address),
                    abi=AUDIT_LEDGER_ABI
                )
                logger.info(f"[✓] Deployed AuditLedger at {self.contract_address} (Block #{receipt.blockNumber})")
        except Exception as e:
            logger.error(f"[!] Contract setup failed: {e}")
            self.contract = None

    def record_audit(
        self,
        audit_id: str,
        case_id: str,
        event_type: str,
        event_hash_bytes: bytes
    ) -> Dict[str, Any]:
        """
        Submits a transaction to AuditLedger.sol recordAudit() and awaits transaction receipt.
        """
        if not self.is_connected or not self.contract:
            raise ConnectionError("Hyperledger Besu node or smart contract is unavailable.")

        try:
            # Check if record already exists
            existing = self.contract.functions.getAudit(audit_id).call()
            if existing[5]:  # exists
                raise ValueError(f"Audit record '{audit_id}' already exists on-chain.")

            nonce = self.w3.eth.get_transaction_count(self.account.address)
            try:
                gas_price = self.w3.eth.gas_price
            except Exception:
                gas_price = 0
            
            tx_data = self.contract.functions.recordAudit(
                audit_id,
                case_id or "GLOBAL",
                event_type,
                event_hash_bytes
            ).build_transaction({
                'from': self.account.address,
                'nonce': nonce,
                'gas': 300000,
                'gasPrice': gas_price,
                'chainId': self.w3.eth.chain_id
            })

            signed_tx = self.w3.eth.account.sign_transaction(tx_data, private_key=self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=10)
            
            if receipt.status != 1:
                raise RuntimeError(f"Transaction reverted on-chain (Tx: {tx_hash.hex()})")

            raw_hex = tx_hash.hex()
            formatted_tx = f"0x{raw_hex}" if not raw_hex.startswith("0x") else raw_hex

            return {
                "blockchain_tx_hash": formatted_tx,
                "blockchain_block_number": receipt.blockNumber,
                "contract_address": self.contract_address,
                "gas_used": receipt.gasUsed,
                "blockchain_status": "CONFIRMED_ON_CHAIN"
            }
        except Exception as e:
            logger.error(f"Failed to record audit {audit_id} on-chain: {e}")
            raise e

    def get_audit(self, audit_id: str) -> Dict[str, Any]:
        """
        Queries AuditLedger.sol for a recorded audit entry.
        """
        if not self.is_connected or not self.contract:
            raise ConnectionError("Hyperledger Besu node or smart contract is unavailable.")

        try:
            res = self.contract.functions.getAudit(audit_id).call()
            case_id, event_type, event_hash, timestamp, submitter, exists = res
            
            return {
                "audit_id": audit_id,
                "case_id": case_id,
                "event_type": event_type,
                "event_hash": f"0x{event_hash.hex()}",
                "timestamp": timestamp,
                "submitter": submitter,
                "exists": exists
            }
        except Exception as e:
            logger.error(f"Failed to query audit {audit_id}: {e}")
            raise e

    def is_audit_valid(self, audit_id: str, computed_hash_bytes: bytes) -> bool:
        """
        Calls on-chain smart contract method isAuditValid() to compare hashes.
        """
        if not self.is_connected or not self.contract:
            raise ConnectionError("Hyperledger Besu node or smart contract is unavailable.")

        try:
            return self.contract.functions.isAuditValid(audit_id, computed_hash_bytes).call()
        except Exception as e:
            logger.error(f"Failed to verify audit {audit_id}: {e}")
            return False

    def get_status(self) -> Dict[str, Any]:
        """
        Returns live blockchain connection health and status metadata.
        """
        if not self.is_connected or not self.w3:
            return {
                "connected": False,
                "network": "DISCONNECTED",
                "chain_id": None,
                "latest_block_number": 0,
                "contract_address": None,
                "writer_account": None
            }

        try:
            latest_block = self.w3.eth.block_number
            chain_id = self.w3.eth.chain_id
            audit_count = self.contract.functions.getAuditCount().call() if self.contract else 0
            
            return {
                "connected": True,
                "network": self.network_name,
                "chain_id": chain_id,
                "latest_block_number": latest_block,
                "contract_address": self.contract_address,
                "writer_account": self.account.address if self.account else None,
                "audit_count_on_chain": audit_count
            }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e),
                "network": "ERROR",
                "latest_block_number": 0
            }

# Singleton instance
besu_client = BesuBlockchainClient()
