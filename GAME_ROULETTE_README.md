# 🎰 Game Roulette - VRF-Powered Game Switching System

## 🎯 Overview

Game Roulette is a revolutionary gaming system that combines **VRF randomness**, **blocklock encryption**, and **automatic game switching** to create an unpredictable, engaging gaming experience. Every 60 seconds, players are automatically switched to a completely different game with random difficulty levels, ensuring no two sessions are ever the same.

## ✨ Key Features

### 🎲 **VRF Randomness**
- **Unpredictable Game Selection**: VRF randomly picks from 11 different game variants
- **Random Difficulty Levels**: Each game switch includes random difficulty (Easy, Medium, Hard, Expert)
- **Verifiable Fairness**: All randomness is cryptographically verifiable on-chain

### ⏰ **60-Second Auto-Switching**
- **Automatic Transitions**: Games switch every minute regardless of player progress
- **State Preservation**: Current game state is automatically saved before switching
- **Seamless Experience**: No interruption to gameplay flow

### 🔐 **Sealed Sessions**
- **Hidden Multipliers**: Reward multipliers are encrypted using blocklock
- **Time-Based Reveals**: Multipliers revealed after specified time delays
- **Maximum Suspense**: Players never know their potential rewards upfront

### 🎮 **Game Variety**
- **Coin Flip**: Classic heads/tails with difficulty scaling
- **Crypto Catcher**: Token collection with obstacle avoidance
- **Enhanced Crypto Catcher**: VRF-powered level changes and sealed rewards

## 🏗️ Architecture

### Smart Contract Layer
```solidity
contract GameRoulette is RandomnessReceiverBase, AbstractBlocklockReceiver {
    // VRF for game selection
    // Blocklock for sealed sessions
    // Game state management
    // Session tracking
}
```

### Frontend Integration
```typescript
// Game components with difficulty props
<CoinFlip difficulty={DifficultyLevel.HARD} />
<CryptoGame difficulty={DifficultyLevel.EXPERT} />
<EnhancedCryptoGame difficulty={DifficultyLevel.MEDIUM} />
```

### State Management
- **Session State**: Active roulette session information
- **Game State**: Individual game progress and data
- **Roulette State**: Current game, difficulty, and countdown

## 🎮 How It Works

### 1. **Session Creation**
```typescript
// Player creates new roulette session
const session = await gameRoulette.createRouletteSession(callbackGasLimit)
// VRF generates first random game + difficulty
// Player starts with Coin Flip on Easy difficulty
```

### 2. **60-Second Countdown**
```typescript
// Timer counts down while player plays current game
const countdown = setInterval(() => {
  if (timeRemaining <= 1) {
    triggerGameSwitch() // Save state + request next game
    return 60 // Reset timer
  }
  setTimeRemaining(prev => prev - 1)
}, 1000)
```

### 3. **VRF Game Selection**
```solidity
function _selectNextGame(bytes32 randomness) internal pure returns (GameType, DifficultyLevel) {
    // Use VRF to pick game type (0-10)
    uint256 gameIndex = uint256(keccak256(abi.encode(randomness, "game"))) % 11;
    
    // Use VRF to pick difficulty level
    uint256 difficultyIndex = uint256(keccak256(abi.encode(randomness, "difficulty"))) % 4;
    
    return (GameType(gameIndex), DifficultyLevel(difficultyIndex));
}
```

### 4. **Game State Preservation**
```typescript
// Before switching, save current game state
const saveCurrentGameState = async () => {
  const currentState = gameStateRef.current.get(currentGameType)
  if (currentState) {
    // Save to blockchain
    await contract.saveGameState(sessionId, gameType, score, level, tokens, gameData)
    // Update local state
    setSavedGameStates(prev => new Map(prev.set(gameType, currentState)))
  }
}
```

### 5. **Seamless Game Switching**
```typescript
// Switch to new game with preserved state
const switchToGame = (newGame: GameType, difficulty: DifficultyLevel) => {
  setCurrentGameType(newGame)
  setCurrentDifficulty(difficulty)
  setTimeRemaining(60) // Reset countdown
  
  // Resume saved state if available
  const savedState = savedGameStates.get(newGame)
  if (savedState) {
    resumeGame(savedState)
  }
}
```

