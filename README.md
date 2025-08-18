# 🎮 Crypto Catcher - VRF-Enhanced Blockchain Game

A revolutionary blockchain-based crypto catching game that combines classic arcade gameplay with cutting-edge blockchain technology including **Verifiable Random Functions (VRF)**, **Blocklock encryption**, and **smart contract-based rewards**.

## 🎯 **Project Overview**

Crypto Catcher is not just a game—it's a demonstration of how blockchain technology can create **truly fair, verifiable, and engaging gaming experiences**. Players catch falling crypto tokens while experiencing:

- **🎲 VRF Randomness**: Unpredictable difficulty changes powered by verifiable random functions
- **🔐 Sealed Sessions**: Hidden reward multipliers revealed after gameplay using blocklock encryption  
- **💰 Blockchain Rewards**: Earn and claim USDC tokens based on your performance
- **👥 User Profiles**: Persistent progress, levels, and achievements on-chain

## 🏗️ **Project Architecture**

```
crypto-catcher/
├── 🎮 Game Components
│   ├── components/enhanced-crypto-game.tsx    # Main VRF-enhanced game
│   ├── components/crypto-game.tsx             # Classic mode game
│   └── components/token-swap.tsx              # Token claiming interface
├── 📱 Frontend Pages
│   ├── app/crypto-catcher-enhanced/           # Enhanced VRF mode
│   ├── app/crypto-catcher/                    # Classic mode + claims
│   └── app/page.tsx                           # Auto-redirect to enhanced game
├── 🔗 Smart Contracts
│   ├── contracts/CryptoCatcherRandomness.sol  # VRF integration
│   ├── contracts/CryptoCatcherBlocklock.sol   # Sealed sessions
│   ├── contracts/EnhancedGameClaims.sol       # Reward distribution
│   ├── contracts/UserManager.sol              # User profiles & levels
│   └── contracts/MockERC20.sol                # USDC simulation
├── 🚀 Deployment Scripts
│   ├── scripts/deploy-with-usdc-options.js    # Main deployment
│   └── scripts/deploy-all-contracts.js        # Full contract suite
└── ⚙️ Configuration
    ├── lib/enhanced-contracts.ts              # Contract addresses
    ├── lib/lib/config/token.ts                # Game tokens & difficulty
    └── hardhat.config.ts                      # Blockchain configuration
```

## 🎮 **Game Modes**

### **1. Classic Mode** (`/crypto-catcher`)
- **No wallet required** - Play immediately
- Basic crypto catching gameplay
- Local score tracking
- Simple difficulty progression

### **2. Enhanced Mode** (`/crypto-catcher-enhanced`) 
- **Wallet connection required**
- **VRF-powered randomness** for level changes
- **Session types**: FREE, BRONZE, SILVER, GOLD, PLATINUM
- **Dynamic difficulty scaling** based on verifiable randomness
- **Blockchain rewards** and persistent progress

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- MetaMask or compatible wallet
- Base Sepolia testnet ETH

### **1. Installation**
```bash
git clone <repository-url>
cd crypto-catcher
npm install
```

### **2. Environment Setup**
Create a `.env` file in the root directory:
```env
# Blockchain Configuration
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_here

# Optional: Alchemy API Key
NEXT_PUBLIC_ALCHEMY_KEY=your_alchemy_key_here

# Optional: Basescan API Key for contract verification
BASESCAN_API_KEY=your_basescan_key_here
```

### **3. Deploy Smart Contracts**
```bash
# Deploy all contracts to Base Sepolia
npx hardhat run scripts/deploy-with-usdc-options.js --network baseSepolia
```

### **4. Start Development Server**
```bash
npm run dev
```

### **5. Play the Game**
- Visit `http://localhost:3000`
- Auto-redirects to enhanced mode
- Connect wallet for VRF features
- Start catching crypto tokens! 🎯

## 🔧 **Smart Contract Deployment**

### **Required Contracts**
1. **CryptoCatcherRandomness.sol** - VRF integration with Randamu
2. **CryptoCatcherBlocklock.sol** - Sealed session management
3. **EnhancedGameClaims.sol** - Reward distribution system
4. **UserManager.sol** - User profiles and achievements
5. **MockERC20.sol** - USDC token simulation

### **Deployment Process**
```bash
# 1. Compile contracts
npx hardhat compile

# 2. Deploy to Base Sepolia
npx hardhat run scripts/deploy-with-usdc-options.js --network baseSepolia

# 3. Verify contracts (optional)
npx hardhat verify --network baseSepolia <contract-address>
```

## 🎲 **VRF Integration**

### **How It Works**
1. **Player creates VRF session** with entry fee
2. **Smart contract requests randomness** from Randamu network
3. **Verifiable random number** determines level change thresholds
4. **Game difficulty scales** unpredictably during gameplay
5. **Session parameters** are sealed until completion

### **Session Types**
| Type | Entry Fee | Multiplier | Max Levels |
|------|-----------|------------|------------|
| FREE | 0 ETH | 1.0x | 2 |
| BRONZE | 0.001 ETH | 1.2x | 3 |
| SILVER | 0.005 ETH | 1.5x | 4 |
| GOLD | 0.01 ETH | 2.0x | 5 |
| PLATINUM | 0.025 ETH | 3.0x | 7 |

