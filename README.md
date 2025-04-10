# Quantum-Secure Blockchain Logging

This repository contains the source code for the paper:

**"Quantum-Backed Integrity for Industrial Blockchain Events: A Secure Logging Framework Using Qiskit and Ethereum"**    
🔗 Submission: [QIS Conference 2025 ](https://conference-questis.org/) 

## Overview

This proof-of-concept integrates:
- Quantum Random Number Generation using **Qiskit**,
- A **Solidity smart contract** deployed via **Hardhat**,
- Event hashing using **SHA-256**,
- Blockchain logging and retrieval using **Web3.js**.

Each event is:
- Quantum-randomized,
- Cryptographically sealed,
- Immutably stored on an Ethereum-compatible blockchain.

The goal is to demonstrate how quantum entropy can enhance data integrity in critical industrial logging systems.

## Usage (Local Setup)

Make sure Python and Node.js are installed.

### 1. Install dependencies

```bash
# Python
pip install -r requirements.txt

# Node.js / Hardhat
npm install
