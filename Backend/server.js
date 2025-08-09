import express from 'express';
import QRCode from 'qrcode';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';


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

// Generate QR code from JSON payload
app.post('/generate-qr', async (req, res) => {
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

app.post('/verify',async (req, res) => {
    try {
        console.log('Verification request:', req.body);
        const { qrData } = req.body;
        if (!qrData) {
        return res.status(400).json({ error: 'No QR data provided' });
        }
        
        // Decode the QR data
        const decodedData = JSON.parse(Buffer.from(qrData, 'base64').toString('utf-8'));
        
        // Here you would typically verify the decoded data against your database or logic
        // For now, we just return the decoded data
        res.json({ verified: true, data: decodedData });
    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});