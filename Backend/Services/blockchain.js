// Import ethers
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contract ABI
const CONTRACT_ABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json'), 'utf8')).abi;

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
const RPC_URL = process.env.RPC_URL;

// Private key of the signer (for issuing/revoking certificates)
const PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY;

class BlockchainService {
  provider = null;
  signer = null;
  contract = null;

  async connect() {
    try {
      this.provider = new ethers.JsonRpcProvider(process.env.HARDHAT_NODE_URL || 'http://hardhat:8545');

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

  async issueCertificate(fileHash, recipient, issued_by, issued_on) {
    if (!this.contract) throw new Error("Not connected to blockchain");

    try {
      // Check if certificate already exists
      const exists = await this.contract.certificateExists(fileHash);
      if (exists) {
        throw new Error("Certificate already exists for this file");
      }

      const tx = await this.contract.issueCertificate(fileHash, recipient, issued_by, issued_on);
      await tx.wait();
      console.log("Certificate issued for file hash:", fileHash);
      return tx.hash;
    } catch (error) {
      console.error("Failed to issue certificate:", error);
      throw error;
    }
  }

  async verifyCertificate(fileHash) {
    try {
      if (!this.contract) throw new Error("Not connected to blockchain");
      
      // Try the new method first (with certificateExists)
      try {
        const exists = await this.contract.certificateExists(fileHash);
        if (!exists) {
          console.log('Certificate does not exist:', fileHash);
          return null;
        }
      } catch (existsError) {
        console.log('certificateExists function not available, falling back to direct verification');
        // Fall back to direct verification if certificateExists is not available
      }

      // Get the certificate data
      const [recipient, issued_by, issued_on, valid] = await this.contract.verifyCertificate(fileHash);

      // Check if the certificate exists (recipient should not be empty)
      if (!recipient || recipient.trim() === '') {
        console.log('Certificate does not exist (empty recipient):', fileHash);
        return null;
      }

      console.log('Certificate found:');
      console.log('Recipient:', recipient);
      console.log('Issued_by:', issued_by);
      console.log('Issued_on:', issued_on);
      console.log('Valid:', valid);
      
      return { 
        recipient: recipient.trim(), 
        issued_by: issued_by.trim(), 
        issued_on: issued_on.trim(), 
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

}

export const blockchainService = new BlockchainService();