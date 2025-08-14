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
  
  // USDC OPTIONS
  console.log("💎 Choose USDC Option:");
  console.log("1. Mock USDC (Testing) - You can mint unlimited tokens");
  console.log("2. Real USDC (Production) - Use real USDC on Base Sepolia");
  
  // For now, let's use Mock USDC (you can change this)
  const USE_REAL_USDC = false; // Set to true for real USDC
  
  let usdcAddress;
  
  if (USE_REAL_USDC) {
    // Real USDC contract on Base Sepolia (you'll need to find the actual address)
    usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Example - verify this address
    console.log("💎 Using Real USDC:", usdcAddress);
  } else {
    // Deploy Mock USDC for testing
    console.log("💎 Deploying Mock USDC for testing...");
    const MockUSDC = await hre.ethers.getContractFactory("MockERC20");
    const usdc = await MockUSDC.deploy("Mock USDC", "USDC", 6);
    await usdc.waitForDeployment();
    usdcAddress = await usdc.getAddress();
    console.log("✅ Mock USDC deployed to:", usdcAddress);
  }

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

  // Handle USDC funding
  if (USE_REAL_USDC) {
    console.log("\n⚠️  IMPORTANT: You need to manually send real USDC to the claims contract:");
    console.log("   Claims Contract:", claimsAddress);
    console.log("   Recommended amount: 1000+ USDC for testing");
    console.log("   Transfer USDC to this address before players can claim rewards");
  } else {
    // Mint test USDC to claims contract
    console.log("\n💰 Minting test USDC to claims contract...");
    const MockUSDC = await hre.ethers.getContractFactory("MockERC20");
    const mockUsdc = MockUSDC.attach(usdcAddress);
    const mintAmount = hre.ethers.parseUnits("50000", 6); // 50,000 test USDC
    await mockUsdc.mint(claimsAddress, mintAmount);
    console.log("✅ Minted 50,000 test USDC to claims contract");
    
    // Also mint some to deployer for testing
    await mockUsdc.mint(deployer.address, hre.ethers.parseUnits("10000", 6));
    console.log("✅ Minted 10,000 test USDC to deployer for testing");
  }

  // Output summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("👥 UserManager:", userManagerAddress);
  console.log("🎲 CryptoCatcherRandomness:", randomnessAddress);
  console.log("🔐 CryptoCatcherBlocklock:", blocklockAddress);
  console.log("💰 EnhancedGameClaims:", claimsAddress);
  console.log("💎 USDC:", usdcAddress, USE_REAL_USDC ? "(REAL)" : "(MOCK)");

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
  IS_MOCK_USDC: ${!USE_REAL_USDC},
} as const;`;

  // Write config
  require('fs').writeFileSync('./lib/enhanced-contracts.ts', configContent);
  console.log("\n📄 Frontend config written to: ./lib/enhanced-contracts.ts");
  
  if (USE_REAL_USDC) {
    console.log("\n⚠️  NEXT STEPS FOR REAL USDC:");
    console.log("1. Send real USDC to claims contract:", claimsAddress);
    console.log("2. Verify all contracts on Basescan");
    console.log("3. Test with small amounts first");
  } else {
    console.log("\n🎮 NEXT STEPS FOR TESTING:");
    console.log("1. Update frontend with contract addresses");
    console.log("2. Test VRF sessions and level changes");
    console.log("3. Test mock USDC rewards");
    console.log("4. Switch to real USDC when ready for production");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
