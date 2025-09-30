import express from 'express';
import QRCode from 'qrcode';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { blockchainService } from './Services/blockchain.js';
import { importer } from 'ipfs-unixfs-importer';
import { sha256 } from 'multiformats/hashes/sha2';
import { MemoryBlockstore } from 'blockstore-core';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Create separate directories for issue and verify files
const issueDir = path.join(__dirname, 'filebase/issue');
const verifyDir = path.join(__dirname, 'filebase/verify');

// Create filebase directory if it doesn't exist
if (!fs.existsSync(issueDir)) {
  fs.mkdirSync(issueDir, { recursive: true });
}
if (!fs.existsSync(verifyDir)) {
  fs.mkdirSync(verifyDir, { recursive: true });
}

// Create separate multer instances for issue and verify
const issueUpload = multer({ dest: issueDir });
const verifyUpload = multer({ dest: verifyDir });


// Endpoint to issue a certificate
app.post('/api/issue', issueUpload.single('file'), async (req, res) => {
  // getting the details from the request body
  const issued_by = req.body.issuer || req.body.issued_by || "Unknown Issuer";
  const issued_on = req.body.issued_on || new Date().toISOString().split('T')[0];

  // CID output structure
  const opts = {
    cidVersion: 1,
    rawLeaves: true,
    hasher: sha256
  };
  try {
    console.log('Issue request:', req.body);
    const { recipient, issuer} = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // implementing CID hashing algo
    const content = fs.readFileSync(file.path);
    const source = [{ path: file.originalname, content }];
    const blockstore = new MemoryBlockstore();
    var fileHash = "";
    for await (const entry of importer(source, blockstore, opts)) {
      fileHash = entry.cid.toString();
    }

    console.log(`File uploaded: ${file.originalname}, Hash: ${fileHash}`);
    // Move file to permanent location with hash as filename
    const filePath = path.join(issueDir, fileHash + path.extname(file.originalname));
    fs.copyFileSync(file.path, filePath, fs.constants.COPYFILE_EXCL);
    fs.unlinkSync(file.path); 
    const txHash = await blockchainService.issueCertificate(
          fileHash,
          recipient,
          issued_by,
          issued_on,
        );

    const payload = "http://localhost:5173/verify?fileH="+ fileHash;
    // Generate QR code
    const qr = await QRCode.toDataURL(payload);
    res.json({ fileHash:fileHash, qr:qr, link:payload });
    console.log('QR code generated:', payload);
  } catch (err) {
    console.error('Issuing error:', err);
    
    // Handle different types of errors
    if (err.message.includes('Not connected to blockchain')) {
      return res.status(503).json({ 
        error: 'Blockchain service unavailable',
        verified: false 
      });
    }
    
    if (err.message.includes('Certificate already exists')) {
      return res.status(409).json({ 
        error: 'Certificate already exists for this file',
        verified: false,
        details: 'A certificate with this file hash already exists on the blockchain'
      });
    }
    
    if (err.message.includes('Failed to issue certificate')) {
      return res.status(500).json({ 
        error: 'Failed to issue certificate on blockchain',
        verified: false,
        details: err.message
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error during certificate issuance',
      verified: false,
      details: err.message
    });
  }
});

app.get('/api/test', async (req, res) => {
  return res.json({ message: 'Test endpoint hit successfully' });
});

app.post('/api/verify', (req, res) => {
  verifyUpload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    }
    
    // CID output structure
    const opts = {
      cidVersion: 1,
      rawLeaves: true,
      hasher: sha256
    };
    
    try {
      console.log('Verification request body:', req.body);
      console.log('Verification request file:', req.file);
      
      const file = req.file;
      if (!file) {
        console.log('No file found in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

    // Generate CID hash for the uploaded file
    const content = fs.readFileSync(file.path);
    const source = [{ path: file.originalname, content }];
    const blockstore = new MemoryBlockstore();
    var fileHash = "";
    for await (const entry of importer(source, blockstore, opts)) {
      fileHash = entry.cid.toString();
    }

    console.log(`File uploaded: ${file.originalname}, Hash: ${fileHash}`);

    // Step 1: Check blockchain for certificate existence using CID hash
    let blockchainResult = null;
    try {
      blockchainResult = await blockchainService.verifyCertificate(fileHash);
      console.log('Blockchain verification result:', blockchainResult);
    } catch (blockchainError) {
      console.error('Blockchain verification error:', blockchainError.message);
    }
    
    // Step 2: Determine verification result
    const isAuthentic = blockchainResult !== null && blockchainResult.valid;

    // Step 4: Format response for frontend
    const response = {
      isAuthentic: isAuthentic,
      details: {
        fileHash: fileHash,
        recipient: blockchainResult?.recipient || 'Unknown',
        issued_by: blockchainResult?.issued_by || 'Unknown',
        issued_on: blockchainResult?.issued_on || 'Unknown',
        fileName: file.originalname,
      },
      checks: {
        blockchainVerification: isAuthentic,
      }
    };

    // Optionally store verify file (allow overwrite for verify)
    const verifyFilePath = path.join(verifyDir, fileHash + path.extname(file.originalname));
    try {
      // Allow overwrite for verify files
      fs.copyFileSync(file.path, verifyFilePath);
      console.log(`Verify file stored: ${verifyFilePath}`);
    } catch (copyError) {
      console.warn('Failed to store verify file:', copyError.message);
    }
    
    // Clean up temporary file
    fs.unlinkSync(file.path);
    
    console.log('Verification completed:', response);
    res.json(response);
    
  } catch (err) {
    console.error('Verification error:', err);
    
    // Handle different types of errors
    if (err.message.includes('Not connected to blockchain')) {
      return res.status(503).json({ 
        error: 'Blockchain service unavailable',
        isAuthentic: false,
        details: {
          fileHash: 'N/A',
          recipient: 'Unknown',
          issuer: 'Unknown',
          fileName: req.file?.originalname || 'Unknown'
        },
        checks: {
          blockchainVerification: false,
        }
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error during verification',
      isAuthentic: false,
      confidence: 0,
      details: {
        fileHash: 'N/A',
        recipient: 'Unknown',
        issuer: 'Unknown',
        fileName: req.file?.originalname || 'Unknown'
      },
      checks: {
        blockchainVerification: false,
      },
      errorMessage: err.message
    });
    }
  });
});

app.get('/api/verify-by-hash/:fileHash', async (req, res) => {
    
    try {
      const fileHash = req.params.fileHash;
      console.log('Verification request by hash:', fileHash);

    // Step 1: Check blockchain for certificate existence using CID hash
    let blockchainResult = null;
    try {
      blockchainResult = await blockchainService.verifyCertificate(fileHash);
      console.log('Blockchain verification result:', blockchainResult);
    } catch (blockchainError) {
      console.error('Blockchain verification error:', blockchainError.message);
    }
    
    // Step 2: Determine verification result
    const isAuthentic = blockchainResult !== null && blockchainResult.valid;

    // Step 4: Format response for frontend
    const response = {
      isAuthentic: isAuthentic,
      details: {
        fileHash: fileHash,
        recipient: blockchainResult?.recipient || 'Unknown',
        issued_by: blockchainResult?.issued_by || 'Unknown',
        issued_on: blockchainResult?.issued_on || 'Unknown',
      },
      checks: {
        blockchainVerification: isAuthentic,
      }
    };

    console.log('Verification completed:', response);
    res.json(response);
    
  } catch (err) {
    console.error('Verification error:', err);
    
    // Handle different types of errors
    if (err.message.includes('Not connected to blockchain')) {
      return res.status(503).json({ 
        error: 'Blockchain service unavailable',
        isAuthentic: false,
        details: {
          fileHash: 'N/A',
          recipient: 'Unknown',
          issuer: 'Unknown',
        },
        checks: {
          blockchainVerification: false,
        }
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error during verification',
      isAuthentic: false,
      confidence: 0,
      details: {
        fileHash: 'N/A',
        recipient: 'Unknown',
        issuer: 'Unknown',
      },
      checks: {
        blockchainVerification: false,
      },
      errorMessage: err.message
    });
    }
  });

const PORT = 3001;

// Start the server and deploy contract
async function startServer() {
  try {
    console.log('Starting server...');
    console.log('Deploying contract...');
     // Deploy to localhost network to match server connection
     const { spawn } = await import('child_process');
    await new Promise((resolve, reject) => {
      const deployProcess = spawn('npx', ['hardhat', 'run', 'Services/deploy.js', '--network', 'localhost'], {
        stdio: 'inherit',
        shell: true
      });
      deployProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Deployment failed with code ${code}`));
        }
      });
    });
    console.log('Contract deployed successfully');
    
    // Read the contract address
    const contractInfo = JSON.parse(fs.readFileSync('./contract-address.json', 'utf8'));
    console.log('Contract address:', contractInfo.address);
    console.log('Contract owner:', contractInfo.owner);
    
    // Waiting a moment for the deployment to fully settle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Connect to blockchain service
    console.log('Connecting to blockchain service...');
    const connected = await blockchainService.connect();
    if (!connected) {
      throw new Error('Failed to connect to blockchain service');
    }
    
    // Verify ownership
    const isOwner = await blockchainService.isOwner();
    console.log("Is owner:", isOwner);
    
    if (!isOwner) {
      console.warn('Warning: Server is not the contract owner. Certificate issuance may fail.');
    }
    
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
      console.log('Ready to issue and verify certificates!');
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
