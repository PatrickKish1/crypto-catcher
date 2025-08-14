// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import {TypesLib} from "blocklock-solidity/src/libraries/TypesLib.sol";
import {AbstractBlocklockReceiver} from "blocklock-solidity/src/AbstractBlocklockReceiver.sol";
import {BLS} from "blocklock-solidity/src/libraries/BLS.sol";

/// @title CryptoCatcherBlocklock
/// @notice Handles conditional encryption for sealed game sessions and delayed reveals
/// @author Team FIL-B
contract CryptoCatcherBlocklock is AbstractBlocklockReceiver {
    
    struct SealedSession {
        address player;
        uint256 sessionId;
        uint256 requestId;
        TypesLib.Ciphertext encryptedMultiplier;
        bytes condition;
        uint256 createdAt;
        uint256 unlockTime;
        bool isRevealed;
        uint256 revealedMultiplier;
        SealType sealType;
    }
    
    enum SealType { 
        TIME_BASED,     // Unlock after specific time
        BLOCK_BASED,    // Unlock after specific block
        SCORE_BASED     // Unlock after achieving score (implemented via time proxy)
    }
    
    mapping(uint256 => SealedSession) public sealedSessions;
    mapping(address => uint256[]) public playerSealedSessions;
    mapping(uint256 => uint256) public sessionIdToSealId; // Links game session to sealed session
    
    uint256 public nextSealId = 1;
    
    // Multiplier ranges for different session types (in basis points)
    uint256 constant MIN_MULTIPLIER = 50;   // 0.5x
    uint256 constant MAX_MULTIPLIER = 1000; // 10x
    
    event SealedSessionCreated(
        uint256 indexed sealId, 
        address indexed player, 
        uint256 indexed sessionId,
        SealType sealType,
        uint256 unlockTime
    );
    
    event MultiplierRevealed(
        uint256 indexed sealId, 
        address indexed player, 
        uint256 sessionId,
        uint256 multiplier
    );
    
    event SealFailed(uint256 indexed sealId, string reason);
    
    error SessionAlreadySealed();
    error SealNotFound();
    error UnauthorizedPlayer();
    error SealNotReady();
    error InvalidSealType();
    
    constructor(address blocklockSender) AbstractBlocklockReceiver(blocklockSender) {}
    
    /// @notice Wrapper to convert memory ciphertext to calldata for base contract
    function _requestBlocklockPayInNativeWrapper(
        uint32 callbackGasLimit,
        bytes memory condition,
        TypesLib.Ciphertext memory ciphertext
    ) internal returns (uint256 requestId, uint256 requestPrice) {
        requestPrice = blocklock.calculateRequestPriceNative(callbackGasLimit);
        require(msg.value >= requestPrice, "Insufficient ETH");
        requestId = blocklock.requestBlocklock{value: msg.value}(callbackGasLimit, condition, ciphertext);
    }
    
    /// @notice Create a sealed session with time-based unlock
    function createTimeSealedSession(
        uint256 sessionId,
        uint256 unlockDelayMinutes,
        uint256 encryptedMultiplier,
        uint32 callbackGasLimit
    ) external payable returns (uint256 sealId, uint256 requestPrice) {
        
        if (sessionIdToSealId[sessionId] != 0) {
            revert SessionAlreadySealed();
        }
        
        sealId = nextSealId++;
        uint256 unlockTime = block.timestamp + (unlockDelayMinutes * 60);
        
        // Encode time-based condition
        bytes memory condition = abi.encode("TIME", unlockTime);
        
        // Create encrypted payload with multiplier
        TypesLib.Ciphertext memory ciphertext = _createEncryptedMultiplier(encryptedMultiplier);
        
        // Request blocklock
        (uint256 requestId, uint256 price) = _requestBlocklockPayInNativeWrapper(
            callbackGasLimit,
            condition,
            ciphertext
        );
        
        // Store sealed session
        sealedSessions[sealId] = SealedSession({
            player: msg.sender,
            sessionId: sessionId,
            requestId: requestId,
            encryptedMultiplier: ciphertext,
            condition: condition,
            createdAt: block.timestamp,
            unlockTime: unlockTime,
            isRevealed: false,
            revealedMultiplier: 0,
            sealType: SealType.TIME_BASED
        });
        
        playerSealedSessions[msg.sender].push(sealId);
        sessionIdToSealId[sessionId] = sealId;
        
        emit SealedSessionCreated(sealId, msg.sender, sessionId, SealType.TIME_BASED, unlockTime);
        
        return (sealId, price);
    }
    
    /// @notice Create a sealed session with block-based unlock
    function createBlockSealedSession(
        uint256 sessionId,
        uint256 unlockBlock,
        uint256 encryptedMultiplier,
        uint32 callbackGasLimit
    ) external payable returns (uint256 sealId, uint256 requestPrice) {
        
        if (sessionIdToSealId[sessionId] != 0) {
            revert SessionAlreadySealed();
        }
        
        if (unlockBlock <= block.number) {
            revert InvalidSealType();
        }
        
        sealId = nextSealId++;
        
        // Encode block-based condition
        bytes memory condition = abi.encode("BLOCK", unlockBlock);
        
        // Create encrypted payload with multiplier
        TypesLib.Ciphertext memory ciphertext = _createEncryptedMultiplier(encryptedMultiplier);
        
        // Request blocklock
        (uint256 requestId, uint256 price) = _requestBlocklockPayInNativeWrapper(
            callbackGasLimit,
            condition,
            ciphertext
        );
        
        // Store sealed session
        sealedSessions[sealId] = SealedSession({
            player: msg.sender,
            sessionId: sessionId,
            requestId: requestId,
            encryptedMultiplier: ciphertext,
            condition: condition,
            createdAt: block.timestamp,
            unlockTime: unlockBlock, // Using unlockTime field for block number
            isRevealed: false,
            revealedMultiplier: 0,
            sealType: SealType.BLOCK_BASED
        });
        
        playerSealedSessions[msg.sender].push(sealId);
        sessionIdToSealId[sessionId] = sealId;
        
        emit SealedSessionCreated(sealId, msg.sender, sessionId, SealType.BLOCK_BASED, unlockBlock);
        
        return (sealId, price);
    }
    
    /// @notice Callback function when blocklock reveals the encrypted multiplier
    function _onBlocklockReceived(uint256 _requestId, bytes calldata decryptionKey) internal override {
        // Find the sealed session for this request
        uint256 sealId = _findSealByRequestId(_requestId);
        
        if (sealId == 0) {
            emit SealFailed(0, "Request ID not found");
            return;
        }
        
        SealedSession storage seal = sealedSessions[sealId];
        
        try this._decryptMultiplier(seal.encryptedMultiplier, decryptionKey) returns (uint256 multiplier) {
            // Validate multiplier is within acceptable range
            if (multiplier < MIN_MULTIPLIER || multiplier > MAX_MULTIPLIER) {
                emit SealFailed(sealId, "Invalid multiplier range");
                return;
            }
            
            seal.isRevealed = true;
            seal.revealedMultiplier = multiplier;
            
            emit MultiplierRevealed(sealId, seal.player, seal.sessionId, multiplier);
            
        } catch {
            emit SealFailed(sealId, "Decryption failed");
        }
    }
    
    /// @notice External wrapper for decryption (for try-catch)
    function _decryptMultiplier(TypesLib.Ciphertext calldata ciphertext, bytes calldata decryptionKey) 
        external view returns (uint256) {
        bytes memory decrypted = _decrypt(ciphertext, decryptionKey);
        return abi.decode(decrypted, (uint256));
    }
    
    /// @notice Find sealed session by request ID
    function _findSealByRequestId(uint256 requestId) internal view returns (uint256) {
        for (uint256 i = 1; i < nextSealId; i++) {
            if (sealedSessions[i].requestId == requestId) {
                return i;
            }
        }
        return 0;
    }
    
    /// @notice Create encrypted multiplier payload
    function _createEncryptedMultiplier(uint256 multiplier) internal pure returns (TypesLib.Ciphertext memory) {
        // This is a simplified implementation - in practice, you'd use blocklock-js
        // to properly encrypt the multiplier before calling this function
        bytes memory encodedMultiplier = abi.encode(multiplier);
        
        return TypesLib.Ciphertext({
            u: BLS.PointG2({ x: [uint256(0), uint256(0)], y: [uint256(0), uint256(0)] }), // Placeholder - would be set by blocklock-js
            v: encodedMultiplier,
            w: encodedMultiplier
        });
    }
    
    /// @notice Get sealed session details
    function getSealedSession(uint256 sealId) external view returns (SealedSession memory) {
        if (sealId == 0 || sealId >= nextSealId) {
            revert SealNotFound();
        }
        return sealedSessions[sealId];
    }
    
    /// @notice Get sealed session by game session ID
    function getSealedSessionByGameId(uint256 sessionId) external view returns (SealedSession memory) {
        uint256 sealId = sessionIdToSealId[sessionId];
        if (sealId == 0) {
            revert SealNotFound();
        }
        return sealedSessions[sealId];
    }
    
    /// @notice Check if a sealed session is ready to be revealed
    function isReadyToReveal(uint256 sealId) external view returns (bool) {
        SealedSession storage seal = sealedSessions[sealId];
        
        if (seal.sealType == SealType.TIME_BASED) {
            return block.timestamp >= seal.unlockTime;
        } else if (seal.sealType == SealType.BLOCK_BASED) {
            return block.number >= seal.unlockTime; // unlockTime stores block number for block-based seals
        }
        
        return false;
    }
    
    /// @notice Get player's sealed sessions
    function getPlayerSealedSessions(address player) external view returns (uint256[] memory) {
        return playerSealedSessions[player];
    }
    
    /// @notice Generate random multiplier based on session type and player history
    function generateMultiplier(
        address player, 
        uint256 sessionType, 
        bytes32 randomSeed
    ) external pure returns (uint256) {
        uint256 baseMultiplier = 100; // 1x base
        
        // Adjust base multiplier by session type (bronze=120, silver=150, etc.)
        if (sessionType == 1) baseMultiplier = 120;      // Bronze
        else if (sessionType == 2) baseMultiplier = 150; // Silver  
        else if (sessionType == 3) baseMultiplier = 200; // Gold
        else if (sessionType == 4) baseMultiplier = 300; // Platinum
        
        // Add randomness (±50% variation)
        uint256 randomFactor = uint256(keccak256(abi.encode(player, randomSeed))) % 100;
        uint256 variation = (baseMultiplier * randomFactor) / 200; // 0-50% of base
        
        // Randomly add or subtract variation
        bool addVariation = uint256(keccak256(abi.encode(randomSeed, "direction"))) % 2 == 0;
        
        if (addVariation) {
            return baseMultiplier + variation;
        } else {
            return baseMultiplier > variation ? baseMultiplier - variation : baseMultiplier / 2;
        }
    }
    
    /// @notice Emergency function to manually reveal if blocklock fails
    function emergencyReveal(uint256 sealId, uint256 multiplier) external onlyOwner {
        SealedSession storage seal = sealedSessions[sealId];
        
        require(!seal.isRevealed, "Already revealed");
        require(block.timestamp > seal.createdAt + 24 hours, "Must wait 24 hours");
        require(multiplier >= MIN_MULTIPLIER && multiplier <= MAX_MULTIPLIER, "Invalid multiplier");
        
        seal.isRevealed = true;
        seal.revealedMultiplier = multiplier;
        
        emit MultiplierRevealed(sealId, seal.player, seal.sessionId, multiplier);
    }
}
