# Quantum-Backed Integrity for Industrial Blockchain Events

Chapter Companion du chapitre Springer. Le dépôt reste privé.

Reference implementation of:

> Benoît Prieur (2026). *Quantum-Backed Integrity for Industrial Blockchain Events: A Secure Logging Framework Using Qiskit and Ethereum.* In Frédéric Barbaresco and François Gerin (eds), *Quantum Engineering Sciences and Technologies for Industry and Services*, QUEST-IS 2025. Communications in Computer and Information Science, vol. 2744, pp. 346–351. Springer, Cham.  
> [https://doi.org/10.1007/978-3-032-13855-2_32](https://doi.org/10.1007/978-3-032-13855-2_32)

Presented on 2 December 2025 at [QUEST-IS](https://conference-questis.org/quest-is-2025/program/2nd-december-2025/), EDF Lab Paris-Saclay.

## Pipeline

Each industrial event carries three fields. Their UTF-8 concatenation is hashed with SHA-256, and the hash is stored on a local Ethereum chain.

```text
timestamp | quantumProof | metadata
                         │
                         ▼
                     SHA-256
                         │
                         ▼
              QSecure.recordEvent(...)
```

`timestamp` is the event time, in Unix seconds. `quantumProof` is one shot of an 8-qubit circuit: a Hadamard on every qubit, then a computational-basis measurement. `metadata` is the industrial description, kept as text. The contract recomputes the fingerprint with the SHA-256 precompile and stores it with the three fields. `loggedAt` is `block.timestamp`, the moment the transaction is included. It is not part of the hash.

Qiskit prints the bitstring with qubit 0 on the right. The integer is that bitstring read as a binary number. The browser demo uses the same convention.

## What the code does, and what it does not

The circuit is the prepare-and-measure QRNG described in the paper. The default backend is the Qiskit Aer simulator. The browser page simulates the same ideal circuit and samples the Born distribution with the Web Crypto generator. Both are classical executions of the circuit. A run on a quantum processor would use the same gate sequence; this repository does not ship a hardware backend.

The chain is a local Hardhat network. Nothing in the default path is broadcast to Ethereum mainnet or to a public testnet.

## Canonical fingerprint

```text
SHA-256( UTF-8( decimal(timestamp) + "|" + decimal(quantumProof) + "|" + metadata ) )
```

Decimal fields have no leading zeros. The separator is the ASCII vertical bar. Metadata is taken as-is, including spaces and non-ASCII characters. `test/vectors.json` freezes three messages, including one that differs only by a hyphen versus an en dash.

## Run the reference pipeline

Python 3.12 and Node.js 20 are the versions used to check this repository. Qiskit 2.5 does not target Python 3.14.

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

npm install
npm test
npm run log
```

`npm run log` deploys `QSecure` on Hardhat’s in-process network, draws one Aer shot, records the event, checks the on-chain fingerprint against the local SHA-256, and writes `quantum_event.json`. That file is a run artifact and is not committed.

To keep the chain process alive and deploy against it:

```bash
npx hardhat node
npx hardhat run scripts/setQuantum.js --network localhost
```

Override the event fields with `EVENT_METADATA` and `EVENT_TIMESTAMP`. Override the interpreter with `QRNG_PYTHON` if `.venv/bin/python` is not the one you want.

The Python checks:

```bash
.venv/bin/python -m unittest tests.test_qrng
```

## Chapter Companion

The page in `docs/` runs the same pipeline in the browser, without Qiskit or a local chain. It is published at [https://medialoco.github.io/quantum-secure-blockchain/](https://medialoco.github.io/quantum-secure-blockchain/).

To open the same page on this machine:

```bash
npm run demo
```

Then visit [http://127.0.0.1:4173](http://127.0.0.1:4173). Measure one shot, edit the metadata or the timestamp, and anchor the event. Changing the stored metadata in the ledger recomputes the fingerprint and shows the mismatch. The ledger stays in the browser.

`npm run log` still needs Python and Hardhat on your machine. GitHub Pages only serves the Chapter Companion.

## Layout

```text
contracts/QSecure.sol          event log and on-chain SHA-256
qrng.py                        Qiskit Aer shot
scripts/setQuantum.js          deploy, log, compare fingerprints
docs/                          Chapter Companion, the browser pipeline
test/                          contract tests and frozen SHA-256 vectors
tests/                         Aer shot and the browser fingerprint checks
circuits/quantum_circuit.png   the 8-qubit figure
```

## License

MIT. Cite the paper if you use the code. See `CITATION.cff`.
