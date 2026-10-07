# Chapter Companion

#ChapterCompanion

Chapter Companion du chapitre Springer. Le code Qiskit et Ethereum n’est pas modifié. La démo est à côté.

> Benoît Prieur (2026). *Quantum-Backed Integrity for Industrial Blockchain Events: A Secure Logging Framework Using Qiskit and Ethereum.* In Frédéric Barbaresco and François Gerin (eds), *Quantum Engineering Sciences and Technologies for Industry and Services*, QUEST-IS 2025. Communications in Computer and Information Science, vol. 2744, pp. 346–351. Springer, Cham.  
> [https://doi.org/10.1007/978-3-032-13855-2_32](https://doi.org/10.1007/978-3-032-13855-2_32)

Presented on 2 December 2025 at [QUEST-IS](https://conference-questis.org/quest-is-2025/program/2nd-december-2025/), EDF Lab Paris-Saclay.

The live demo is [https://medialoco.github.io/quantum-secure-blockchain/](https://medialoco.github.io/quantum-secure-blockchain/). This page matches [chapter-companion-0.1.2](https://github.com/Medialoco/quantum-secure-blockchain/tree/chapter-companion-0.1.2). The circuit library is [RustQIP](https://github.com/Renmusxd/RustQIP). The repository stays private. The Pages URL is public, because the Team plan cannot host a private site.

## Two trees

| | Chapter code | Demo |
| --- | --- | --- |
| Where | repository root | `demo/` and `docs/` |
| Measurement | Qiskit Aer, `qrng.py` | [RustQIP](https://github.com/Renmusxd/RustQIP) |
| Ledger | Solidity `QSecure` on Hardhat | the same rules, in Rust |
| Browser | | WebAssembly |

The fingerprint is shared:

```text
SHA-256( UTF-8( decimal(timestamp) + "|" + decimal(quantumProof) + "|" + metadata ) )
```

`test/vectors.json` freezes three messages. The demo tests read that file.

## Chapter code

Python 3.12 and Node.js 20. Qiskit 2.5 does not target Python 3.14.

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm install
npm test
npm run log
```

`npm run log` deploys `QSecure` on Hardhat’s in-process network, draws one Aer shot, and checks the on-chain fingerprint. A persistent node:

```bash
npx hardhat node
npx hardhat run scripts/setQuantum.js --network localhost
```

`EVENT_METADATA` and `EVENT_TIMESTAMP` override the event. `QRNG_PYTHON` overrides the interpreter. The Python checks:

```bash
.venv/bin/python -m unittest tests.test_qrng
```

Qiskit prints qubit 0 on the right. The integer is that bitstring read as a binary number. `loggedAt` is `block.timestamp` and is not part of the hash.

This path is a classical simulation of the circuit on Aer, then a local Hardhat chain. It is not a physical quantum source, and it is not a public Ethereum network.

## Demo

RustQIP runs the same eight-qubit circuit: one Hadamard per qubit, one measurement. The first qubit is the least significant bit. The page draws one shot when it opens and shows the SHA-256 of that event. Hardhat stays with the chapter code.

```bash
cargo test --manifest-path demo/Cargo.toml
wasm-pack build demo --target web --release --out-dir ../docs/pkg
rm -f docs/pkg/.gitignore
npm run demo
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173). `docs/pkg/` is the build already published with the site, so the page works without a local Rust install.

## Releases

Demo releases are tagged `chapter-companion-x.y.z`. The page links to the tag it was built from. These tags package the demo. They do not version the chapter’s Qiskit and Hardhat tree.

## Layout

```text
qrng.py                        Qiskit Aer shot
contracts/QSecure.sol          chapter contract
scripts/setQuantum.js          Hardhat logging script
test/                          contract tests and fingerprint vectors
circuits/quantum_circuit.png   the 8-qubit figure
demo/                          RustQIP measurement and fingerprint
docs/                          Chapter Companion page
docs/pkg/                      WebAssembly build of demo/
```

## License

MIT. Cite the paper if you use the code. See `CITATION.cff`.
