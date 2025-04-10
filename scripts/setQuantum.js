const hre = require("hardhat");
const { Web3 } = require("web3");
const { execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");

async function main() {
  const [signer] = await hre.ethers.getSigners();

  // Deploy the contract using Hardhat
  const QSecure = await hre.ethers.getContractFactory("QSecure");
  const contract = await QSecure.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`✅ QSecure deployed at: ${address}`);

  // Initialize Web3.js with Hardhat provider
  const web3 = new Web3(hre.network.provider);

  // Load contract ABI from Hardhat
  const artifact = await hre.artifacts.readArtifact("QSecure");
  const qsecure = new web3.eth.Contract(artifact.abi, address);

  // Generate a quantum random number using Python (Qiskit QRNG)
  const randomNumber = parseInt(execSync("python3 qrng.py").toString().trim());
  console.log(`🎲 Quantum-generated number: ${randomNumber}`);

  const metadata = "Component validated – Checkpoint A";

  // Current timestamp (Unix seconds)
  const timestamp = Math.floor(Date.now() / 1000);

  // Create SHA-256 hash from event data
  const eventData = `${timestamp}-${randomNumber}-${metadata}`;
  const eventHash = crypto.createHash('sha256').update(eventData).digest('hex');
  console.log(`🔒 SHA-256 event hash: ${eventHash}`);

  // Record the event into the blockchain
  await qsecure.methods
    .recordEvent(randomNumber, metadata, '0x' + eventHash)
    .send({ from: signer.address });

  // Retrieve total events and last index
  const total = await qsecure.methods.totalEvents().call();
  const lastIndex = Number(total) - 1;
  console.log(`📊 Total events recorded: ${total}`);
  console.log(`📍 Last recorded index: ${lastIndex}`);

  // Retrieve the stored event
  const event = await qsecure.methods.getEvent(lastIndex).call();

  // Display the event details
  console.log("📦 Event details retrieved from blockchain:");
  console.log(`⏱️ Timestamp         : ${event.timestamp}`);
  console.log(`🧬 Quantum Proof     : ${event.quantumProof}`);
  console.log(`📋 Metadata          : ${event.metadata}`);
  console.log(`🔒 Stored SHA-256    : ${event.eventHash}`);

  // ✅ Save to JSON (avoid BigInt serialization error)
  const jsonOutput = {
    contractAddress: address,
    event: {
      timestamp: Number(event.timestamp),
      quantumProof: Number(event.quantumProof),
      metadata: event.metadata,
      sha256Hash: event.eventHash
    }
  };

  fs.writeFileSync("quantum_event.json", JSON.stringify(jsonOutput, null, 2));
  console.log("💾 Event details saved to quantum_event.json");
}

main().catch((error) => {
  console.error("❌ Main error:", error);
  process.exitCode = 1;
});
