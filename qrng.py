"""Single-shot Hadamard QRNG used by the QUEST-IS 2025 logging pipeline.

The circuit puts ``n`` qubits into equal superposition and measures them once.
Qiskit Aer samples the resulting Born distribution. That is a simulation of the
circuit, not a physical quantum source. Bitstrings follow Qiskit's convention:
qubit 0 is the rightmost bit.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator


def build_circuit(n_bits: int = 8) -> QuantumCircuit:
    if not 1 <= n_bits <= 16:
        raise ValueError("n_bits must be between 1 and 16")
    circuit = QuantumCircuit(n_bits, n_bits)
    circuit.h(range(n_bits))
    circuit.measure(range(n_bits), range(n_bits))
    return circuit


def generate_quantum_random_bits(n_bits: int = 8, seed: int | None = None) -> dict:
    circuit = build_circuit(n_bits)
    backend = AerSimulator()
    options = {"shots": 1}
    if seed is not None:
        options["seed_simulator"] = int(seed)
    counts = backend.run(circuit, **options).result().get_counts()
    bitstring = next(iter(counts))
    proof = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "bitstring": bitstring,
        "value": int(bitstring, 2),
        "n_bits": n_bits,
        "shots": 1,
        "backend": "qiskit_aer.AerSimulator",
        "qubit0": "rightmost bit",
        "circuit_ascii": str(circuit.draw(output="text")),
    }
    if seed is not None:
        proof["seed_simulator"] = int(seed)
    return proof


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bits", type=int, default=8)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument(
        "--json",
        action="store_true",
        help="print the proof as one JSON object on stdout",
    )
    parser.add_argument("--output", default="quantum_proof.json")
    args = parser.parse_args(argv)

    proof = generate_quantum_random_bits(args.bits, seed=args.seed)
    Path(args.output).write_text(json.dumps(proof, indent=2) + "\n", encoding="utf-8")
    if args.json:
        print(json.dumps(proof))
    else:
        print(proof["value"])


if __name__ == "__main__":
    main()
