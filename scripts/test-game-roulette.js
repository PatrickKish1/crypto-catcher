const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing Game Roulette contract compilation...");

  try {
    // Try to get the contract factory
    const GameRoulette = await hre.ethers.getContractFactory("GameRoulette");
    console.log("✅ GameRoulette contract compiled successfully!");

    // Check if we can create a contract instance (this will test the constructor)
    const [deployer] = await hre.ethers.getSigners();
    
    // Use placeholder addresses for testing
    const VRF_SENDER_ADDRESS = "0x0000000000000000000000000000000000000000";
    const BLOCKLOCK_SENDER_ADDRESS = "0x0000000000000000000000000000000000000000";
    
    console.log("🔍 Testing contract instantiation...");
    const gameRoulette = await GameRoulette.deploy(
      VRF_SENDER_ADDRESS,
      BLOCKLOCK_SENDER_ADDRESS,
      deployer.address
    );

    console.log("✅ GameRoulette contract instantiated successfully!");
    console.log("📝 Contract address:", await gameRoulette.getAddress());
    
    // Test basic contract properties
    console.log("🔍 Testing contract properties...");
    const owner = await gameRoulette.owner();
    console.log("✅ Owner:", owner);
    
    const nextSessionId = await gameRoulette.nextSessionId();
    console.log("✅ Next Session ID:", nextSessionId.toString());
    
    console.log("\n🎉 All tests passed! GameRoulette contract is ready for deployment.");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  });
