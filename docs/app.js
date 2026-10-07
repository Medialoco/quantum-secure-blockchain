import init, {
  canonicalPayload,
  fingerprintHex,
  measureShot,
  verifyFingerprint,
} from "./pkg/chapter_companion.js";

const COPY = {
  fr: {
    title: "Chapter Companion",
    lead: "Démo posée à côté du code Qiskit et Ethereum du chapitre. RustQIP fait la mesure. Le registre Rust rejoue les règles du contrat. Les deux tournent en WebAssembly.",
    step1: "Circuit",
    step2: "Empreinte",
    step3: "Registre",
    circuitTitle: "Mesurer le circuit",
    circuitCaption: "Huit qubits, une porte de Hadamard, une mesure. RustQIP. Le premier qubit est le bit de droite.",
    measure: "Mesurer — 1 shot",
    bitsLabel: "Bits mesurés",
    valueLabel: "Entier",
    hashTitle: "Construire l’empreinte",
    metaLabel: "Métadonnée",
    timeLabel: "Horodatage de l’événement (secondes Unix)",
    payloadLabel: "Message canonique",
    hashLabel: "SHA-256",
    record: "Ancrer dans le registre",
    ledgerTitle: "Registre local",
    ledgerHint: "Simulation Rust des règles de QSecure, pas un nœud Hardhat. L’empreinte est recalculée dans le module WebAssembly. L’heure d’ancrage n’entre pas dans le hash.",
    reset: "Effacer",
    empty: "Aucun événement ancré.",
    verifyOk: "conforme",
    verifyBad: "rompue",
    colId: "#",
    colTime: "Horodatage",
    colQ: "Preuve",
    colMeta: "Métadonnée observée",
    colHash: "Empreinte stockée",
    colCheck: "Contrôle",
    deviation: "Probabilité de Born de ce résultat :",
    scope: "On assume RustQIP pour cette démo. Le script Qiskit et le contrat Hardhat du chapitre restent dans le dépôt, inchangés. Hardhat n’a pas d’équivalent dans la page : un nœud Ethereum ne tient pas dans le navigateur. Le registre est la simulation Rust des mêmes règles, compilée en WebAssembly. Ce n’est pas une source quantique physique.",
    needShot: "Mesurez le circuit avant d’ancrer un événement.",
    badTime: "L’horodatage doit être un entier positif ou nul.",
    badMeta: "La métadonnée ne peut pas être vide.",
    selftestPass: "self-test passé",
    selftestFail: "self-test en échec",
  },
  en: {
    title: "Chapter Companion",
    lead: "A demo beside the chapter’s Qiskit and Ethereum code. RustQIP performs the measurement. The Rust ledger replays the contract rules. Both run as WebAssembly.",
    step1: "Circuit",
    step2: "Fingerprint",
    step3: "Ledger",
    circuitTitle: "Measure the circuit",
    circuitCaption: "Eight qubits, one Hadamard each, then one measurement. RustQIP. The first qubit is the rightmost bit.",
    measure: "Measure — 1 shot",
    bitsLabel: "Measured bits",
    valueLabel: "Integer",
    hashTitle: "Build the fingerprint",
    metaLabel: "Metadata",
    timeLabel: "Event timestamp (Unix seconds)",
    payloadLabel: "Canonical message",
    hashLabel: "SHA-256",
    record: "Anchor in the ledger",
    ledgerTitle: "Local ledger",
    ledgerHint: "A Rust simulation of the QSecure rules, not a Hardhat node. The fingerprint is recomputed inside the WebAssembly module. The anchor time is not part of the hash.",
    reset: "Clear",
    empty: "No anchored event yet.",
    verifyOk: "matches",
    verifyBad: "broken",
    colId: "#",
    colTime: "Timestamp",
    colQ: "Proof",
    colMeta: "Observed metadata",
    colHash: "Stored fingerprint",
    colCheck: "Check",
    deviation: "Born probability of this outcome:",
    scope: "This demo assumes RustQIP. The chapter’s Qiskit script and Hardhat contract stay in the repository, unchanged. Hardhat has no browser port: an Ethereum node does not belong in the page. The ledger is the Rust simulation of those same rules, compiled to WebAssembly. It is not a physical quantum source.",
    needShot: "Measure the circuit before anchoring an event.",
    badTime: "The timestamp must be a non-negative integer.",
    badMeta: "Metadata cannot be empty.",
    selftestPass: "self-test passed",
    selftestFail: "self-test failed",
  },
};

