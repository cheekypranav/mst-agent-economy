const { ethers } = require("hardhat");

async function main() {
    const [account] = await ethers.getSigners();

    console.log("Wallet:", account.address);

    const balance = await ethers.provider.getBalance(account.address);

    console.log("Balance:", ethers.formatEther(balance), "tMSTC");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});