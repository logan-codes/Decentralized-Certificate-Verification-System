# Decentralized Certificate Verification System

A secure and reliable decentralized platform for verifying the authenticity of certificates and documents using blockchain technology. This system ensures tamper-proof storage and transparent validation, making it ideal for academic institutions, government agencies, and enterprises.

---

## Features

- Blockchain-based certificate storage and verification  
- Tamper-resistant and cryptographically secure  
- Web-based frontend for easy access and interaction  
- Smart contract integration with backend services  

---

## Running the System Locally

### 1. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

This will start the frontend development server (usually on `http://localhost:3000`).

### 2. Backend & Smart Contract Setup

```bash
cd backend
npm install
npx hardhat run scripts/deploy.js --network localhost
```

> Ensure your local blockchain (e.g., Hardhat node) is running before deploying.

### 3. Start Backend Server

Open a new terminal:

```bash
cd backend
node server.js
```

---

## 📂 Project Structure

```
Decentralized-Certificate-Verification-System/
├── frontend/         # React-based UI
├── backend/          # Node.js server & Hardhat smart contracts
└── README.md         # Project documentation
```
---

## 🧑‍💻 Contributing

We welcome contributions! Follow these steps to get started:

1. **Fork the repository**
   ```bash
   git clone https://github.com/logan-codes/Decentralized-Certificate-Verification-System.git
   cd Decentralized-Certificate-Verification-System
   ```

2. **Create a new branch**
   ```bash
   git checkout -b my-feature
   ```

3. **Make your changes and commit**
   ```bash
   git commit -m "Add my feature"
   ```

4. **Push your changes**
   ```bash
   git push origin my-feature
   ```

5. **Create a pull request**  
   Submit a PR to merge your changes into the main repository. Be sure to describe your changes clearly.

---
