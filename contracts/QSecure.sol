// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title Quantum-backed industrial event logger
/// @author Benoît Prieur, Medialoco LLC
/// @notice Companion contract for "Quantum-Backed Integrity for Industrial
///         Blockchain Events" (QUEST-IS 2025, CCIS 2744, pp. 346–351).
///         Each event keeps a timestamp, a QRNG tag, metadata, and the SHA-256
///         fingerprint of those three fields. The fingerprint is recomputed
///         on-chain, so a hash that does not match the stored fields is rejected.
contract QSecure {
    address public immutable owner;

    struct EventRecord {
        uint256 timestamp;
        uint256 quantumProof;
        string metadata;
        bytes32 eventHash;
        uint256 loggedAt;
    }

    EventRecord[] private _events;

    event EventRecorded(
        uint256 indexed id,
        uint256 timestamp,
        uint256 quantumProof,
        bytes32 eventHash
    );

    error NotOwner();
    error EmptyMetadata();
    error UnknownEvent(uint256 index);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Log one industrial event. `timestamp` is the event time, in Unix seconds.
    ///         `loggedAt` is the chain time of this transaction and is not part of the hash.
    function recordEvent(
        uint256 timestamp,
        uint256 quantumProof,
        string calldata metadata
    ) external returns (uint256 id, bytes32 eventHash) {
        if (msg.sender != owner) revert NotOwner();
        if (bytes(metadata).length == 0) revert EmptyMetadata();

        eventHash = fingerprint(timestamp, quantumProof, metadata);
        id = _events.length;
        _events.push(
            EventRecord({
                timestamp: timestamp,
                quantumProof: quantumProof,
                metadata: metadata,
                eventHash: eventHash,
                loggedAt: block.timestamp
            })
        );
        emit EventRecorded(id, timestamp, quantumProof, eventHash);
    }

    /// @notice UTF-8 message whose SHA-256 is the event fingerprint.
    ///         Layout: decimal(timestamp) "|" decimal(quantumProof) "|" metadata
    function canonicalPayload(
        uint256 timestamp,
        uint256 quantumProof,
        string memory metadata
    ) public pure returns (string memory) {
        return string.concat(_toString(timestamp), "|", _toString(quantumProof), "|", metadata);
    }

    function fingerprint(
        uint256 timestamp,
        uint256 quantumProof,
        string memory metadata
    ) public pure returns (bytes32) {
        return sha256(bytes(canonicalPayload(timestamp, quantumProof, metadata)));
    }

    /// @notice Named readEvent rather than getEvent: ethers.js reserves getEvent
    ///         for looking up a Solidity event fragment.
    function readEvent(uint256 index) external view returns (EventRecord memory) {
        return _at(index);
    }

    function totalEvents() external view returns (uint256) {
        return _events.length;
    }

    /// @notice Recomputes the fingerprint from the stored fields.
    function verify(uint256 index) external view returns (bool) {
        EventRecord memory item = _at(index);
        return item.eventHash == fingerprint(item.timestamp, item.quantumProof, item.metadata);
    }

    function _at(uint256 index) private view returns (EventRecord memory) {
        if (index >= _events.length) revert UnknownEvent(index);
        return _events[index];
    }

    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
