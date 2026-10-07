import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT))

from qrng import generate_quantum_random_bits

VECTORS = json.loads((ROOT / "test" / "vectors.json").read_text(encoding="utf-8"))


class QrngTests(unittest.TestCase):
    def test_seeded_shots_match_and_use_qiskit_bit_order(self):
        first = generate_quantum_random_bits(seed=7)
        second = generate_quantum_random_bits(seed=7)
        self.assertEqual(first["bitstring"], second["bitstring"])
        self.assertEqual(first["value"], int(first["bitstring"], 2))
        self.assertEqual(len(first["bitstring"]), 8)
        self.assertEqual(first["backend"], "qiskit_aer.AerSimulator")
        self.assertEqual(first["seed_simulator"], 7)

    def test_vectors_use_the_same_utf8_layout_as_the_contract(self):
        import hashlib

        for vector in VECTORS:
            body = f"{vector['timestamp']}|{vector['quantumProof']}|{vector['metadata']}"
            digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
            self.assertEqual(digest, vector["sha256"])


if __name__ == "__main__":
    unittest.main()
