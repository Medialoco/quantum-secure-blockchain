/**
 * Ideal statevector of the paper's QRNG, plus the canonical SHA-256 payload.
 * Qubit 0 is the least significant bit, matching Qiskit Aer.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.Qrng = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function zeros(nBits) {
    const state = Array.from({ length: 1 << nBits }, () => ({ re: 0, im: 0 }));
    state[0] = { re: 1, im: 0 };
    return state;
  }

  function applyH(state, qubit) {
    const bit = 1 << qubit;
    const next = new Array(state.length);
    const scale = Math.SQRT1_2;
    for (let basis = 0; basis < state.length; basis++) {
      if (basis & bit) continue;
      const other = basis | bit;
      const left = state[basis];
      const right = state[other];
      next[basis] = {
        re: scale * (left.re + right.re),
        im: scale * (left.im + right.im),
      };
      next[other] = {
        re: scale * (left.re - right.re),
        im: scale * (left.im - right.im),
      };
    }
    return next;
  }

  function probabilities(state) {
    return state.map((amplitude) => amplitude.re * amplitude.re + amplitude.im * amplitude.im);
  }

  function browserRandom() {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] / 4294967296;
  }

  function sampleIndex(weights, random) {
    const draw = random();
    if (!(draw >= 0 && draw < 1)) {
      throw new Error("random() must return a number in [0, 1).");
    }
    let cumulative = 0;
    for (let index = 0; index < weights.length; index++) {
      cumulative += weights[index];
      if (draw < cumulative) return index;
    }
    return weights.length - 1;
  }

  function measure(options) {
    const settings = options || {};
    const nBits = settings.nBits === undefined ? 8 : settings.nBits;
    if (!Number.isInteger(nBits) || nBits < 1 || nBits > 12) {
      throw new Error("nBits must be an integer from 1 to 12.");
    }
    let state = zeros(nBits);
    for (let qubit = 0; qubit < nBits; qubit++) {
      state = applyH(state, qubit);
    }
    const weights = probabilities(state);
    const outcome = sampleIndex(weights, settings.random || browserRandom);
    const uniform = 1 / weights.length;
    let deviation = 0;
    let sum = 0;
    for (const weight of weights) {
      sum += weight;
      deviation = Math.max(deviation, Math.abs(weight - uniform));
    }
    return {
      nBits,
      value: outcome,
      bitstring: outcome.toString(2).padStart(nBits, "0"),
      uniformDeviation: deviation,
      probabilitySum: sum,
    };
  }

  function payload(timestamp, quantumProof, metadata) {
    if (!Number.isInteger(timestamp) || timestamp < 0) {
      throw new Error("timestamp must be a non-negative integer.");
    }
    if (!Number.isInteger(quantumProof) || quantumProof < 0) {
      throw new Error("quantumProof must be a non-negative integer.");
    }
    if (typeof metadata !== "string" || metadata.length === 0) {
      throw new Error("metadata must be a non-empty string.");
    }
    return `${timestamp}|${quantumProof}|${metadata}`;
  }

  async function sha256Hex(text) {
    const encoded = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return { measure, payload, sha256Hex };
});