## 🎯 Game Types & Difficulties

### **Coin Flip Variants**
| Difficulty | Multiplier | Description |
|------------|------------|-------------|
| **Easy** | 1.0x | Standard coin flip |
| **Medium** | 1.2x | Increased scoring |
| **Hard** | 1.5x | Bonus for consecutive wins |
| **Expert** | 2.0x | Maximum challenge |

### **Crypto Catcher Variants**
| Difficulty | Multiplier | Spawn Rate | Speed |
|------------|------------|------------|-------|
| **Easy** | 1.0x | 0.02 | 2 |
| **Medium** | 1.2x | 0.03 | 3 |
| **Hard** | 1.5x | 0.04 | 4 |
| **Expert** | 2.0x | 0.05 | 5 |

### **Enhanced Crypto Catcher Variants**
| Session Type | Entry Fee | Base Multiplier | Level Changes |
|--------------|-----------|-----------------|---------------|
| **FREE** | 0 ETH | 1x | 2 |
| **BRONZE** | 0.001 ETH | 1.2x | 3 |
| **SILVER** | 0.005 ETH | 1.5x | 4 |
| **GOLD** | 0.01 ETH | 2x | 5 |
| **PLATINUM** | 0.025 ETH | 3x | 7 |

## 🔐 Sealed Sessions

### **Creating Sealed Roulette**
```typescript
const createSealedRouletteSession = async () => {
  // Generate random multiplier (50-1000 basis points = 0.5x-10x)
  const multiplier = 50 + Math.floor(Math.random() * 950)
  
  // Set unlock condition (e.g., 30 minutes from now)
  const unlockTime = Math.floor(Date.now() / 1000) + (30 * 60)
  
  // Encrypt the multiplier using blocklock
  const encryptedMultiplier = await blocklock.encrypt(multiplier, unlockTime)
  
  // Create sealed session
  await gameRoulette.createSealedRouletteSession(
    sessionId,
    30, // 30 minutes
    encryptedMultiplier,
    callbackGasLimit
  )
}
```

### **Revealing Multipliers**
```solidity
function _onBlocklockReceived(uint256 _requestId, bytes calldata decryptionKey) internal override {
    // Find sealed session by request ID
    uint256 sealId = _findSealByRequestId(_requestId);
    SealedRouletteSession storage seal = sealedSessions[sealId];
    
    // Decrypt multiplier
    uint256 multiplier = _decryptMultiplier(seal.encryptedMultiplier, decryptionKey);
    
    // Update session
    seal.isRevealed = true;
    seal.revealedMultiplier = multiplier;
    
    emit MultiplierRevealed(sealId, seal.player, multiplier);
}
```

## 🚀 Getting Started

### **1. Deploy Contracts**
```bash
# Deploy Game Roulette contract
npx hardhat run scripts/deploy-game-roulette.js --network baseSepolia
```

### **2. Update Configuration**
```typescript
// lib/game-roulette-config.ts
export const GAME_ROULETTE_CONTRACT = '0x...' // Your deployed address
export const GAME_ROULETTE_ABI = [...] // Your contract ABI
```

### **3. Start Playing**
```typescript
// Navigate to /game-roulette
// Connect wallet
// Click "Start Roulette"
// Experience unpredictable game switching!
```

## 🎯 Use Cases

### **For Players**
- **Variety**: Never get bored with the same game
- **Challenge**: Adapt to different mechanics and difficulties
- **Suspense**: Mystery of what's coming next
- **Skill Testing**: Master multiple game types

### **For Developers**
- **Retention**: High engagement through variety
- **Monetization**: Premium roulette sessions
- **Scalability**: Easy to add new games
- **Innovation**: First-of-its-kind gaming experience

### **For Gaming Platforms**
- **User Engagement**: Keeps players coming back
- **Content Variety**: Multiple games in one experience
- **Fairness**: VRF ensures no manipulation
- **Transparency**: All randomness verifiable

