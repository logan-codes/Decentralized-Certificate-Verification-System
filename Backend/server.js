import express from 'express';
import QRCode from 'qrcode';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import crypto from 'crypto';
import { blockchainService } from './Services/blockchain.js';

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

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileBuffer = fs.readFileSync(file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    console.log(`File uploaded: ${file.originalname}, Hash: ${fileHash}`);
    const filePath = path.join(uploadsDir, fileHash + path.extname(file.originalname));
    fs.copyFileSync(file.path, filePath);
    res.json({ filename: path.basename(filePath) });
    fs.unlinkSync(file.path); // Remove the temporary file
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/issue', async (req, res) => {
  // Issue the certificate on blockchain
  const certificateId = `CERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  try {
    console.log('Issue request:', req.body);
    const { recipient, issuer, file } = req.body;
    const txHash = await blockchainService.issueCertificate(
          certificateId,
          recipient,
          issuer,
          file,
        );
    const payload = "http://localhost:5173/verify?certID="+ certificateId;
    // Generate QR code
    const qr = await QRCode.toDataURL(payload);
    res.json({ qr });
    console.log('QR code generated:', payload);
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).json({ error: err.message });
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

    console.log('Certificate verified successfully:', record);
    res.json({ 
      verified: true, 
      data: record,
      certID: certID.trim()
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

// Deploy contract and start server
async function startServer() {
  try {
    console.log('Starting server with auto-deployment...');
    
    // Always deploy a fresh contract to ensure it's properly deployed
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
