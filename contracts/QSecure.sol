// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Quantum-Secured Industrial Event Logger
/// @author 
/// @notice Stores quantum-proofed industrial events with SHA-256 integrity verification
contract QSecure {
    address public owner;

    /// @notice Struct to represent a secured event
    struct Event {
        uint256 timestamp;        // Blockchain timestamp
        uint256 quantumProof;     // Quantum-generated proof (Qiskit QRNG)
        string metadata;          // Descriptive event details
        bytes32 eventHash;        // SHA-256 hash (integrity proof)
    }

    /// @notice Array storing all secured events
    Event[] public events;

    /// @notice Constructor, sets contract deployer as owner
    constructor() {
        owner = msg.sender;
    }

    /// @notice Record a quantum-secured industrial event
    /// @param _quantumProof Quantum-generated integer proof
    /// @param _metadata Description of the event (checkpoint, batch ID, etc.)
    /// @param _eventHash SHA-256 integrity hash of event data
    function recordEvent(
        uint256 _quantumProof,
        string calldata _metadata,
        bytes32 _eventHash
    ) external {
        require(msg.sender == owner, "Only owner can record");
        events.push(Event(block.timestamp, _quantumProof, _metadata, _eventHash));
    }

    /// @notice Retrieve an event by index
    /// @param index Index of the event
    /// @return Entire event struct
    function getEvent(uint index) public view returns (Event memory) {
        require(index < events.length, "Invalid index");
        return events[index];
    }

    /// @notice Get total number of recorded events
    /// @return Total events count
    function totalEvents() public view returns (uint256) {
        return events.length;
    }
}
