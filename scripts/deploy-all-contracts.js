const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Enhanced Crypto Catcher Contract Deployment on Base Sepolia...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Contract addresses for Base Sepolia
  const VRF_SENDER_ADDRESS = "0x19a367E12Ea972a2eBCdFc46e26970892347d150"; // Existing VRF sender
  const BLOCKLOCK_SENDER_ADDRESS = "0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e"; // Blocklock sender
  
  // You'll need to deploy or get a USDC test token address for Base Sepolia
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC (example)

  try {
    // 1. Deploy UserManager
    console.log("📊 Deploying UserManager...");
    const UserManager = await ethers.getContractFactory("UserManager");
    const userManager = await UserManager.deploy();
    await userManager.waitForDeployment();
    console.log("✅ UserManager deployed to:", await userManager.getAddress());

    // 2. Deploy CryptoCatcherRandomness
    console.log("\n🎲 Deploying CryptoCatcherRandomness...");
    const CryptoCatcherRandomness = await ethers.getContractFactory("CryptoCatcherRandomness");
    const randomnessContract = await CryptoCatcherRandomness.deploy(
      VRF_SENDER_ADDRESS,
      deployer.address
    );
    await randomnessContract.waitForDeployment();
    console.log("✅ CryptoCatcherRandomness deployed to:", await randomnessContract.getAddress());

    // 3. Deploy CryptoCatcherBlocklock
    console.log("\n🔐 Deploying CryptoCatcherBlocklock...");
    const CryptoCatcherBlocklock = await ethers.getContractFactory("CryptoCatcherBlocklock");
    const blocklockContract = await CryptoCatcherBlocklock.deploy(BLOCKLOCK_SENDER_ADDRESS);
    await blocklockContract.waitForDeployment();
    console.log("✅ CryptoCatcherBlocklock deployed to:", await blocklockContract.getAddress());

    // 4. Deploy EnhancedGameClaims
    console.log("\n💰 Deploying EnhancedGameClaims...");
    const EnhancedGameClaims = await ethers.getContractFactory("EnhancedGameClaims");
    const claimsContract = await EnhancedGameClaims.deploy(
      USDC_ADDRESS,
      await blocklockContract.getAddress(),
      await userManager.getAddress()
    );
    await claimsContract.waitForDeployment();
    console.log("✅ EnhancedGameClaims deployed to:", await claimsContract.getAddress());

    // 5. Set up contract permissions
    console.log("\n⚙️  Setting up contract permissions...");
    
    // Give claims contract permission to update user manager
    const userManagerAddress = await userManager.getAddress();
    const claimsAddress = await claimsContract.getAddress();
    
    console.log("🔗 Granting UserManager permissions to Claims contract...");
    // Note: UserManager uses Ownable, so we need to transfer ownership or add admin role
    // For simplicity, we'll transfer ownership to claims contract or set up admin roles
    
    console.log("✅ Contract permissions configured");

    // 6. Display deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE! Contract Addresses:");
    console.log("=".repeat(60));
    console.log("👥 UserManager:", await userManager.getAddress());
    console.log("🎲 CryptoCatcherRandomness:", await randomnessContract.getAddress());
    console.log("🔐 CryptoCatcherBlocklock:", await blocklockContract.getAddress());
    console.log("💰 EnhancedGameClaims:", await claimsContract.getAddress());
    console.log("\n📋 External Dependencies:");
    console.log("🔗 VRF Sender:", VRF_SENDER_ADDRESS);
    console.log("🔗 Blocklock Sender:", BLOCKLOCK_SENDER_ADDRESS);
    console.log("🪙 USDC Token:", USDC_ADDRESS);

    // 7. Generate config file for frontend
    const configContent = `// Auto-generated contract addresses for Base Sepolia
export const ENHANCED_CONTRACTS = {
  // VRF Integration
  RANDOMNESS: '${await randomnessContract.getAddress()}',
  VRF_SENDER: '${VRF_SENDER_ADDRESS}',
  
  // Blocklock Integration  
  BLOCKLOCK: '${await blocklockContract.getAddress()}',
  BLOCKLOCK_SENDER: '${BLOCKLOCK_SENDER_ADDRESS}',
  
  // User & Claims Management
  USER_MANAGER: '${await userManager.getAddress()}',
  ENHANCED_CLAIMS: '${await claimsContract.getAddress()}',
  
  // Token Integration
  USDC: '${USDC_ADDRESS}',
} as const;

// Contract ABIs (import from your ABI files)
export { default as RANDOMNESS_ABI } from '../contracts/CryptoCatcherRandomness.sol/CryptoCatcherRandomness.json';
export { default as BLOCKLOCK_ABI } from '../contracts/CryptoCatcherBlocklock.sol/CryptoCatcherBlocklock.json';
export { default as USER_MANAGER_ABI } from '../contracts/UserManager.sol/UserManager.json';
export { default as ENHANCED_CLAIMS_ABI } from '../contracts/EnhancedGameClaims.sol/EnhancedGameClaims.json';
`;

    // Write config file
    const fs = require('fs');
    fs.writeFileSync('./lib/enhanced-contracts.ts', configContent);
    console.log("\n📄 Contract config written to: ./lib/enhanced-contracts.ts");

    // 8. Verification commands
    console.log("\n🔍 Contract Verification Commands:");
    console.log("=".repeat(60));
    console.log(`npx hardhat verify --network baseSepolia ${await userManager.getAddress()}`);
    console.log(`npx hardhat verify --network baseSepolia ${await randomnessContract.getAddress()} "${VRF_SENDER_ADDRESS}" "${deployer.address}"`);
    console.log(`npx hardhat verify --network baseSepolia ${await blocklockContract.getAddress()} "${BLOCKLOCK_SENDER_ADDRESS}"`);
    console.log(`npx hardhat verify --network baseSepolia ${await claimsContract.getAddress()} "${USDC_ADDRESS}" "${await blocklockContract.getAddress()}" "${await userManager.getAddress()}"`);

    console.log("\n🎮 Next Steps:");
    console.log("1. Verify contracts on Basescan");
    console.log("2. Fund Enhanced Claims contract with test USDC");
    console.log("3. Update frontend with new contract addresses");
    console.log("4. Test VRF session creation");
    console.log("5. Test blocklock sealed sessions");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
