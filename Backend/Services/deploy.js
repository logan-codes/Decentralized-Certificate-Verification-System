import hre from "hardhat";
import fs from "fs";

async function main() {
  console.log("Deploying CertificateRegistry...");
  console.log("Network:", hre.network.name);

  // Deploy with default Hardhat account (account[0])
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const certificateRegistry = await CertificateRegistry.deploy();

  await certificateRegistry.waitForDeployment();

  const address = await certificateRegistry.getAddress();
  console.log("CertificateRegistry deployed to:", address);
  console.log("Initial contract owner:", deployer.address);

  // Server's private key and address
  const SERVER_PRIVATE_KEY = '0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e';
  const serverWallet = new hre.ethers.Wallet(SERVER_PRIVATE_KEY, hre.ethers.provider);
  const serverAddress = serverWallet.address;
  console.log("Server address:", serverAddress);

  // Transfer ownership to the server
  console.log("Transferring ownership to server...");
  try {
    const tx = await certificateRegistry.transferOwnership(serverAddress);
    await tx.wait();
    console.log("Ownership transferred successfully");
    
    // Verify ownership transfer
    const newOwner = await certificateRegistry.owner();
    console.log("New contract owner:", newOwner);
  } catch (error) {
    console.log("Ownership transfer failed or not needed:", error.message);
    const currentOwner = await certificateRegistry.owner();
    console.log("Current contract owner:", currentOwner);
  }

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
    deployer: deployer.address,
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
