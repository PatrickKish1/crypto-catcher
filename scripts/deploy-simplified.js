const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Enhanced Crypto Catcher on Base Sepolia...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Known addresses on Base Sepolia
  const VRF_SENDER = "0x19a367E12Ea972a2eBCdFc46e26970892347d150";
  const BLOCKLOCK_SENDER = "0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e";
  
  // Deploy mock USDC for testing (you can skip if you have real USDC)
  console.log("💎 Deploying Mock USDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockERC20");
  const usdc = await MockUSDC.deploy("Mock USDC", "USDC", 6); // 6 decimals like real USDC
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ Mock USDC deployed to:", usdcAddress);

  // Deploy UserManager
  console.log("\n👥 Deploying UserManager...");
  const UserManager = await hre.ethers.getContractFactory("UserManager");
  const userManager = await UserManager.deploy();
  await userManager.waitForDeployment();
  const userManagerAddress = await userManager.getAddress();
  console.log("✅ UserManager deployed to:", userManagerAddress);

  // Deploy VRF Randomness
  console.log("\n🎲 Deploying CryptoCatcherRandomness...");
  const Randomness = await hre.ethers.getContractFactory("CryptoCatcherRandomness");
  const randomness = await Randomness.deploy(VRF_SENDER, deployer.address);
  await randomness.waitForDeployment();
  const randomnessAddress = await randomness.getAddress();
  console.log("✅ CryptoCatcherRandomness deployed to:", randomnessAddress);

  // Deploy Blocklock
  console.log("\n🔐 Deploying CryptoCatcherBlocklock...");
  const Blocklock = await hre.ethers.getContractFactory("CryptoCatcherBlocklock");
  const blocklock = await Blocklock.deploy(BLOCKLOCK_SENDER);
  await blocklock.waitForDeployment();
  const blocklockAddress = await blocklock.getAddress();
  console.log("✅ CryptoCatcherBlocklock deployed to:", blocklockAddress);

  // Deploy Enhanced Claims
  console.log("\n💰 Deploying EnhancedGameClaims...");
  const Claims = await hre.ethers.getContractFactory("EnhancedGameClaims");
  const claims = await Claims.deploy(usdcAddress, blocklockAddress, userManagerAddress);
  await claims.waitForDeployment();
  const claimsAddress = await claims.getAddress();
  console.log("✅ EnhancedGameClaims deployed to:", claimsAddress);

  // Mint some test USDC to claims contract
  console.log("\n💰 Minting test USDC to claims contract...");
  const mintAmount = hre.ethers.parseUnits("10000", 6); // 10,000 USDC
  await usdc.mint(claimsAddress, mintAmount);
  console.log("✅ Minted 10,000 test USDC to claims contract");

  // Output summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("👥 UserManager:", userManagerAddress);
  console.log("🎲 CryptoCatcherRandomness:", randomnessAddress);
  console.log("🔐 CryptoCatcherBlocklock:", blocklockAddress);
  console.log("💰 EnhancedGameClaims:", claimsAddress);
  console.log("💎 Mock USDC:", usdcAddress);

  // Generate frontend config
  const configContent = `// Auto-generated contract addresses for Base Sepolia
export const ENHANCED_CONTRACTS = {
  // VRF Integration
  RANDOMNESS: '${randomnessAddress}',
  VRF_SENDER: '${VRF_SENDER}',
  
  // Blocklock Integration  
  BLOCKLOCK: '${blocklockAddress}',
  BLOCKLOCK_SENDER: '${BLOCKLOCK_SENDER}',
  
  // User & Claims Management
  USER_MANAGER: '${userManagerAddress}',
  ENHANCED_CLAIMS: '${claimsAddress}',
  
  // Token Integration
  USDC: '${usdcAddress}',
} as const;`;

  // Write config
  require('fs').writeFileSync('./lib/enhanced-contracts.ts', configContent);
  console.log("\n📄 Frontend config written to: ./lib/enhanced-contracts.ts");
  
  console.log("\n🎮 Next: Update your frontend to use these addresses!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
