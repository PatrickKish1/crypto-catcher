# 🎰 Game Roulette System

A revolutionary gaming platform that combines VRF (Verifiable Random Functions) with Blocklock conditional encryption to create an unpredictable, provably fair gaming experience where players never know what game or difficulty level they'll encounter next.

## 🌟 Overview

Game Roulette is a smart contract system that:
- **Randomly switches games** every 60 seconds using VRF randomness
- **Pauses and resumes games** seamlessly, saving player progress
- **Integrates multiple game types** with varying difficulty levels
- **Uses sealed sessions** with hidden multipliers revealed over time
- **Provides provably fair** game selection and difficulty assignment

## 🎮 Game Types

The system supports 11 different game variants:

### Coin Flip Games
- **COINFLIP_EASY** - Simple 50/50 coin flip
- **COINFLIP_MEDIUM** - Enhanced coin flip with bonus mechanics
- **COINFLIP_HARD** - Advanced coin flip with multipliers

### Crypto Catcher Games
- **CRYPTO_CATCHER_EASY** - Classic crypto catching with basic difficulty
- **CRYPTO_CATCHER_MEDIUM** - Enhanced crypto catching with obstacles
- **CRYPTO_CATCHER_HARD** - Expert crypto catching with complex patterns

### Enhanced Crypto Catcher Games
- **ENHANCED_CRYPTO_CATCHER_FREE** - Free tier with basic features
- **ENHANCED_CRYPTO_CATCHER_BRONZE** - Bronze tier with VRF-powered difficulty
- **ENHANCED_CRYPTO_CATCHER_SILVER** - Silver tier with sealed sessions
- **ENHANCED_CRYPTO_CATCHER_GOLD** - Gold tier with advanced features
- **ENHANCED_CRYPTO_CATCHER_PLATINUM** - Platinum tier with maximum features

## 🎯 Difficulty Levels

Each game can have one of four difficulty levels:
- **EASY** - Beginner-friendly gameplay
- **MEDIUM** - Moderate challenge
- **HARD** - Advanced difficulty
- **EXPERT** - Maximum challenge

## 🏗️ Architecture

### Smart Contracts

1. **GameRoulette.sol** - Main contract managing roulette sessions
2. **RandomnessReceiverBase** - VRF integration for random game selection
3. **AbstractBlocklockReceiver** - Blocklock integration for sealed sessions
4. **UserManager.sol** - Player profiles and achievements
5. **EnhancedGameClaims.sol** - Advanced reward system

### Key Features

- **VRF Integration**: Uses Chainlink VRF for provably random game selection
- **Blocklock Encryption**: Seals reward multipliers with time-based decryption
- **State Management**: Saves and resumes game states across sessions
- **Session Management**: Tracks active sessions and player progress
- **Multiplier System**: Dynamic reward multipliers based on game performance

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Hardhat development environment
- Base Sepolia testnet access
- VRF and Blocklock contracts deployed

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd vrf
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your private keys and API keys
   ```

3. **Compile contracts**
   ```bash
   npx hardhat compile
   ```

### Deployment

1. **Deploy VRF and Blocklock contracts first**
   ```bash
   npx hardhat run scripts/deploy-all-contracts.js --network base-sepolia
   ```

2. **Update deployment script with real addresses**
   ```javascript
   // In scripts/deploy-game-roulette.js
   const VRF_SENDER_ADDRESS = "0x..."; // Your deployed VRF sender
   const BLOCKLOCK_SENDER_ADDRESS = "0x..."; // Your deployed Blocklock sender
   ```

3. **Deploy Game Roulette**
   ```bash
   npx hardhat run scripts/deploy-game-roulette.js --network base-sepolia
   ```

4. **Verify contract on Etherscan**
   ```bash
   npx hardhat verify --network base-sepolia <contract-address> <vrf-sender> <blocklock-sender> <owner>
   ```

## 🎯 Usage

### Creating a Roulette Session

```solidity
// Create a new roulette session
function createRouletteSession(uint32 callbackGasLimit) 
    external payable returns (uint256 sessionId, uint256 requestPrice)
