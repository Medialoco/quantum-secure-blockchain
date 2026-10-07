import init, { canonicalPayload, fingerprintHex, measureShot } from "./pkg/chapter_companion.js";

const COPY = {
  fr: {
    title: "Chapter Companion",
    step1: "Circuit",
    step2: "Empreinte",
    circuitTitle: "Circuit",
    measure: "Nouveau tirage",
    bitsLabel: "Bits mesurés",
    valueLabel: "Entier",
    hashTitle: "Empreinte",
    metaLabel: "Métadonnée",
    timeLabel: "Horodatage (secondes Unix)",
    payloadLabel: "Message canonique",
    hashLabel: "SHA-256",
    deviation: "Born",
    wasmError: "WebAssembly",
    selftestPass: "self-test passed",
    selftestFail: "self-test failed",
  },
  en: {
    title: "Chapter Companion",
    step1: "Circuit",
    step2: "Fingerprint",
    circuitTitle: "Circuit",
    measure: "Draw again",
    bitsLabel: "Measured bits",
    valueLabel: "Integer",
    hashTitle: "Fingerprint",
    metaLabel: "Metadata",
    timeLabel: "Timestamp (Unix seconds)",
    payloadLabel: "Canonical message",
    hashLabel: "SHA-256",
    deviation: "Born",
    wasmError: "WebAssembly",
    selftestPass: "self-test passed",
    selftestFail: "self-test failed",
  },
};

const SAMPLE = "Component validated - Checkpoint A";

function storedLang() {
  try {
    return localStorage.getItem("qsecure-lang-v2");
  } catch {
    return null;
  }
}

const requestedLang = new URLSearchParams(location.search).get("lang");
const state = {
  lang: requestedLang === "fr" || requestedLang === "en" ? requestedLang : storedLang() || "en",
  shot: null,
};

const els = {
  metadata: document.querySelector("#metadata"),
  timestamp: document.querySelector("#timestamp"),
  payload: document.querySelector("#payload"),
  hash: document.querySelector("#hash"),
  measure: document.querySelector("#measure"),
  shot: document.querySelector("#shot"),
  bits: document.querySelector("#bits"),
  value: document.querySelector("#value"),
  deviation: document.querySelector("#deviation"),
  error: document.querySelector("#form-error"),
  selftest: document.querySelector("#selftest"),
};

els.metadata.value = SAMPLE;
els.timestamp.value = String(Math.floor(Date.now() / 1000));

const ready = init().catch((error) => {
  els.error.textContent = `${text("wasmError")} ${error instanceof Error ? error.message : error}`;
  throw error;
});

function text(key) {
  return COPY[state.lang][key];
}

function applyLanguage() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = text(node.dataset.i18n);
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === state.lang));
  });
  try {
    localStorage.setItem("qsecure-lang-v2", state.lang);
  } catch {
    /* Language still switches for this page view. */
  }
  renderShot();
}

function readTimestamp() {
  if (els.timestamp.value.trim() === "") return null;
  const timestamp = Number(els.timestamp.value);
  if (!Number.isInteger(timestamp) || timestamp < 0) return null;
  return timestamp;
}

function renderShot() {
  if (!state.shot) {
    els.shot.hidden = true;
    return;
  }
  els.shot.hidden = false;
  els.bits.replaceChildren();
  ["q7", "q6", "q5", "q4", "q3", "q2", "q1", "q0"].forEach((label, index) => {
    const item = document.createElement("li");
    item.textContent = state.shot.bitstring[index];
    item.title = label;
    els.bits.append(item);
  });
  els.value.textContent = String(state.shot.value);
  els.deviation.textContent = `${text("deviation")} ${state.shot.probability.toFixed(4)}`;
}

function showFingerprint() {
  const timestamp = readTimestamp();
  const metadata = els.metadata.value;
  if (!state.shot || timestamp === null || metadata.length === 0) {
    els.payload.textContent = "—";
    els.hash.textContent = "—";
    return;
  }
  const quantum = BigInt(state.shot.value);
  const when = BigInt(timestamp);
  els.payload.textContent = canonicalPayload(when, quantum, metadata);
  els.hash.textContent = fingerprintHex(when, quantum, metadata);
}

async function measure() {
  await ready;
  const shot = measureShot();
  state.shot = {
    value: shot.value,
    bitstring: shot.bitstring,
    probability: shot.probability,
  };
  shot.free();
  renderShot();
  showFingerprint();
}

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    state.lang = button.dataset.lang;
    applyLanguage();
  });
});

els.measure.addEventListener("click", () => {
  measure().catch((error) => {
    els.error.textContent = error instanceof Error ? error.message : String(error);
  });
});
els.metadata.addEventListener("input", showFingerprint);
els.timestamp.addEventListener("input", showFingerprint);

applyLanguage();
measure().catch((error) => {
  els.error.textContent = error instanceof Error ? error.message : String(error);
});

async function selfTest() {
  const failures = [];
  try {
    await ready;
    const vector = fingerprintHex(1744230722n, 214n, SAMPLE);
    if (vector !== "3fdde02648272556e7f8b9a6e1c4e801780e1dbe2541da1eec352d6107d524c3") {
      failures.push("vector");
    }
    await measure();
    if (!state.shot || !/^[01]{8}$/.test(state.shot.bitstring)) failures.push("shot");
    if (state.shot && Number.parseInt(state.shot.bitstring, 2) !== state.shot.value) failures.push("value");
    if (els.hash.textContent.length !== 64) failures.push("hash");
    if (!document.querySelector("#ledger")) {
      /* The page no longer has a ledger. */
    } else failures.push("ledger");
  } catch (error) {
    failures.push(String(error));
  }
  document.documentElement.dataset.selftest = failures.length ? "fail" : "pass";
  els.selftest.hidden = false;
  els.selftest.textContent = failures.length
    ? `${text("selftestFail")}: ${failures.join(", ")}`
    : text("selftestPass");
}

if (new URLSearchParams(location.search).has("selftest")) {
  selfTest();
}