## 🔐 **Blocklock Features**

### **Sealed Sessions**
- **Hidden multipliers** until session completion
- **Encrypted reward data** using blocklock technology
- **Verifiable fairness** without front-running
- **Time-locked reveals** for suspense

### **User Management**
- **Persistent profiles** on-chain
- **Level progression** system
- **Achievement tracking**
- **Leaderboard integration**

## 💰 **Reward System**

### **Token Types**
- **BTC** (100 points) - Bitcoin
- **ETH** (80 points) - Ethereum  
- **SOL** (40 points) - Solana
- **DOGE** (30 points) - Dogecoin
- **RED** (-100 points) - Obstacle token
- **BOMB** (-100 points) - Game over token

### **Claiming Rewards**
- **Minimum threshold**: 10 points
- **USDC conversion**: Points to USDC token swaps
- **Blockchain transactions**: Real on-chain rewards
- **Transaction history**: View all claims on Basescan

## 🎯 **Game Features**

### **Core Gameplay**
- **Canvas-based rendering** for smooth performance
- **Touch and keyboard controls** for mobile/desktop
- **Dynamic difficulty scaling** based on VRF
- **Real-time collision detection**
- **Score persistence** across sessions

### **Enhanced Features**
- **VRF-powered level changes** at random thresholds
- **Session-based progression** with different tiers
- **Blockchain integration** for verifiable fairness
- **User profile management** with achievements
- **Token-based reward system**

## 🛠️ **Development**

### **Tech Stack**
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Blockchain**: Hardhat, Ethers.js, Wagmi
- **VRF**: Randamu randomness libraries
- **Encryption**: Blocklock-solidity
- **State Management**: React hooks, localStorage

### **Key Dependencies**
```json
{
  "randomness-js": "^1.0.2",           // Randamu VRF library
  "blocklock-solidity": "^0.0.13",     // Blocklock encryption
  "randomness-solidity": "^0.0.7",     // Solidity VRF contracts
  "wagmi": "^2.14.13",                 // React hooks for Ethereum
  "ethers": "^6.15.0"                  // Ethereum library
}
```

### **Development Commands**
```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Smart Contracts
npx hardhat compile     # Compile contracts
npx hardhat test        # Run tests
npx hardhat node        # Start local blockchain
```

## 🌐 **Networks**

### **Supported Networks**
- **Base Sepolia** (Testnet) - Primary development network
- **Base Mainnet** - Production deployment
- **Hardhat Network** - Local development

### **Network Configuration**
```typescript
// hardhat.config.ts
networks: {
  baseSepolia: {
    url: process.env.BASE_SEPOLIA_RPC_URL,
    chainId: 84532,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

## 📱 **User Experience**

### **Game Flow**
1. **Connect wallet** for enhanced features
2. **Choose session type** (FREE to PLATINUM)
3. **Create VRF session** with blockchain transaction
4. **Play the game** with random difficulty changes
5. **Complete session** and reveal sealed rewards
6. **Claim USDC tokens** based on performance

### **Controls**
- **Arrow Keys** or **A/D**: Move wallet left/right
- **Touch**: Drag on mobile devices
- **Space**: Pause/resume game
- **Escape**: Stop game

## 🔍 **Troubleshooting**

### **Common Issues**

#### **VRF Session Stuck Loading**
- **Cause**: Contracts not deployed or wrong addresses
- **Solution**: Deploy contracts and update `lib/enhanced-contracts.ts`

#### **Transaction Failures**
- **Cause**: Insufficient ETH for gas fees
- **Solution**: Ensure wallet has Base Sepolia ETH

#### **Image Loading Errors**
- **Cause**: Missing token images in `/public/assets/images/`
- **Solution**: Add required token logo images

### **Debug Mode**
```bash
# Enable detailed logging
DEBUG=* npm run dev

# Check contract deployment
npx hardhat run scripts/deploy-with-usdc-options.js --network baseSepolia
```

## 🚀 **Deployment**

### **Production Build**
```bash
# Build the application
npm run build

# Start production server
npm run start

# Deploy to Vercel/Netlify
# The build output is in .next/ directory
```

### **Contract Verification**
```bash
# Verify on Basescan
npx hardhat verify --network baseSepolia <contract-address> <constructor-args>
```

## 🤝 **Contributing**

We welcome contributions! Please see our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests if applicable**
5. **Submit a pull request**

### **Development Guidelines**
- Follow TypeScript best practices
- Use conventional commit messages
- Test smart contracts thoroughly
- Update documentation for new features

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 **Links**

- **Game**: [Play Crypto Catcher](http://localhost:3000)
- **Documentation**: [Technical Guide](CRYPTO_CATCHER_TECHNICAL_GUIDE.md)
- **Deployment**: [Deployment Instructions](DEPLOYMENT_INSTRUCTIONS.md)
- **Blocklock**: [Blocklock Documentation](BLOCK-LOCK.md)

---

**🎮 Ready to catch some crypto? Connect your wallet and start playing the future of blockchain gaming!** 🚀
