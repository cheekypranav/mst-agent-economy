const hre = require("hardhat");

async function main() {
  const { ethers, network } = hre;
  console.log(`Starting deployment to network: ${network.name} (Chain ID: ${network.config.chainId})...`);

  const [deployer] = await ethers.getSigners();
  if (deployer) {
    console.log(`Deployer address: ${deployer.address}`);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Deployer balance: ${ethers.formatEther(balance)} MST`);
  }

  const MSTTaskEscrow = await ethers.getContractFactory("MSTTaskEscrow");
  const escrow = await MSTTaskEscrow.deploy();
  await escrow.waitForDeployment();

  const contractAddress = await escrow.getAddress();
  console.log(`MSTTaskEscrow deployed successfully!`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Verify on Explorer: https://testnet.mstscan.com/address/${contractAddress}`);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