```

### Requesting Next Game

```solidity
// Request VRF for next game selection
function requestNextGame(uint256 sessionId, uint32 callbackGasLimit) 
    external payable returns (uint256 requestId, uint256 requestPrice)
```

### Saving Game State

```solidity
// Save current game state before switching
function saveGameState(
    uint256 sessionId,
    GameType gameType,
    uint256 score,
    uint256 level,
    uint256 tokens,
    bytes calldata gameData
) external
```

### Creating Sealed Sessions

```solidity
// Create sealed session with encrypted multiplier
function createSealedRouletteSession(
    uint256 sessionId,
    uint256 unlockDelayMinutes,
    bytes calldata encryptedMultiplier,
    uint32 callbackGasLimit
) external payable returns (uint256 sealId, uint256 requestPrice)
```

## 🔧 Configuration

### Frontend Integration

The system automatically generates `lib/game-roulette-config.ts` with:
- Contract address
- Contract ABI
- Game type enums
- Difficulty level enums
- Deployment information

### Environment Variables

```bash
# Required
NEXT_PUBLIC_ALCHEMY_KEY=your_alchemy_api_key
PRIVATE_KEY=your_deployer_private_key

# Optional
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🧪 Testing

### Run Tests

```bash
# Test contract compilation
npx hardhat run scripts/test-game-roulette.js

# Run full test suite
npm test
```

### Test Scenarios

1. **Session Creation**: Verify new roulette sessions are created correctly
2. **Game Switching**: Test VRF-powered game selection
3. **State Management**: Verify game state saving and resuming
4. **Sealed Sessions**: Test blocklock encryption and decryption
5. **Access Control**: Verify only authorized players can perform actions

## 🔒 Security Features

- **Reentrancy Protection**: Prevents reentrancy attacks
- **Access Control**: Owner-only functions for administrative tasks
- **Input Validation**: Comprehensive parameter validation
- **State Consistency**: Ensures contract state remains consistent
- **VRF Security**: Uses Chainlink VRF for provably random outcomes

## 📊 Monitoring

### Events

- `RouletteSessionCreated` - New session created
- `GameSwitched` - Game changed via VRF
- `GameStateSaved` - Game state saved
- `GameResumed` - Game resumed from saved state
- `SealedSessionCreated` - New sealed session
- `MultiplierRevealed` - Multiplier revealed from blocklock

### View Functions

- `getSession(uint256 sessionId)` - Get session details
- `getPlayerActiveSession(address player)` - Get player's active session
- `getGameState(address player, GameType gameType)` - Get saved game state
- `isGameSwitchDue(uint256 sessionId)` - Check if game switch is due
- `getTimeUntilNextSwitch(uint256 sessionId)` - Get time until next switch

## 🚨 Troubleshooting

### Common Issues

1. **VRF Request Fails**
   - Check VRF sender address
   - Verify callback gas limit
   - Ensure sufficient payment

2. **Blocklock Decryption Fails**
   - Check blocklock sender address
   - Verify encryption parameters
   - Check time conditions

3. **Game State Not Saving**
   - Verify player authorization
   - Check session is active
   - Ensure proper game type

### Debug Commands

```bash
# Check contract state
npx hardhat console --network base-sepolia

# View contract logs
npx hardhat run scripts/debug-game-roulette.js --network base-sepolia
```

## 🔮 Future Enhancements

- **Cross-Chain Support**: Deploy on multiple networks
- **Advanced Game Types**: Add more game variants
- **Dynamic Difficulty**: AI-powered difficulty adjustment
- **Tournament Mode**: Competitive multiplayer tournaments
- **NFT Integration**: Game achievements as NFTs
- **Mobile App**: Native mobile application

## 📚 Documentation

- [VRF Technical Guide](./CRYPTO_CATCHER_TECHNICAL_GUIDE.md)
- [Blocklock Documentation](./BLOCK-LOCK.md)
- [Deployment Instructions](./DEPLOYMENT_INSTRUCTIONS.md)
- [API Reference](./docs/api.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub discussions
- **Documentation**: Check the docs folder
- **Community**: Join our Discord server

---

**🎰 Game Roulette** - Where every minute brings a new adventure! 🎲
