const test = require("node:test");
const assert = require("node:assert/strict");
const vectors = require("../test/vectors.json");
const { measure, payload, sha256Hex } = require("../docs/qrng");

test("a zero draw on the ideal Hadamard circuit is the zero bitstring", () => {
  const shot = measure({ nBits: 8, random: () => 0 });
  assert.equal(shot.value, 0);
  assert.equal(shot.bitstring, "00000000");
  assert.ok(shot.uniformDeviation < 1e-9);
  assert.ok(Math.abs(shot.probabilitySum - 1) < 1e-9);
});

test("one Hadamard qubit can land on either outcome", () => {
  assert.equal(measure({ nBits: 1, random: () => 0 }).value, 0);
  assert.equal(measure({ nBits: 1, random: () => 0.999999 }).bitstring, "1");
});

test("browser fingerprints match the shared vectors", async () => {
  for (const vector of vectors) {
    const digest = await sha256Hex(payload(vector.timestamp, vector.quantumProof, vector.metadata));
    assert.equal(digest, vector.sha256);
  }
});

test("qubit 0 is the rightmost bit, as in Qiskit", () => {
  const shot = measure({ nBits: 8, random: () => 1 / 256 + 1e-12 });
  assert.equal(shot.value, 1);
  assert.equal(shot.bitstring, "00000001");
});
