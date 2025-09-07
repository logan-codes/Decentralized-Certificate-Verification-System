// Import ethers
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contract ABI
const CONTRACT_ABI = [
  "function issueCertificate(string,string,string,string)",
  "function verifyCertificate(string) view returns (string,string,string,bool)",
  "function certificateExists(string) view returns (bool)",
  "function owner() view returns (address)"
];

// Get contract address from deployed contract
function getContractAddress() {
  try {
    const contractInfo = JSON.parse(fs.readFileSync(path.join(__dirname, '../contract-address.json'), 'utf8'));
    return contractInfo.address;
  } catch (error) {
    console.error('Error reading contract address:', error);
    return null;
  }
}

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
      
      // Get the contract address from the deployed contract
      const contractAddress = getContractAddress();
      if (!contractAddress) {
        throw new Error("Contract not deployed or contract address not found");
      }
      
      this.contract = new ethers.Contract(contractAddress, CONTRACT_ABI, this.signer);

      console.log("Connected to blockchain via Node.js");
      console.log("Using contract address:", contractAddress);
      console.log("Signer address:", await this.signer.getAddress());
      
      // Test the connection by checking if the contract exists
      try {
        const code = await this.provider.getCode(contractAddress);
        if (code === '0x') {
          throw new Error("No contract code found at address " + contractAddress);
        }
        console.log("Contract code found, contract is deployed");
        
        // Test a simple contract function to ensure it's working
        try {
          const owner = await this.contract.owner();
          console.log("Contract owner:", owner);
        } catch (error) {
          console.error("Failed to call contract owner function:", error.message);
          throw error;
        }
      } catch (error) {
        console.error("Contract verification failed:", error.message);
        throw error;
      }
      
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
    try {
      if (!this.contract) throw new Error("Not connected to blockchain");
      
      // Try the new method first (with certificateExists)
      try {
        const exists = await this.contract.certificateExists(certificateId);
        if (!exists) {
          console.log('Certificate does not exist:', certificateId);
          return null;
        }
      } catch (existsError) {
        console.log('certificateExists function not available, falling back to direct verification');
        // Fall back to direct verification if certificateExists is not available
      }

      // Get the certificate data
      const [recipient, issuer, file, valid] = await this.contract.verifyCertificate(certificateId);

      // Check if the certificate exists (recipient should not be empty)
      if (!recipient || recipient.trim() === '') {
        console.log('Certificate does not exist (empty recipient):', certificateId);
        return null;
      }

      console.log('Certificate found:');
      console.log('Recipient:', recipient);
      console.log('Issuer:', issuer);
      console.log('File:', file);
      console.log('Valid:', valid);
      
      return { 
        recipient: recipient.trim(), 
        issuer: issuer.trim(), 
        file: file.trim(), 
        valid: valid 
      };

    } catch (err) {
      console.error('Error verifying certificate:', err.message);
      
      // Check if the error is due to certificate not found or empty data
      if (err.message.includes("Certificate not found") || 
          err.message.includes("execution reverted") ||
          err.message.includes("revert") ||
          err.message.includes("could not decode result data") ||
          err.message.includes("BAD_DATA") ||
          err.code === "BAD_DATA") {
        return null; // Certificate not found
      }
      
      // Re-throw other errors
      throw new Error(`Failed to verify certificate: ${err.message}`);
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

  async transferOwnership(newOwnerAddress) {
    if (!this.contract) throw new Error("Not connected to blockchain");

    try {
      const tx = await this.contract.transferOwnership(newOwnerAddress);
      await tx.wait();
      console.log("Ownership transferred to:", newOwnerAddress);
      return tx.hash;
    } catch (error) {
      console.error("Failed to transfer ownership:", error);
      throw error;
    }
  }
}

export const blockchainService = new BlockchainService();