## 🔧 Technical Implementation

### **Contract Functions**
```solidity
// Core roulette functions
function createRouletteSession(uint32 callbackGasLimit) external payable
function requestNextGame(uint256 sessionId, uint32 callbackGasLimit) external payable
function saveGameState(uint256 sessionId, GameType gameType, uint256 score, uint256 level, uint256 tokens, bytes calldata gameData) external
function resumeGame(uint256 sessionId, GameType gameType) external

// Sealed session functions
function createSealedRouletteSession(uint256 sessionId, uint256 unlockDelayMinutes, bytes calldata encryptedMultiplier, uint32 callbackGasLimit) external payable

// View functions
function getSession(uint256 sessionId) external view returns (RouletteSession memory)
function isGameSwitchDue(uint256 sessionId) external view returns (bool)
function getTimeUntilNextSwitch(uint256 sessionId) external view returns (uint256)
```

### **Frontend Hooks**
```typescript
// Game state management
const [currentSession, setCurrentSession] = useState<RouletteSession | null>(null)
const [timeRemaining, setTimeRemaining] = useState(60)
const [currentGameType, setCurrentGameType] = useState<GameType>(GameType.COINFLIP_EASY)
const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>(DifficultyLevel.EASY)

// Game switching
const triggerGameSwitch = async () => {
  await saveCurrentGameState()
  await requestNextGame()
  setGameSwitchEffect(true)
}
```

### **State Synchronization**
```typescript
// Sync game state with blockchain
useEffect(() => {
  if (activeSessionId && sessionData) {
    updateSessionState(sessionData)
  }
}, [activeSessionId, sessionData])

// Update local state when contract changes
const updateSessionState = (sessionData: any) => {
  setCurrentSession({
    sessionId: sessionData.sessionId?.toString() || "",
    currentGame: Number(sessionData.currentGame) as GameType,
    currentDifficulty: Number(sessionData.currentDifficulty) as DifficultyLevel,
    // ... other fields
  })
}
```

## 📊 Benefits & Impact

### **Player Experience**
- ✅ **Unpredictable**: No pattern, no preparation possible
- ✅ **Engaging**: Constant variety keeps interest high
- ✅ **Fair**: VRF ensures true randomness
- ✅ **Rewarding**: Multiple multiplier layers

### **Developer Benefits**
- ✅ **Innovation**: First VRF-powered game switching
- ✅ **Retention**: High player engagement
- ✅ **Scalability**: Easy to add new games
- ✅ **Monetization**: Premium features and sessions

### **Technical Achievements**
- ✅ **VRF Integration**: True randomness for game selection
- ✅ **Blocklock Encryption**: Sealed sessions with suspense
- ✅ **State Management**: Seamless game transitions
- ✅ **Cross-Game Compatibility**: Unified gaming experience

## 🔮 Future Enhancements

### **Phase 2: Advanced Features**
- **Tournament Mode**: VRF-powered brackets and seeding
- **Guild System**: Team-based roulette competitions
- **NFT Achievements**: Special rewards for milestones
- **Cross-Chain**: Deploy on multiple networks

### **Phase 3: Platform Features**
- **Game Marketplace**: Third-party game integration
- **Custom Roulettes**: Player-created game sequences
- **Social Features**: Friend challenges and leaderboards
- **Analytics**: Detailed performance tracking

## 🎉 Conclusion

Game Roulette represents a **paradigm shift in casual gaming** by introducing:

1. **True unpredictability** through VRF randomness
2. **Seamless variety** with automatic game switching
3. **Maximum engagement** through mystery and suspense
4. **Provable fairness** with blockchain verification

This system creates a **"Netflix for games"** experience where the algorithm randomly picks what you play next, ensuring every session is unique and engaging. The combination of VRF, blocklock, and intelligent state management creates a gaming experience that's impossible to predict or manipulate.

**Game Roulette is not just a game - it's a new way of experiencing gaming variety and randomness!** 🎰🎮✨
