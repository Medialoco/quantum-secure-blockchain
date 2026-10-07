"""Regenerate the 8-qubit QRNG figure stored next to this script.

Requires matplotlib in addition to Qiskit:
    pip install matplotlib
"""

from pathlib import Path

from qiskit import QuantumCircuit


def main() -> None:
    circuit = QuantumCircuit(8, 8)
    circuit.h(range(8))
    circuit.measure(range(8), range(8))
    destination = Path(__file__).with_name("quantum_circuit.png")
    circuit.draw(output="mpl", filename=str(destination))
    print(destination)


if __name__ == "__main__":
    main()
