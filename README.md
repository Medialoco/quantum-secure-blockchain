# Quantum-Secure Blockchain Logging

This repository contains the source code and prototype implementation for the paper:

**"Quantum-Backed Integrity for Industrial Blockchain Events: A Secure Logging Framework Using Qiskit and Ethereum"**  
📅 Submitted to: [QIS Conference 2025](https://conference-questis.org/) (accepted)  

---

## 🧠 Project Overview

This proof-of-concept demonstrates a secure logging pipeline where each recorded event:
- is seeded with quantum-generated entropy using **IBM Qiskit**,
- is hashed with **SHA-256** for tamper detection,
- and is immutably stored via a **Solidity smart contract** on a local **Ethereum blockchain** powered by **Hardhat**.

The aim is to enhance data authenticity and traceability in industrial systems by fusing quantum physics and blockchain technologies.

---

## 🛠️ Technologies Used

- [Qiskit](https://qiskit.org/) – for quantum random number generation (QRNG)
- [Node.js](https://nodejs.org/) + [Web3.js](https://web3js.readthedocs.io/) – for blockchain interaction
- [Hardhat](https://hardhat.org/) – for smart contract development and local Ethereum simulation
- [Solidity](https://soliditylang.org/) – for smart contract implementation
- [Python](https://www.python.org/) – for quantum circuit execution and entropy export

---

## ⚙️ Local Setup & Usage

Make sure you have both **Python 3** and **Node.js** installed.

### 1. Clone the repo

```bash
git clone https://github.com/Medialoco/quantum-secure-blockchain.git
cd quantum-secure-blockchain
```

### 2. Install dependencies

```bash
# Python (QRNG)
pip install -r requirements.txt

# Node.js / Hardhat
npm install
```

### 3. Start the local blockchain node (Terminal 1)

```bash
npx hardhat node
```

Leave this terminal open — it runs the local Ethereum blockchain.

### 4. Run the event logging script (Terminal 2)

In a second terminal:

```bash
npx hardhat run scripts/setQuantum.js --network localhost
```

This will:
- Run a Qiskit quantum circuit to generate a random number,
- Construct a SHA-256 hash of the event (quantum value + metadata + timestamp),
- Store the event via a smart contract on the local chain,
- Retrieve and print the event for verification,
- Save the result to `quantum_event.json`.

---

## 📂 Project Structure

```
├── contracts/
│   └── QSecure.sol               # Solidity smart contract
├── scripts/
│   └── setQuantum.js            # Main script for quantum generation and event logging
├── qrng.py                      # Quantum circuit for QRNG (Qiskit)
├── quantum_proof.json           # Output: raw quantum proof
├── quantum_event.json           # Output: stored event details
├── requirements.txt             # Python dependencies
├── README.md
```

---

## 🧪 Example Output

```bash
✅ QSecure deployed at: 0x...
🎲 Quantum-generated number: 214
🔒 SHA-256 event hash: ...
📊 Total events recorded: 1
📦 Event details:
  ⏱️ Timestamp      : 1744230722
  🧬 Quantum Proof  : 214
  📋 Metadata       : Component validated – Checkpoint A
  🔒 Stored SHA-256 : ...
💾 Event details saved to quantum_event.json
```

---

## 📌 Future Work

This repo is a foundational prototype. Future versions may include:
- Real quantum backend integration (IBM Q Cloud),
- Digital signatures for authentication,
- Public blockchain deployment (e.g., Sepolia, Polygon),
- Event indexing with The Graph.

---

## 📝 License

MIT – © 2025, Medialoco LLC
