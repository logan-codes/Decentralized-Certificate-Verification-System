import express from 'express';
import QRCode from 'qrcode';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { deployContract } from './Services/deployContract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();

// Enable CORS for all routes
app.use(cors());

const upload = multer({ dest: 'filebase/' });

// Create filebase directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'filebase');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Issues a certificate and generates a QR code
app.post('/issue', async (req, res) => {
  try {
    console.log('QR generation request:', req.body);
    const payload = req.body;
    const qr = await QRCode.toDataURL(JSON.stringify(payload));
    res.json({ qr });
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/test', async (req, res) => {
  return res.json({ message: 'Test endpoint hit successfully' });
});

app.post('/verify',async (req, res) => {
    try {
        console.log('Verification request:', req.body);
        const { qrData } = req.body;
        if (!qrData) {
        return res.status(400).json({ error: 'No QR data provided' });
        }
        
        // Decode the QR data
        const decodedData = JSON.parse(Buffer.from(qrData, 'base64').toString('utf-8'));
        
        
        res.json({ verified: true, data: decodedData });
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