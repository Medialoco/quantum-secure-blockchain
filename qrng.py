from qiskit import QuantumCircuit
from qiskit_aer import Aer
import json
from datetime import datetime, timezone

def generate_quantum_random_bits(n_bits=8, save_path="quantum_proof.json"):
    # Create the quantum circuit
    circuit = QuantumCircuit(n_bits, n_bits)
    circuit.h(range(n_bits))                         # Put all qubits in superposition
    circuit.measure(range(n_bits), range(n_bits))    # Measure all qubits

    # Use Aer simulator
    backend = Aer.get_backend("qasm_simulator")
    job = backend.run(circuit, shots=1)
    result = job.result()

    # Extract measured bitstring and convert to integer
    counts = result.get_counts()
    bitstring = list(counts.keys())[0]
    value = int(bitstring, 2)

    # Save quantum proof (without qasm, using ASCII circuit diagram instead)
    proof = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "bitstring": bitstring,
        "value": value,
        "n_bits": n_bits,
        "circuit_ascii": circuit.draw(output='text').single_string()
    }

    with open(save_path, "w") as f:
        json.dump(proof, f, indent=2)

    return value

if __name__ == "__main__":
    print(generate_quantum_random_bits())