const SAMPLE = "Component validated - Checkpoint A";
const STORAGE_KEY = "qsecure-ledger-v1";

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
  ledger: loadLedger(),
};

const els = {
  metadata: document.querySelector("#metadata"),
  timestamp: document.querySelector("#timestamp"),
  payload: document.querySelector("#payload"),
  hash: document.querySelector("#hash"),
  record: document.querySelector("#record"),
  measure: document.querySelector("#measure"),
  shot: document.querySelector("#shot"),
  bits: document.querySelector("#bits"),
  value: document.querySelector("#value"),
  deviation: document.querySelector("#deviation"),
  ledger: document.querySelector("#ledger"),
  error: document.querySelector("#form-error"),
  selftest: document.querySelector("#selftest"),
};

els.metadata.value = SAMPLE;
els.timestamp.value = String(Math.floor(Date.now() / 1000));
els.measure.disabled = true;

const ready = init().then(() => {
  els.measure.disabled = false;
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
  renderLedger();
  refreshFingerprint();
}

function loadLedger() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLedger() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.ledger));
  } catch {
    /* The ledger still works for this page view when storage is blocked. */
  }
}

function renderShot() {
  if (!state.shot) {
    els.shot.hidden = true;
    return;
  }
  els.shot.hidden = false;
  els.bits.replaceChildren();
  const labels = ["q7", "q6", "q5", "q4", "q3", "q2", "q1", "q0"];
  [...state.shot.bitstring].forEach((bit, index) => {
    const item = document.createElement("li");
    item.textContent = bit;
    item.title = labels[index] || "";
    els.bits.append(item);
  });
  els.value.textContent = String(state.shot.value);
  els.deviation.textContent = `${text("deviation")} ${state.shot.probability.toFixed(4)}`;
}

function readTimestamp() {
  if (els.timestamp.value.trim() === "") return null;
  const timestamp = Number(els.timestamp.value);
  if (!Number.isInteger(timestamp) || timestamp < 0) return null;
  return timestamp;
}

async function refreshFingerprint() {
  els.error.textContent = "";
  const timestamp = readTimestamp();
  const metadata = els.metadata.value;
  if (!state.shot || timestamp === null || metadata.length === 0) {
    els.payload.textContent = "—";
    els.hash.textContent = "—";
    els.record.disabled = true;
    return;
  }
  await ready;
  const body = canonicalPayload(BigInt(timestamp), BigInt(state.shot.value), metadata);
  els.payload.textContent = body;
  els.hash.textContent = fingerprintHex(BigInt(timestamp), BigInt(state.shot.value), metadata);
  els.record.disabled = false;
}

function renderLedger() {
  els.ledger.replaceChildren();
  if (state.ledger.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = text("empty");
    els.ledger.append(empty);
    return;
  }

  const table = document.createElement("table");
  table.className = "ledger-table";
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["colId", "colTime", "colQ", "colMeta", "colHash", "colCheck"].forEach((key) => {
    const cell = document.createElement("th");
    cell.textContent = text(key);
    headRow.append(cell);
  });
  head.append(headRow);
  table.append(head);

  const body = document.createElement("tbody");
  state.ledger.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.append(
      cell(String(entry.id), text("colId")),
      cell(String(entry.timestamp), text("colTime")),
      cell(String(entry.quantumProof), text("colQ"))
    );

    const metaCell = document.createElement("td");
    metaCell.dataset.label = text("colMeta");
    const input = document.createElement("input");
    input.className = "tamper";
    input.type = "text";
    input.value = entry.observedMetadata;
    input.setAttribute("aria-label", text("colMeta"));
    input.addEventListener("input", async () => {
      entry.observedMetadata = input.value;
      saveLedger();
      await paintStatus(status, entry);
    });
    metaCell.append(input);
    row.append(metaCell);

    row.append(cell(entry.sha256, text("colHash"), "hash"));
    const statusCell = document.createElement("td");
    statusCell.dataset.label = text("colCheck");
    const status = document.createElement("span");
    status.className = "badge";
    statusCell.append(status);
    row.append(statusCell);
    paintStatus(status, entry);
    body.append(row);
    void index;
  });
  table.append(body);
  els.ledger.append(table);
}

