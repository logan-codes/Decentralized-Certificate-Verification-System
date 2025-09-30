import hre from "hardhat";
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log("Deploying CertificateRegistry...");
  console.log("Network:", hre.network.name);

  // Server's private key and address
  const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY;
  const provider = new hre.ethers.JsonRpcProvider(
    process.env.HARDHAT_NODE_URL || 'http://hardhat:8545'
  );
  const serverWallet = new hre.ethers.Wallet(SERVER_PRIVATE_KEY, provider);
  const serverAddress = serverWallet.address;
  console.log("Server address:", serverAddress);
  
  //Deploying the certificateRegistry with the server as the deployer
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry", serverWallet);
  const certificateRegistry = await CertificateRegistry.deploy();

  await certificateRegistry.waitForDeployment();

  const address = await certificateRegistry.getAddress();
  console.log("CertificateRegistry deployed to:", address);
  console.log("Contract owner should be:", await certificateRegistry.owner());

  // Verify the contract is properly deployed by calling a function
  try {
    const exists = await certificateRegistry.certificateExists("test");
    console.log("Contract verification successful - certificateExists function works");
  } catch (error) {
    console.error("Contract verification failed:", error.message);
  }

  // Save the contract address for frontend use
  const currentOwner = await certificateRegistry.owner();
  const contractInfo = {
    address: address,
    network: hre.network.name,
    deployer: serverAddress,
    owner: currentOwner
  };
  
  fs.writeFileSync('./contract-address.json', JSON.stringify(contractInfo, null, 2));
  console.log("Contract address saved to contract-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
