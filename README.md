# Decentralized Certificate Verification System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-green.svg)
![React](https://img.shields.io/badge/react-19.1.0-blue.svg)
![Hardhat](https://img.shields.io/badge/hardhat-2.26.2-yellow.svg)

A secure, decentralized platform for issuing and verifying academic and professional certificates. By leveraging **Blockchain technology (Ethereum)** and **IPFS**, this system ensures that certificates are tamper-proof, immutable, and easily verifiable globally.

---

## 🚀 Key Features

-   **Immutable Records**: Certificates are hashed and stored on the blockchain, preventing any unauthorized alteration.
-   **Decentralized Storage**: Certificate metadata and files are secured using IPFS-compatible hashing logic.
-   **Instant Verification**: Verify certificates instantly via a drag-and-drop interface or by scanning a QR code.
-   **QR Code Integration**: Automatically generates a unique QR code for every issued certificate for easy sharing.
-   **User-Friendly Interface**: Modern, responsive dashboard built with React and Tailwind CSS.
-   **Dockerized Deployment**: easy setup and tear-down using Docker Compose.

---

## 🏗 System Architecture

```mermaid
graph TD
    User[User / Institution] -->|Uploads PDF| Frontend[Frontend (React)]
    Frontend -->|Sends File| Backend[Backend API (Express)]
    Backend -->|Generates CID| IPFS[IPFS Logic / Storage]
    Backend -->|Stores Hash & Metadata| Blockchain[Hardhat Network (Ethereum)]
    Blockchain -- Returns Tx Hash --> Backend
    Backend -- Returns QR Code --> Frontend
    Frontend -- Displays Certificate --> User
    
    Verifier[Verifier] -->|Uploads File/Scans QR| Frontend
    Frontend -->|Request Verification| Backend
    Backend -->|Fetch Contract Data| Blockchain
    Blockchain -- Returns Validity --> Backend
    Backend -- Verification Result --> Frontend
```

---

## 🛠 Tech Stack

### **Frontend**
-   **Framework**: [React](https://react.dev/) (Vite)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **UI Components**: [Radix UI](https://www.radix-ui.com/) / Lucide Icons
-   **Blockchain Interaction**: [Ethers.js](https://docs.ethers.org/)

### **Backend**
-   **Runtime**: [Node.js](https://nodejs.org/)
-   **Framework**: [Express.js](https://expressjs.com/)
-   **File Handling**: Multer & IPFS UnixFS Importer
-   **Blockchain**: [Hardhat](https://hardhat.org/) (Local Development Node)
-   **Smart Contract**: Solidity

---

## 🏁 Getting Started

### Prerequisites
-   **Node.js** (v18+)
-   **Docker & Docker Compose** (Optional, for containerized setup)
-   **Metamask** (Optional, for browser interaction if extended)

### Option 1: Quick Start with Docker 🐳
The easiest way to run the entire system.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/logan-codes/Decentralized-Certificate-Verification-System.git
    cd Decentralized-Certificate-Verification-System
    ```

2.  **Start Services**
    ```bash
    docker-compose up --build
    ```
    This command starts:
    -   Hardhat Node (Blockchain)
    -   Backend API (Deploys contract automatically)
    -   Frontend Application

3.  **Access the App**
    -   Frontend: [http://localhost:5173](http://localhost:5173)
    -   Backend API: [http://localhost:3001](http://localhost:3001)

### Option 2: Manual Setup 🛠️

#### 1. Start the Blockchain Node
```bash
cd Backend
npm install
npx hardhat node
```
*Keep this terminal running.*

#### 2. Start the Backend Server
Open a new terminal:
```bash
cd Backend
# automatic deployment happens on server start
node server.js
```
The server will deploy the `CertificateRegistry` contract to the local Hardhat node and start listening on port 3001.

#### 3. Start the Frontend
Open a third terminal:
```bash
cd frontend
npm install
npm run dev
```

---

## 📖 Usage Guide

### 1. Issuing a Certificate
1.  Navigate to the **Issue Certificate** page.
2.  Enter the **Recipient Name**, **Issuer Name**, and **Issue Date**.
3.  Upload the certificate file (PDF/Image).
4.  Click **Issue**.
5.  Wait for the transaction to confirm. A **QR Code** and **Verification Link** will be generated.

### 2. Verifying a Certificate
1.  Navigate to the **Verify Certificate** page.
2.  **Upload** the certificate file you want to check.
3.  The system will hash the file and check against the blockchain registry.
4.  **Result**: You will see the certificate's validity status, issuer details, and issuance date.

---

## 🔌 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/issue` | Uploads a file, generates CID, and records it on the blockchain. |
| `POST` | `/api/verify` | Uploads a file/hash to verify its existence and validity on-chain. |
| `GET` | `/api/verify-by-hash/:hash` | Verifies a certificate using its IPFS CID hash directly. |

---

## 📂 Project Structure

```bash
Decentralized-Certificate-Verification-System/
├── Backend/
│   ├── Contracts/       # Solidity Smart Contracts
│   ├── Services/        # Blockchain integration logic
│   ├── filebase/        # Local storage for issued certificates
│   ├── server.js        # Main Express API entry point
│   └── hardhat.config.cjs # Hardhat configuration
├── frontend/
│   ├── src/             # React source code
│   ├── public/          # Static assets
│   └── vite.config.ts   # Vite configuration
├── compose.yml          # Docker composition
└── README.md            # You are here
```

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.
