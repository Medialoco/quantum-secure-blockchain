const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const hre = require("hardhat");
const { payload, sha256Hex } = require("../docs/qrng");

function pythonBin() {
  if (process.env.QRNG_PYTHON) return process.env.QRNG_PYTHON;
  const root = path.join(__dirname, "..");
  const candidates = [
    path.join(root, ".venv", "bin", "python"),
    path.join(root, ".venv", "Scripts", "python.exe"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || "python3";
}

async function main() {
  const metadata = process.env.EVENT_METADATA || "Component validated - Checkpoint A";
  const timestamp = process.env.EVENT_TIMESTAMP
    ? Number(process.env.EVENT_TIMESTAMP)
    : Math.floor(Date.now() / 1000);

  const proof = JSON.parse(
    execFileSync(pythonBin(), [path.join(__dirname, "..", "qrng.py"), "--json"], {
      encoding: "utf8",
      cwd: path.join(__dirname, ".."),
    })
  );

  const body = payload(timestamp, proof.value, metadata);
  const localHash = await sha256Hex(body);

  const [signer] = await hre.ethers.getSigners();
  const factory = await hre.ethers.getContractFactory("QSecure");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  const tx = await contract.recordEvent(timestamp, proof.value, metadata);
  const receipt = await tx.wait();
  const total = await contract.totalEvents();
  const id = total - 1n;
  const stored = await contract.readEvent(id);
  const onChain = stored.eventHash.toLowerCase().slice(2);

  if (onChain !== localHash) {
    throw new Error(`Fingerprint mismatch.\n  local ${localHash}\n  chain ${onChain}`);
  }
  if (!(await contract.verify(id))) {
    throw new Error("On-chain verify() returned false.");
  }

  const output = {
    contractAddress: address,
    signer: signer.address,
    network: hre.network.name,
    transactionHash: receipt.hash,
    payload: body,
    quantum: proof,
    event: {
      id: Number(id),
      timestamp: Number(stored.timestamp),
      quantumProof: Number(stored.quantumProof),
      metadata: stored.metadata,
      sha256: stored.eventHash,
      loggedAt: Number(stored.loggedAt),
    },
  };

  const destination = path.join(__dirname, "..", "quantum_event.json");
  fs.writeFileSync(destination, JSON.stringify(output, null, 2) + "\n");

  console.log(`QSecure deployed at ${address}`);
  console.log(`Quantum bitstring ${proof.bitstring} (value ${proof.value})`);
  console.log(`Payload ${body}`);
  console.log(`SHA-256 ${stored.eventHash}`);
  console.log(`Logged event #${output.event.id} in tx ${receipt.hash}`);
  console.log(`Wrote ${destination}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
