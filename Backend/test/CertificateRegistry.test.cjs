const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
  let CertificateRegistry;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    certificateRegistry = await CertificateRegistry.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await certificateRegistry.owner()).to.equal(owner.address);
    });
  });

  describe("Certificate Operations", function () {
    it("Should issue a certificate", async function () {
      const certificateId = "CERT001";
      const ipfsHash = "QmTestHash123";
      const recipient = "John Doe";
      const metadata = '{"course": "Blockchain Development", "grade": "A"}';
      const issuer = owner.address;

      await certificateRegistry.issueCertificate(certificateId, ipfsHash, recipient, metadata, issuer);

      const cert = await certificateRegistry.verifyCertificate(certificateId);
      expect(cert.ipfsHash).to.equal(ipfsHash);
      expect(cert.recipient).to.equal(recipient);
      expect(cert.metadata).to.equal(metadata);
      expect(cert.issuer).to.equal(issuer);
      expect(cert.valid).to.be.true;
    });

    it("Should not allow non-owner to issue certificate", async function () {
      const certificateId = "CERT002";
      const ipfsHash = "QmTestHash456";
      const recipient = "Jane Doe";
      const metadata = '{"course": "Web Development"}';
      const issuer = owner.address;

      await expect(
        certificateRegistry.connect(addr1).issueCertificate(certificateId, ipfsHash, recipient, metadata, issuer)
      ).to.be.revertedWith("Not contract owner");
    });

    it("Should revoke a certificate", async function () {
      const certificateId = "CERT003";
      const ipfsHash = "QmTestHash789";
      const recipient = "Bob Smith";
      const metadata = '{"course": "Data Science"}';
      const issuer = owner.address;

      await certificateRegistry.issueCertificate(certificateId, ipfsHash, recipient, metadata, issuer);
      await certificateRegistry.revokeCertificate(certificateId);

      const cert = await certificateRegistry.verifyCertificate(certificateId);
      expect(cert.valid).to.be.false;
    });

    it("Should not allow duplicate certificate IDs", async function () {
      const certificateId = "CERT004";
      const ipfsHash = "QmTestHash101";
      const recipient = "Alice Johnson";
      const metadata = '{"course": "AI"}';
      const issuer = owner.address;

      await certificateRegistry.issueCertificate(certificateId, ipfsHash, recipient, metadata, issuer);
      
      await expect(
        certificateRegistry.issueCertificate(certificateId, "QmDifferentHash", "Different Person", '{"course": "ML"}', issuer)
      ).to.be.revertedWith("Certificate already exists");
    });
  });
}); 