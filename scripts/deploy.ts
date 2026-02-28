/**
 * Deploy script for PassItOn contract.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network base-sepolia
 *   npx hardhat run scripts/deploy.ts --network base
 */

import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying PassItOn with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy contract
  const PassItOn = await ethers.getContractFactory("PassItOn");
  const contract = await PassItOn.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("PassItOn deployed to:", address);
  console.log("");
  console.log("Next steps:");
  console.log(`  1. Update CONTRACT_ADDRESS in frontend/.env`);
  console.log(`  2. Update CONTRACT_ADDRESS in backend/.env`);
  console.log(`  3. Verify: npx hardhat verify --network <network> ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
