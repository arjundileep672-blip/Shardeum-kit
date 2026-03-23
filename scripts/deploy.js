const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Study-to-Earn Platform — Deployment");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Deployer : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance  : ${ethers.formatEther(balance)} SHM\n`);

  // ── 1. Deploy StudyToken ──────────────────────────────────
  console.log("📦 Deploying StudyToken (STDY)...");
  const StudyToken = await ethers.getContractFactory("StudyToken");
  const studyToken = await StudyToken.deploy(deployer.address);
  await studyToken.waitForDeployment();
  const tokenAddress = await studyToken.getAddress();
  console.log(`   ✅ StudyToken deployed at: ${tokenAddress}`);

  // ── 2. Deploy StudyToEarn ─────────────────────────────────
  console.log("\n📦 Deploying StudyToEarn platform...");
  const StudyToEarn = await ethers.getContractFactory("StudyToEarn");
  const studyToEarn = await StudyToEarn.deploy(tokenAddress);
  await studyToEarn.waitForDeployment();
  const platformAddress = await studyToEarn.getAddress();
  console.log(`   ✅ StudyToEarn deployed at: ${platformAddress}`);

  // ── 3. Quick sanity check ─────────────────────────────────
  const name = await studyToken.name();
  const symbol = await studyToken.symbol();
  const totalSupply = await studyToken.totalSupply();
  console.log(`\n📊 Token Info:`);
  console.log(`   Name   : ${name}`);
  console.log(`   Symbol : ${symbol}`);
  console.log(`   Supply : ${ethers.formatEther(totalSupply)} STDY`);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  🚀 Deployment complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  STUDY_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`  STUDY_PLATFORM_ADDRESS=${platformAddress}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  👉 Copy these into your .env file");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
