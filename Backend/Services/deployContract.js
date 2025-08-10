const hre = require("hardhat");

async function deployContract() {
  console.log("Deploying CertificateRegistry...");

  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const certificateRegistry = await CertificateRegistry.deploy();

  await certificateRegistry.waitForDeployment();

  const address = await certificateRegistry.getAddress();
  console.log("CertificateRegistry deployed to:", address);

  // Save the contract address for frontend use
  const fs = require('fs');
  const contractInfo = {
    address: address,
    network: hre.network.name
  };
  
  fs.writeFileSync('./contract-address.json', JSON.stringify(contractInfo, null, 2));
  console.log("Contract address saved to contract-address.json");
}

module.exports = {
  deployContract
};
