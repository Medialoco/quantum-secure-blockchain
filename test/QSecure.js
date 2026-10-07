const { expect } = require("chai");
const vectors = require("./vectors.json");

function payload(timestamp, quantumProof, metadata) {
  return `${timestamp}|${quantumProof}|${metadata}`;
}

describe("QSecure", function () {
  async function deploy() {
    const [owner, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("QSecure");
    const qsecure = await factory.deploy();
    return { qsecure, owner, other };
  }

  for (const vector of vectors) {
    const label = JSON.stringify(vector.metadata);
    it(`stores the published fingerprint for ${label}`, async function () {
      const { qsecure } = await deploy();
      const { timestamp, quantumProof, metadata, sha256 } = vector;

      expect(await qsecure.canonicalPayload(timestamp, quantumProof, metadata)).to.equal(
        payload(timestamp, quantumProof, metadata)
      );

      await expect(qsecure.recordEvent(timestamp, quantumProof, metadata))
        .to.emit(qsecure, "EventRecorded")
        .withArgs(0, timestamp, quantumProof, "0x" + sha256);

      const stored = await qsecure.readEvent(0);
      expect(stored.timestamp).to.equal(timestamp);
      expect(stored.quantumProof).to.equal(quantumProof);
      expect(stored.metadata).to.equal(metadata);
      expect(stored.eventHash.toLowerCase()).to.equal("0x" + sha256);
      expect(await qsecure.fingerprint(timestamp, quantumProof, metadata)).to.equal(stored.eventHash);
      expect(await qsecure.verify(0)).to.equal(true);
      expect(await qsecure.totalEvents()).to.equal(1);
      expect(stored.loggedAt).to.be.gt(0);
    });
  }

  it("appends a second event", async function () {
    const { qsecure } = await deploy();
    await qsecure.recordEvent(vectors[0].timestamp, vectors[0].quantumProof, vectors[0].metadata);
    await qsecure.recordEvent(vectors[2].timestamp, vectors[2].quantumProof, vectors[2].metadata);
    expect(await qsecure.totalEvents()).to.equal(2);
    const second = await qsecure.readEvent(1);
    expect(second.eventHash.toLowerCase()).to.equal("0x" + vectors[2].sha256);
  });

  it("rejects a caller who is not the owner", async function () {
    const { qsecure, other } = await deploy();
    const vector = vectors[0];
    await expect(
      qsecure.connect(other).recordEvent(vector.timestamp, vector.quantumProof, vector.metadata)
    ).to.be.revertedWithCustomError(qsecure, "NotOwner");
  });

  it("rejects empty metadata", async function () {
    const { qsecure } = await deploy();
    await expect(qsecure.recordEvent(1700000000, 1, "")).to.be.revertedWithCustomError(
      qsecure,
      "EmptyMetadata"
    );
  });

  it("reverts when the index does not exist", async function () {
    const { qsecure } = await deploy();
    await expect(qsecure.readEvent(0)).to.be.revertedWithCustomError(qsecure, "UnknownEvent").withArgs(0);
    await expect(qsecure.verify(0)).to.be.revertedWithCustomError(qsecure, "UnknownEvent").withArgs(0);
  });
});
