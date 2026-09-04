// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AuditLedger
 * @dev Immutable audit log anchoring smart contract for VIGILANT Financial Cybercrime Intelligence.
 * Records SHA-256 cryptographic hashes of canonical investigation events on Hyperledger Besu.
 */
contract AuditLedger {
    address public owner;

    struct AuditRecord {
        string caseId;
        string eventType;
        bytes32 eventHash;
        uint256 timestamp;
        address submitter;
        bool exists;
    }

    // Mapping from auditId (e.g., "AUD-2026-0001") to AuditRecord
    mapping(string => AuditRecord) private audits;
    
    // Ordered list of audit IDs for pagination / inspection
    string[] private auditIds;

    // Events
    event AuditRecorded(
        string indexed auditId,
        string caseId,
        string eventType,
        bytes32 eventHash,
        uint256 timestamp,
        address indexed submitter
    );

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "AuditLedger: Caller is not authorized writer");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @notice Records a new cryptographic audit hash on-chain.
     * @param auditId Unique identifier of the audit entry.
     * @param caseId Associated case ID or 'GLOBAL'.
     * @param eventType Action/event category (e.g., 'CASE_OPENED', 'PROACTIVE_FREEZE').
     * @param eventHash SHA-256 hash of the canonical JSON audit payload.
     */
    function recordAudit(
        string calldata auditId,
        string calldata caseId,
        string calldata eventType,
        bytes32 eventHash
    ) external onlyOwner {
        require(bytes(auditId).length > 0, "AuditLedger: auditId cannot be empty");
        require(eventHash != bytes32(0), "AuditLedger: eventHash cannot be zero");
        require(!audits[auditId].exists, "AuditLedger: Audit record already exists - immutability enforced");

        audits[auditId] = AuditRecord({
            caseId: caseId,
            eventType: eventType,
            eventHash: eventHash,
            timestamp: block.timestamp,
            submitter: msg.sender,
            exists: true
        });

        auditIds.push(auditId);

        emit AuditRecorded(
            auditId,
            caseId,
            eventType,
            eventHash,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @notice Retrieves a stored audit record.
     * @param auditId The audit identifier to query.
     */
    function getAudit(string calldata auditId) external view returns (
        string memory caseId,
        string memory eventType,
        bytes32 eventHash,
        uint256 timestamp,
        address submitter,
        bool exists
    ) {
        AuditRecord memory record = audits[auditId];
        return (
            record.caseId,
            record.eventType,
            record.eventHash,
            record.timestamp,
            record.submitter,
            record.exists
        );
    }

    /**
     * @notice Verifies if a computed SHA-256 hash matches the on-chain recorded hash.
     * @param auditId The audit identifier to verify.
     * @param computedHash The recomputed SHA-256 hash from the database.
     * @return isValid True if record exists and hashes match exactly.
     */
    function isAuditValid(string calldata auditId, bytes32 computedHash) external view returns (bool) {
        if (!audits[auditId].exists) {
            return false;
        }
        return audits[auditId].eventHash == computedHash;
    }

    /**
     * @notice Returns the total count of audit records anchored on-chain.
     */
    function getAuditCount() external view returns (uint256) {
        return auditIds.length;
    }

    /**
     * @notice Returns the audit ID at a specific index.
     */
    function getAuditIdAtIndex(uint256 index) external view returns (string memory) {
        require(index < auditIds.length, "AuditLedger: Index out of bounds");
        return auditIds[index];
    }

    /**
     * @notice Transfers contract ownership to a new authorized backend writer.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AuditLedger: New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
