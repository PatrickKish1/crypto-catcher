// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import {RandomnessReceiverBase} from "randomness-solidity/src/RandomnessReceiverBase.sol";
import {TypesLib} from "blocklock-solidity/src/libraries/TypesLib.sol";
import {AbstractBlocklockReceiver} from "blocklock-solidity/src/AbstractBlocklockReceiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Game Roulette
/// @notice Manages random game switching with VRF and sealed sessions
/// @author Team FIL-B
contract GameRoulette is RandomnessReceiverBase, AbstractBlocklockReceiver, Ownable, ReentrancyGuard {
    
    // Game types with different difficulties
    enum GameType { 
        COINFLIP_EASY, COINFLIP_MEDIUM, COINFLIP_HARD,
        CRYPTO_CATCHER_EASY, CRYPTO_CATCHER_MEDIUM, CRYPTO_CATCHER_HARD,
        ENHANCED_CRYPTO_CATCHER_FREE, ENHANCED_CRYPTO_CATCHER_BRONZE, 
        ENHANCED_CRYPTO_CATCHER_SILVER, ENHANCED_CRYPTO_CATCHER_GOLD, 
        ENHANCED_CRYPTO_CATCHER_PLATINUM 
    }
    
    enum DifficultyLevel { EASY, MEDIUM, HARD, EXPERT }
    
    struct RouletteSession {
        address player;
        uint256 sessionId;
        GameType currentGame;
        DifficultyLevel currentDifficulty;
        uint256 startTime;
        uint256 gameSwitchInterval; // 60 seconds default
        uint256 lastGameSwitch;
        bool isActive;
        bytes32 vrfSeed;
        uint256 nextGameRequestId;
        bool isSealed;
        uint256 sealedMultiplier;
        uint256 gamesPlayed;
        uint256 totalScore;
    }
    
    struct GameState {
        GameType gameType;
        uint256 score;
        uint256 level;
        uint256 tokens;
        DifficultyLevel difficulty;
        uint256 pausedAt;
        bytes gameData; // Game-specific state data
        bool isPaused;
    }
    
    struct SealedRouletteSession {
        address player;
        uint256 sessionId;
        uint256 requestId;
        TypesLib.Ciphertext encryptedMultiplier;
        bytes condition;
        uint256 createdAt;
        uint256 unlockTime;
        bool isRevealed;
        uint256 revealedMultiplier;
    }
    
    // Mappings
    mapping(uint256 => RouletteSession) public sessions;
    mapping(address => uint256) public activePlayerSession;
    mapping(address => mapping(GameType => GameState)) public playerGameStates;
    mapping(uint256 => SealedRouletteSession) public sealedSessions;
    
    // State variables
    uint256 public nextSessionId = 1;
    uint256 public nextSealId = 1;
    uint256 public constant DEFAULT_GAME_SWITCH_INTERVAL = 60; // 60 seconds
    uint256 public constant MAX_SESSION_DURATION = 3600; // 1 hour max
    
    // Events
    event RouletteSessionCreated(uint256 indexed sessionId, address indexed player, GameType initialGame, DifficultyLevel difficulty);
    event GameSwitched(uint256 indexed sessionId, address indexed player, GameType newGame, DifficultyLevel difficulty);
    event GameStateSaved(uint256 indexed sessionId, address indexed player, GameType gameType, uint256 score);
    event GameResumed(uint256 indexed sessionId, address indexed player, GameType gameType);
    event SealedSessionCreated(uint256 indexed sealId, address indexed player, uint256 sessionId);
    event MultiplierRevealed(uint256 indexed sealId, address indexed player, uint256 multiplier);
    
    // Errors
    error SessionNotFound();
    error SessionNotActive();
    error UnauthorizedPlayer();
    error GameSwitchInProgress();
    error InvalidGameType();
    error InvalidDifficulty();
    
    constructor(
        address randomnessSender, 
        address blocklockSender,
        address owner
    ) 
        RandomnessReceiverBase(randomnessSender, owner)
        AbstractBlocklockReceiver(blocklockSender)
        Ownable(owner)
    {}
    
    /// @notice Create a new game roulette session
    function createRouletteSession(uint32 callbackGasLimit) 
        external payable returns (uint256 sessionId, uint256 requestPrice) {
        
        // Check if player already has active session
        if (activePlayerSession[msg.sender] != 0) {
            revert("Player already has active session");
        }
        
        // Calculate VRF request price
        requestPrice = randomness.calculateRequestPriceNative(callbackGasLimit);
        require(msg.value >= requestPrice, "Insufficient payment for VRF");
        
        // Create session
        sessionId = nextSessionId++;
        sessions[sessionId] = RouletteSession({
            player: msg.sender,
            sessionId: sessionId,
            currentGame: GameType.COINFLIP_EASY, // Default starting game
            currentDifficulty: DifficultyLevel.EASY,
            startTime: block.timestamp,
            gameSwitchInterval: DEFAULT_GAME_SWITCH_INTERVAL,
            lastGameSwitch: block.timestamp,
            isActive: true,
            vrfSeed: bytes32(0),
            nextGameRequestId: 0,
            isSealed: false,
            sealedMultiplier: 100, // 1x default
            gamesPlayed: 0,
            totalScore: 0
        });
        
        activePlayerSession[msg.sender] = sessionId;
        
        // Request VRF for first game selection
        uint256 requestId = randomness.generateWithDirectFunding{value: requestPrice}(callbackGasLimit);
        sessions[sessionId].nextGameRequestId = requestId;
        
        emit RouletteSessionCreated(sessionId, msg.sender, GameType.COINFLIP_EASY, DifficultyLevel.EASY);
    }
    
    /// @notice Request next game selection using VRF
    function requestNextGame(uint256 sessionId, uint32 callbackGasLimit) 
        external payable returns (uint256 requestId, uint256 requestPrice) {
        
        RouletteSession storage session = sessions[sessionId];
        if (session.sessionId == 0) revert SessionNotFound();
        if (!session.isActive) revert SessionNotActive();
        if (msg.sender != session.player) revert UnauthorizedPlayer();
        
        // Check if enough time has passed for game switch
        require(
            block.timestamp >= session.lastGameSwitch + session.gameSwitchInterval,
            "Game switch too soon"
        );
        
        // Calculate VRF request price
        requestPrice = randomness.calculateRequestPriceNative(callbackGasLimit);
        require(msg.value >= requestPrice, "Insufficient payment for VRF");
        
        // Request VRF for next game
        requestId = randomness.generateWithDirectFunding{value: requestPrice}(callbackGasLimit);
        session.nextGameRequestId = requestId;
    }
    
    /// @notice Save current game state before switching
    function saveGameState(
        uint256 sessionId,
        GameType gameType,
        uint256 score,
        uint256 level,
        uint256 tokens,
        bytes calldata gameData
    ) external {
        RouletteSession storage session = sessions[sessionId];
        if (session.sessionId == 0) revert SessionNotFound();
        if (!session.isActive) revert SessionNotActive();
        if (msg.sender != session.player) revert UnauthorizedPlayer();
        
        // Save game state
        playerGameStates[msg.sender][gameType] = GameState({
            gameType: gameType,
            score: score,
            level: level,
            tokens: tokens,
            difficulty: session.currentDifficulty,
            pausedAt: block.timestamp,
            gameData: gameData,
            isPaused: true
        });
        
        // Update session stats
        session.totalScore += score;
        session.gamesPlayed++;
        
        emit GameStateSaved(sessionId, msg.sender, gameType, score);
    }
    
    /// @notice Resume a previously saved game
    function resumeGame(uint256 sessionId, GameType gameType) external {
        RouletteSession storage session = sessions[sessionId];
        if (session.sessionId == 0) revert SessionNotFound();
        if (!session.isActive) revert SessionNotActive();
        if (msg.sender != session.player) revert UnauthorizedPlayer();
        
        GameState storage gameState = playerGameStates[msg.sender][gameType];
        if (!gameState.isPaused) revert("Game not paused");
        
        // Mark game as resumed
        gameState.isPaused = false;
        
        emit GameResumed(sessionId, msg.sender, gameType);
    }
    
    /// @notice Create sealed roulette session with encrypted multiplier
    function createSealedRouletteSession(
        uint256 sessionId,
        uint256 unlockDelayMinutes,
        bytes calldata encryptedMultiplier,
        uint32 callbackGasLimit
    ) external payable returns (uint256 sealId, uint256 requestPrice) {
        
        RouletteSession storage session = sessions[sessionId];
        if (session.sessionId == 0) revert SessionNotFound();
        if (!session.isActive) revert SessionNotActive();
        if (msg.sender != session.player) revert UnauthorizedPlayer();
        
        // Calculate blocklock request price
        requestPrice = blocklock.calculateRequestPriceNative(callbackGasLimit);
        require(msg.value >= requestPrice, "Insufficient payment for blocklock");
        
        // Create sealed session
        sealId = nextSealId++;
        uint256 unlockTime = block.timestamp + (unlockDelayMinutes * 60);
        
        sealedSessions[sealId] = SealedRouletteSession({
            player: msg.sender,
            sessionId: sessionId,
            requestId: 0,
            encryptedMultiplier: abi.decode(encryptedMultiplier, (TypesLib.Ciphertext)),
            condition: abi.encode(unlockTime),
            createdAt: block.timestamp,
            unlockTime: unlockTime,
            isRevealed: false,
            revealedMultiplier: 0
        });
        
        // Mark roulette session as sealed
        session.isSealed = true;
        
        // Request blocklock decryption
        uint256 requestId = blocklock.requestBlocklock{value: requestPrice}(
            callbackGasLimit,
            abi.encode(unlockTime),
            abi.decode(encryptedMultiplier, (TypesLib.Ciphertext))
        );
        
        sealedSessions[sealId].requestId = requestId;
        
        emit SealedSessionCreated(sealId, msg.sender, sessionId);
    }
    
    /// @notice End roulette session
    function endSession(uint256 sessionId) external {
        RouletteSession storage session = sessions[sessionId];
        if (session.sessionId == 0) revert SessionNotFound();
        if (msg.sender != session.player) revert UnauthorizedPlayer();
        
        session.isActive = false;
        activePlayerSession[msg.sender] = 0;
    }
    
    /// @notice Get current session info
    function getSession(uint256 sessionId) external view returns (RouletteSession memory) {
        return sessions[sessionId];
    }
    
    /// @notice Get player's active session
    function getPlayerActiveSession(address player) external view returns (uint256) {
        return activePlayerSession[player];
    }
    
    /// @notice Get saved game state
    function getGameState(address player, GameType gameType) external view returns (GameState memory) {
        return playerGameStates[player][gameType];
    }
    
    /// @notice Check if game switch is due
    function isGameSwitchDue(uint256 sessionId) external view returns (bool) {
        RouletteSession storage session = sessions[sessionId];
        if (session.sessionId == 0) return false;
        
        return block.timestamp >= session.lastGameSwitch + session.gameSwitchInterval;
    }
    
    /// @notice Get time until next game switch
    function getTimeUntilNextSwitch(uint256 sessionId) external view returns (uint256) {
        RouletteSession storage session = sessions[sessionId];
        if (session.sessionId == 0) return 0;
        
        uint256 nextSwitchTime = session.lastGameSwitch + session.gameSwitchInterval;
        if (block.timestamp >= nextSwitchTime) return 0;
        
        return nextSwitchTime - block.timestamp;
    }
    
    // VRF Callback
    function _onRandomnessReceived(uint256 _requestId, bytes32 _randomness) internal override {
        // Find session by request ID
        uint256 sessionId = _findSessionByRequestId(_requestId);
        if (sessionId == 0) return;
        
        RouletteSession storage session = sessions[sessionId];
        session.vrfSeed = _randomness;
        
        // Generate next game and difficulty
        (GameType nextGame, DifficultyLevel difficulty) = _selectNextGame(_randomness);
        
        // Update session
        session.currentGame = nextGame;
        session.currentDifficulty = difficulty;
        session.lastGameSwitch = block.timestamp;
        
        emit GameSwitched(sessionId, session.player, nextGame, difficulty);
    }
    
    // Blocklock Callback
    function _onBlocklockReceived(uint256 _requestId, bytes calldata decryptionKey) internal override {
        // Find sealed session by request ID
        uint256 sealId = _findSealByRequestId(_requestId);
        if (sealId == 0) return;
        
        SealedRouletteSession storage seal = sealedSessions[sealId];
        
        try this._decryptMultiplier(seal.encryptedMultiplier, decryptionKey) returns (uint256 multiplier) {
            // Validate multiplier range (0.5x - 10x)
            require(multiplier >= 50 && multiplier <= 1000, "Invalid multiplier");
            
            seal.isRevealed = true;
            seal.revealedMultiplier = multiplier;
            
            // Update roulette session multiplier
            uint256 sessionId = seal.sessionId;
            RouletteSession storage session = sessions[sessionId];
            session.sealedMultiplier = multiplier;
            
            emit MultiplierRevealed(sealId, seal.player, multiplier);
        } catch {
            // Decryption failed - handle gracefully
        }
    }
    
    // Helper functions
    function _findSessionByRequestId(uint256 requestId) internal view returns (uint256) {
        for (uint256 i = 1; i < nextSessionId; i++) {
            if (sessions[i].nextGameRequestId == requestId) {
                return i;
            }
        }
        return 0;
    }
    
    function _findSealByRequestId(uint256 requestId) internal view returns (uint256) {
        for (uint256 i = 1; i < nextSealId; i++) {
            if (sealedSessions[i].requestId == requestId) {
                return i;
            }
        }
        return 0;
    }
    
    function _selectNextGame(bytes32 randomness) internal pure returns (GameType, DifficultyLevel) {
        // Use VRF to pick game type (0-10)
        uint256 gameIndex = uint256(keccak256(abi.encode(randomness, "game"))) % 11;
        
        // Use VRF to pick difficulty level
        uint256 difficultyIndex = uint256(keccak256(abi.encode(randomness, "difficulty"))) % 4;
        
        return (GameType(gameIndex), DifficultyLevel(difficultyIndex));
    }
    
    function _decryptMultiplier(TypesLib.Ciphertext memory ciphertext, bytes calldata decryptionKey) 
        external pure returns (uint256) {
        // This would integrate with your blocklock decryption logic
        // For now, return a placeholder
        return 100;
    }
    
    // Admin functions
    function setGameSwitchInterval(uint256 sessionId, uint256 newInterval) external onlyOwner {
        RouletteSession storage session = sessions[sessionId];
        if (session.sessionId == 0) revert SessionNotFound();
        
        session.gameSwitchInterval = newInterval;
    }
    
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
