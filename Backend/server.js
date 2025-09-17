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

const upload = multer({ dest: '/filebase' });

// Create filebase directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'filebase');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Endpoint to issue a certificate
app.post('/api/issue', upload.single('file'), async (req, res) => {
  // Generating the certificate ID based on the time of request
  const certificateId = `CERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    const content = fs.createReadStream(file.path);
    const source = [{ path: file.path, content }];
    const blockstore = new MemoryBlockstore();
    var fileHash = "";
    for await (const entry of importer(source, blockstore, opts)) {
      fileHash = entry.cid.toString();
    }

    console.log(`File uploaded: ${file.originalname}, Hash: ${fileHash}`);
    // Move file to permanent location with hash as filename
    const filePath = path.join(uploadsDir, fileHash + path.extname(file.originalname));
    fs.copyFileSync(file.path, filePath, fs.constants.COPYFILE_EXCL);
    fs.unlinkSync(file.path); 
    const txHash = await blockchainService.issueCertificate(
          certificateId,
          recipient,
          issuer,
          fileHash,
        );
    const payload = "http://localhost:5173/verify?certID="+ certificateId;
    // Generate QR code
    const qr = await QRCode.toDataURL(payload);
    res.json({ certID:certificateId, qr:qr, link:payload });
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
    
    if (err.message.includes('Failed to issue certificate')) {
      return res.status(500).json({ 
        error: 'Failed to issue certificate on blockchain',
        verified: false,
        details: err.message
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error during verification',
      verified: false,
      details: err.message
    });
  }
});

app.get('/api/test', async (req, res) => {
  return res.json({ message: 'Test endpoint hit successfully' });
});

app.get('/api/verify', async (req, res) => {
  const certID = req.query.certID;
  
  // Validate input
  if (!certID) {
    return res.status(400).json({ 
      error: 'Missing certID parameter',
      verified: false 
    });
  }
  
  if (typeof certID !== 'string' || certID.trim() === '') {
    return res.status(400).json({ 
      error: 'Invalid certID format',
      verified: false 
    });
  }

  console.log('Verification request for certID:', certID.trim());

  try {
    // Verify certificate on blockchain
    const record = await blockchainService.verifyCertificate(certID.trim());
    
    if (!record) {
      return res.status(404).json({ 
        error: 'Certificate not found or does not exist',
        verified: false,
        certID: certID.trim()
      });
    }

    // Validate the returned data
    if (!record.recipient || !record.issuer || !record.file) {
      return res.status(500).json({ 
        error: 'Invalid certificate data received from blockchain',
        verified: false 
      });
    }
    const filename = record.file;
    const filePath = path.join("filebase", filename);

    console.log('Certificate verified successfully:', record);
    res.json({ 
      verified: true, 
      data: record,
      certID: certID.trim(),
      file: record.file,
    });
    
  } catch (err) {
    console.error('Verification error:', err);
    
    // Handle different types of errors
    if (err.message.includes('Not connected to blockchain')) {
      return res.status(503).json({ 
        error: 'Blockchain service unavailable',
        verified: false 
      });
    }
    
    if (err.message.includes('Failed to verify certificate')) {
      return res.status(500).json({ 
        error: 'Failed to verify certificate on blockchain',
        verified: false,
        details: err.message
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error during verification',
      verified: false,
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 3001;

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
