// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import {RandomnessReceiverBase} from "randomness-solidity/src/RandomnessReceiverBase.sol";

/// @title CryptoCatcherRandomness
/// @notice Handles VRF randomness for crypto catcher game sessions and level changes
/// @author Team FIL-B
contract CryptoCatcherRandomness is RandomnessReceiverBase {
    
    struct GameSession {
        address player;
        uint256 requestId;
        bytes32 sessionSeed;
        uint256 entryFee;
        uint256 startTime;
        uint256 baseMultiplier;
        uint256[] levelChangeThresholds;
        uint256[] levelDifficulties;
        bool isActive;
        bool seedReceived;
    }
    
    struct LevelChangeRequest {
        address player;
        uint256 sessionId;
        uint256 currentScore;
        uint256 requestId;
        bool fulfilled;
    }
    
    mapping(uint256 => GameSession) public sessions;
    mapping(uint256 => LevelChangeRequest) public levelChangeRequests;
    mapping(address => uint256[]) public playerSessions;
    mapping(address => uint256) public activePlayerSession;
    
    uint256 public nextSessionId = 1;
    uint256 private nextRequestId = 1;
    
    // Session types with different entry fees and multipliers
    enum SessionType { FREE, BRONZE, SILVER, GOLD, PLATINUM }
    
    struct SessionConfig {
        uint256 entryFee;
        uint256 baseMultiplier; // in basis points (100 = 1%)
        uint256 maxLevelChanges;
    }
    
    mapping(SessionType => SessionConfig) public sessionConfigs;
    
    event SessionCreated(uint256 indexed sessionId, address indexed player, SessionType sessionType);
    event SessionSeedReceived(uint256 indexed sessionId, bytes32 seed);
    event LevelChangeTriggered(uint256 indexed sessionId, address indexed player, uint256 score, uint256 newLevel);
    event SessionEnded(uint256 indexed sessionId, address indexed player, uint256 finalScore);
    
    error SessionAlreadyActive();
    error SessionNotFound();
    error InsufficientEntryFee();
    error SessionNotActive();
    error UnauthorizedPlayer();
    
    constructor(address randomnessSender, address owner) 
        RandomnessReceiverBase(randomnessSender, owner) {
        
        // Initialize session configurations
        sessionConfigs[SessionType.FREE] = SessionConfig({
            entryFee: 0,
            baseMultiplier: 100, // 1x
            maxLevelChanges: 2
        });
        
        sessionConfigs[SessionType.BRONZE] = SessionConfig({
            entryFee: 0.001 ether,
            baseMultiplier: 120, // 1.2x
            maxLevelChanges: 3
        });
        
        sessionConfigs[SessionType.SILVER] = SessionConfig({
            entryFee: 0.005 ether,
            baseMultiplier: 150, // 1.5x
            maxLevelChanges: 4
        });
        
        sessionConfigs[SessionType.GOLD] = SessionConfig({
            entryFee: 0.01 ether,
            baseMultiplier: 200, // 2x
            maxLevelChanges: 5
        });
        
        sessionConfigs[SessionType.PLATINUM] = SessionConfig({
            entryFee: 0.025 ether,
            baseMultiplier: 300, // 3x
            maxLevelChanges: 7
        });
    }
    
    /// @notice Create a new game session with VRF-generated parameters
    function createGameSession(SessionType sessionType, uint32 callbackGasLimit) 
        external payable returns (uint256 sessionId, uint256 requestPrice) {
        
        // Check if player already has an active session
        if (activePlayerSession[msg.sender] != 0) {
            revert SessionAlreadyActive();
        }
        
        SessionConfig memory config = sessionConfigs[sessionType];
        
        // Check entry fee for paid sessions
        if (sessionType != SessionType.FREE && msg.value < config.entryFee) {
            revert InsufficientEntryFee();
        }
        
        sessionId = nextSessionId++;
        
        // Request randomness for session seed
        uint256 requestId;
        (requestId, requestPrice) = _requestRandomnessPayInNative(callbackGasLimit);
        
        // Create session
        sessions[sessionId] = GameSession({
            player: msg.sender,
            requestId: requestId,
            sessionSeed: bytes32(0),
            entryFee: config.entryFee,
            startTime: block.timestamp,
            baseMultiplier: config.baseMultiplier,
            levelChangeThresholds: new uint256[](0),
            levelDifficulties: new uint256[](0),
            isActive: true,
            seedReceived: false
        });
        
        playerSessions[msg.sender].push(sessionId);
        activePlayerSession[msg.sender] = sessionId;
        
        emit SessionCreated(sessionId, msg.sender, sessionType);
        
        return (sessionId, requestPrice);
    }
    
    /// @notice Request a level change during gameplay (triggered at random scores)
    function requestLevelChange(uint256 sessionId, uint256 currentScore, uint32 callbackGasLimit) 
        external payable returns (uint256 requestId, uint256 requestPrice) {
        
        GameSession storage session = sessions[sessionId];
        
        if (session.player != msg.sender) {
            revert UnauthorizedPlayer();
        }
        
        if (!session.isActive) {
            revert SessionNotActive();
        }
        
        // Request randomness for level change
        (requestId, requestPrice) = _requestRandomnessPayInNative(callbackGasLimit);
        
        levelChangeRequests[requestId] = LevelChangeRequest({
            player: msg.sender,
            sessionId: sessionId,
            currentScore: currentScore,
            requestId: requestId,
            fulfilled: false
        });
        
        return (requestId, requestPrice);
    }
    
    /// @notice End a game session
    function endSession(uint256 sessionId, uint256 finalScore) external {
        GameSession storage session = sessions[sessionId];
        
        if (session.player != msg.sender) {
            revert UnauthorizedPlayer();
        }
        
        if (!session.isActive) {
            revert SessionNotActive();
        }
        
        session.isActive = false;
        activePlayerSession[msg.sender] = 0;
        
        emit SessionEnded(sessionId, msg.sender, finalScore);
    }
    
    /// @notice Callback function that processes received randomness
    function onRandomnessReceived(uint256 requestId, bytes32 randomness) internal override {
        // Check if this is for a session creation
        for (uint256 i = 1; i < nextSessionId; i++) {
            if (sessions[i].requestId == requestId && !sessions[i].seedReceived) {
                _processSessionSeed(i, randomness);
                return;
            }
        }
        
        // Check if this is for a level change
        LevelChangeRequest storage levelRequest = levelChangeRequests[requestId];
        if (levelRequest.requestId == requestId && !levelRequest.fulfilled) {
            _processLevelChange(requestId, randomness);
            return;
        }
    }
    
    /// @notice Process session seed generation
    function _processSessionSeed(uint256 sessionId, bytes32 randomness) internal {
        GameSession storage session = sessions[sessionId];
        session.sessionSeed = randomness;
        session.seedReceived = true;
        
        // Generate random level change thresholds and difficulties
        uint256[] memory thresholds = new uint256[](5);
        uint256[] memory difficulties = new uint256[](5);
        
        bytes32 seed = randomness;
        for (uint256 i = 0; i < 5; i++) {
            seed = keccak256(abi.encode(seed, i));
            // Random thresholds between 100 * (i+1) and 300 * (i+1)
            thresholds[i] = 100 * (i + 1) + (uint256(seed) % (200 * (i + 1)));
            // Random difficulty levels 1-10
            difficulties[i] = 1 + (uint256(keccak256(abi.encode(seed, "difficulty"))) % 10);
        }
        
        session.levelChangeThresholds = thresholds;
        session.levelDifficulties = difficulties;
        
        emit SessionSeedReceived(sessionId, randomness);
    }
    
    /// @notice Process level change randomness
    function _processLevelChange(uint256 requestId, bytes32 randomness) internal {
        LevelChangeRequest storage levelRequest = levelChangeRequests[requestId];
        levelRequest.fulfilled = true;
        
        // Generate new random difficulty level (1-10)
        uint256 newLevel = 1 + (uint256(randomness) % 10);
        
        emit LevelChangeTriggered(levelRequest.sessionId, levelRequest.player, levelRequest.currentScore, newLevel);
    }
    
    /// @notice Get session details
    function getSession(uint256 sessionId) external view returns (GameSession memory) {
        return sessions[sessionId];
    }
    
    /// @notice Get player's active session
    function getActiveSession(address player) external view returns (uint256) {
        return activePlayerSession[player];
    }
    
    /// @notice Get session configuration
    function getSessionConfig(SessionType sessionType) external view returns (SessionConfig memory) {
        return sessionConfigs[sessionType];
    }
    
    /// @notice Check if session should trigger level change at current score
    function shouldTriggerLevelChange(uint256 sessionId, uint256 currentScore) 
        external view returns (bool, uint256) {
        GameSession storage session = sessions[sessionId];
        
        for (uint256 i = 0; i < session.levelChangeThresholds.length; i++) {
            if (currentScore >= session.levelChangeThresholds[i]) {
                return (true, session.levelDifficulties[i]);
            }
        }
        
        return (false, 0);
    }
}