function cell(value, label, className) {
  const node = document.createElement("td");
  node.dataset.label = label;
  node.textContent = value;
  if (className) node.classList.add(className);
  return node;
}

async function paintStatus(node, entry) {
  await ready;
  const intact = verifyFingerprint(
    BigInt(entry.timestamp),
    BigInt(entry.quantumProof),
    entry.observedMetadata,
    entry.sha256
  );
  node.className = intact ? "badge ok" : "badge bad";
  node.textContent = intact ? text("verifyOk") : text("verifyBad");
  return intact;
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
  await refreshFingerprint();
}

async function recordEvent() {
  const timestamp = readTimestamp();
  const metadata = els.metadata.value;
  if (!state.shot) {
    els.error.textContent = text("needShot");
    return;
  }
  if (timestamp === null) {
    els.error.textContent = text("badTime");
    return;
  }
  if (metadata.length === 0) {
    els.error.textContent = text("badMeta");
    return;
  }
  await ready;
  const sha256 = fingerprintHex(BigInt(timestamp), BigInt(state.shot.value), metadata);
  state.ledger.push({
    id: state.ledger.length,
    timestamp,
    quantumProof: state.shot.value,
    bitstring: state.shot.bitstring,
    metadata,
    observedMetadata: metadata,
    sha256,
    loggedAt: Math.floor(Date.now() / 1000),
  });
  saveLedger();
  renderLedger();
}

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    state.lang = button.dataset.lang;
    applyLanguage();
  });
});

els.measure.addEventListener("click", () => measure());
els.record.addEventListener("click", () => recordEvent());
els.metadata.addEventListener("input", () => refreshFingerprint());
els.timestamp.addEventListener("input", () => refreshFingerprint());
document.querySelector("#reset").addEventListener("click", () => {
  state.ledger = [];
  saveLedger();
  renderLedger();
});

applyLanguage();

async function selfTest() {
  const previous = localStorage.getItem(STORAGE_KEY);
  const failures = [];
  try {
    await ready;
    const vector = fingerprintHex(1744230722n, 214n, "Component validated - Checkpoint A");
    if (vector !== "3fdde02648272556e7f8b9a6e1c4e801780e1dbe2541da1eec352d6107d524c3") {
      failures.push("vector");
    }

    state.ledger = [];
    await measure();
    if (!state.shot || !/^[01]{8}$/.test(state.shot.bitstring)) failures.push("shot");
    if (state.shot && Number.parseInt(state.shot.bitstring, 2) !== state.shot.value) failures.push("value");
    els.metadata.value = SAMPLE;
    els.timestamp.value = "1744230722";
    await refreshFingerprint();
    await recordEvent();
    const entry = state.ledger[0];
    if (!entry || entry.sha256 !== els.hash.textContent) failures.push("record");

    const badge = document.querySelector(".badge");
    entry.observedMetadata = SAMPLE + " tampered";
    if (await paintStatus(badge, entry)) failures.push("tamper");
    if (!(await paintStatus(badge, { ...entry, observedMetadata: SAMPLE }))) failures.push("restore");
  } catch (error) {
    failures.push(String(error));
  } finally {
    if (previous === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, previous);
    state.ledger = loadLedger();
    renderLedger();
  }

  document.documentElement.dataset.selftest = failures.length ? "fail" : "pass";
  els.selftest.hidden = false;
  els.selftest.textContent = failures.length
    ? `${text("selftestFail")}: ${failures.join(", ")}`
    : text("selftestPass");
}

if (new URLSearchParams(location.search).has("selftest")) {
  selfTest().catch((error) => {
    document.documentElement.dataset.selftest = "fail";
    els.selftest.hidden = false;
    els.selftest.textContent = String(error);
  });
}
