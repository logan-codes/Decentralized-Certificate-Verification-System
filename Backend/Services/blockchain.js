// Import ethers
import { ethers } from 'ethers';

// Contract ABI
const CONTRACT_ABI = [
  "function issueCertificate(string,string,string,string)",
  "function verifyCertificate(string) view returns (string,string,string,bool)",
  "function revokeCertificate(string)",
  "function owner() view returns (address)"
];

// Contract address
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// RPC URL (can be replaced with Infura, Alchemy, or local Ganache)
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

// Private key of the signer (for issuing/revoking certificates)
const PRIVATE_KEY = '0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e';

class BlockchainService {
  provider = null;
  signer = null;
  contract = null;

  async connect() {
    try {
      this.provider = new ethers.JsonRpcProvider(RPC_URL);

      if (!PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY in environment");

      this.signer = new ethers.Wallet(PRIVATE_KEY, this.provider);
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);

      console.log("Connected to blockchain via Node.js");
      return true;
    } catch (error) {
      console.error("Failed to connect to blockchain:", error);
      return false;
    }
  }

  async issueCertificate(certificateId, ipfsHash, recipient, metadata) {
    if (!this.contract) throw new Error("Not connected to blockchain");

    try {
      const tx = await this.contract.issueCertificate(certificateId, ipfsHash, recipient, metadata);
      await tx.wait();
      console.log("Certificate issued:", certificateId);
      return tx.hash;
    } catch (error) {
      console.error("Failed to issue certificate:", error);
      throw error;
    }
  }

  async verifyCertificate(certificateId) {
    if (!this.contract) throw new Error("Not connected to blockchain");

    try {
      const result = await this.contract.verifyCertificate(certificateId);
      console.log("Certificate verification result:", result);
      const [recipient, issuer, file, valid] = result;
      if (!result) throw new Error("Certificate not found");
      console.log("Certificate verified:", certificateId);
      return {
        recipient,
        issuer,
        file,
        valid
      };
    } catch (error) {
      console.error("Failed to verify certificate:", error);
      throw error;
    }
  }

  async revokeCertificate(certificateId) {
    if (!this.contract) throw new Error("Not connected to blockchain");

    try {
      const tx = await this.contract.revokeCertificate(certificateId);
      await tx.wait();
      console.log("Certificate revoked:", certificateId);
      return tx.hash;
    } catch (error) {
      console.error("Failed to revoke certificate:", error);
      throw error;
    }
  }

  async isOwner() {
    if (!this.contract || !this.signer) return false;

    try {
      const owner = await this.contract.owner();
      const signerAddress = await this.signer.getAddress();
      return owner.toLowerCase() === signerAddress.toLowerCase();
    } catch (error) {
      console.error("Failed to check ownership:", error);
      return false;
    }
  }

  async getSignerAddress() {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }
}

export const blockchainService = new BlockchainService();