const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🎰 Deploying Game Roulette contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // For Base Sepolia, you'll need to set these addresses
  // These are placeholder addresses - replace with actual deployed addresses
  const VRF_SENDER_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with actual VRF sender
  const BLOCKLOCK_SENDER_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with actual Blocklock sender
  
  console.log("VRF Sender Address:", VRF_SENDER_ADDRESS);
  console.log("Blocklock Sender Address:", BLOCKLOCK_SENDER_ADDRESS);

  // Deploy GameRoulette contract
  const GameRoulette = await ethers.getContractFactory("GameRoulette");
  const gameRoulette = await GameRoulette.deploy(
    VRF_SENDER_ADDRESS,
    BLOCKLOCK_SENDER_ADDRESS,
    deployer.address
  );

  await gameRoulette.waitForDeployment();
  const gameRouletteAddress = await gameRoulette.getAddress();

  console.log("🎰 GameRoulette deployed to:", gameRouletteAddress);

  // Get the contract ABI
  const contractArtifact = await hre.artifacts.readArtifact("GameRoulette");
  const contractABI = contractArtifact.abi;

  // Create the configuration file
  const configContent = `// Auto-generated Game Roulette contract configuration
// Generated on: ${new Date().toISOString()}

// Contract address on Base Sepolia
export const GAME_ROULETTE_CONTRACT = '${gameRouletteAddress}' as const;

// Contract ABI
export const GAME_ROULETTE_ABI = ${JSON.stringify(contractABI, null, 2)} as const;

// Game Types used by the roulette
export enum GameType {
  COINFLIP_EASY = 0,
  COINFLIP_MEDIUM = 1,
  COINFLIP_HARD = 2,
  CRYPTO_CATCHER_EASY = 3,
  CRYPTO_CATCHER_MEDIUM = 4,
  CRYPTO_CATCHER_HARD = 5,
  ENHANCED_CRYPTO_CATCHER_FREE = 6,
  ENHANCED_CRYPTO_CATCHER_BRONZE = 7,
  ENHANCED_CRYPTO_CATCHER_SILVER = 8,
  ENHANCED_CRYPTO_CATCHER_GOLD = 9,
  ENHANCED_CRYPTO_CATCHER_PLATINUM = 10,
}

// Difficulty Levels
export enum DifficultyLevel {
  EASY = 0,
  MEDIUM = 1,
  HARD = 2,
  EXPERT = 3,
}

// Contract deployment info
export const DEPLOYMENT_INFO = {
  network: 'Base Sepolia',
  deployer: '${deployer.address}',
  deployedAt: '${new Date().toISOString()}',
  vrfSender: '${VRF_SENDER_ADDRESS}',
  blocklockSender: '${BLOCKLOCK_SENDER_ADDRESS}',
} as const;
`;

  // Write the configuration file
  const configPath = path.join(__dirname, "..", "lib", "game-roulette-config.ts");
  fs.writeFileSync(configPath, configContent);
  console.log("📝 Configuration file updated:", configPath);

  // Verify the contract on Etherscan (Base Sepolia)
  if (hre.network.name === "base-sepolia") {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: gameRouletteAddress,
        constructorArguments: [
          VRF_SENDER_ADDRESS,
          BLOCKLOCK_SENDER_ADDRESS,
          deployer.address
        ],
      });
      console.log("✅ Contract verified successfully!");
    } catch (error) {
      console.log("⚠️  Contract verification failed:", error.message);
    }
  }

  console.log("\n🎉 Game Roulette deployment complete!");
  console.log("📋 Next steps:");
  console.log("1. Update VRF_SENDER_ADDRESS and BLOCKLOCK_SENDER_ADDRESS in the script");
  console.log("2. Deploy VRF and Blocklock contracts if not already deployed");
  console.log("3. Update the configuration with real addresses");
  console.log("4. Test the Game Roulette functionality");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
