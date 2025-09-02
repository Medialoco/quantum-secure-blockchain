from qiskit import QuantumCircuit
from qiskit.visualization import circuit_drawer

# Crée un circuit de 8 qubits + 8 bits classiques
qc = QuantumCircuit(8, 8)
qc.h(range(8))
qc.measure(range(8), range(8))

# Sauvegarde en PNG
circuit_drawer(qc, output='mpl', filename='quantum_circuit.png')