import express from 'express';
import QRCode from 'qrcode';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { deployContract } from './Services/deployContract.js';
import crypto from 'crypto';
import { blockchainService } from './Services/blockchain.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

(async () => {
  await blockchainService.connect();
  const isOwner = await blockchainService.isOwner();
  console.log("Is owner:", isOwner);
})();

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

// issues a certificat  and generates a QR code
app.post('/api/issue', async (req, res) => {
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
    const qr = await QRCode.toDataURL(JSON.stringify(payload));
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

app.get('/api/verify',async (req, res) => {
  const { certID } = req.query;
  if (!certID) return res.status(400).json({ error: 'Missing certID' });
  console.log('Verification request:', req.query);

  
  try {
    // Lookup blockchain record or DB
    const record = await blockchainService.verifyCertificate(certID);
    if (!record) return res.status(404).json({ error: 'Certificate not found' });

    res.json({ verified: true, data: record });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
deployContract()
  .then(() => {
    console.log('Contract deployed successfully');
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error deploying contract:', error);
    process.exit(1);
  });