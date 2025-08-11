const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
  let CertificateRegistry;
  let owner;
  let addr1;

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
      const recipient = "John Doe";
      const issuer = owner.address;
      const file = "QmTestHash123";
      

      await certificateRegistry.issueCertificate(certificateId, recipient, issuer, file);

      const cert = await certificateRegistry.certificates(certificateId);
      expect(cert.recipient).to.equal(recipient);
      expect(cert.issuer).to.equal(issuer);
      expect(cert.file).to.equal(file);
      expect(cert.valid).to.be.true;
    });

    it("Should not allow non-owner to issue certificate", async function () {
      const certificateId = "CERT002";
      const recipient = "Jane Doe";
      const issuer = owner.address;
      const file = "QmTestHash456";

      await expect(
        certificateRegistry.connect(addr1).issueCertificate(certificateId, recipient, issuer, file)
      ).to.be.revertedWith("Not contract owner");
    });

    it("Should revoke a certificate", async function () {
      const certificateId = "CERT003";
      const recipient = "Bob Smith";
      const issuer = owner.address;
      const file = "QmTestHash789";

      await certificateRegistry.issueCertificate(certificateId, recipient, issuer, file);
      await certificateRegistry.revokeCertificate(certificateId);

      const cert = await certificateRegistry.certificates(certificateId);
      expect(cert.valid).to.be.false;
    });

    it("Should not allow duplicate certificate IDs", async function () {
      const certificateId = "CERT004";
      const recipient = "Alice Johnson";
      const issuer = owner.address;
      const file = "QmTestHash101";

      await certificateRegistry.issueCertificate(certificateId, recipient, issuer, file);
      
      await expect(
        certificateRegistry.issueCertificate(certificateId, "Different Person",  issuer, "QmDifferentHash")
      ).to.be.revertedWith("Certificate already exists");
    });
  });
}); 