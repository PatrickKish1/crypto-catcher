// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title UserManager
/// @notice Manages user profiles, scores, achievements, and leaderboards for Crypto Catcher
/// @author Team FIL-B
contract UserManager is Ownable, ReentrancyGuard {
    
    struct UserProfile {
        string username;
        address walletAddress;
        uint256 totalScore;
        uint256 bestSingleScore;
        uint256 gamesPlayed;
        uint256 totalTokensCollected;
        uint256 totalClaimsAmount; // in wei
        uint256 registrationTime;
        bool isActive;
        uint8 level; // User level 1-100
        uint256 experience; // XP points
    }
    
    struct GameResult {
        address player;
        uint256 score;
        uint256 tokensCollected;
        uint256 sessionId;
        uint256 multiplier; // in basis points (100 = 1%)
        uint256 timestamp;
        bool isSealed; // Was this a sealed session?
    }
    
    struct Achievement {
        string name;
        string description;
        uint256 requirement;
        uint256 xpReward;
        bool isActive;
    }
    
    struct LeaderboardEntry {
        address player;
        string username;
        uint256 score;
        uint256 timestamp;
    }
    
    // Mappings
    mapping(address => UserProfile) public userProfiles;
    mapping(string => address) public usernameToAddress;
    mapping(address => bool) public isRegistered;
    mapping(uint256 => GameResult) public gameResults;
    mapping(address => uint256[]) public userGameHistory;
    mapping(uint256 => Achievement) public achievements;
    mapping(address => mapping(uint256 => bool)) public userAchievements;
    mapping(address => uint256[]) public userAchievementsList;
    
    // Leaderboards (top 100 each)
    LeaderboardEntry[100] public allTimeLeaderboard;
    LeaderboardEntry[100] public weeklyLeaderboard;
    LeaderboardEntry[100] public dailyLeaderboard;
    
    // State variables
    uint256 public totalUsers;
    uint256 public nextGameId = 1;
    uint256 public nextAchievementId = 1;
    uint256 public constant MAX_USERNAME_LENGTH = 20;
    uint256 public constant LEVEL_UP_BASE_XP = 1000;
    
    // Time windows for leaderboards
    uint256 public constant DAY_IN_SECONDS = 86400;
    uint256 public constant WEEK_IN_SECONDS = 604800;
    
    // Events
    event UserRegistered(address indexed user, string username);
    event GameResultRecorded(address indexed player, uint256 indexed gameId, uint256 score);
    event LevelUp(address indexed player, uint8 newLevel);
    event AchievementUnlocked(address indexed player, uint256 indexed achievementId);
    event LeaderboardUpdated(address indexed player, string leaderboardType, uint256 position);
    
    // Errors
    error UsernameAlreadyTaken();
    error UserNotRegistered();
    error InvalidUsername();
    error UserAlreadyRegistered();
    error GameResultNotFound();
    error AchievementNotFound();
    
    constructor() Ownable(msg.sender) {
        _initializeAchievements();
    }
    
    /// @notice Register a new user with username
    function registerUser(string calldata username) external {
        if (isRegistered[msg.sender]) {
            revert UserAlreadyRegistered();
        }
        
        if (bytes(username).length == 0 || bytes(username).length > MAX_USERNAME_LENGTH) {
            revert InvalidUsername();
        }
        
        if (usernameToAddress[username] != address(0)) {
            revert UsernameAlreadyTaken();
        }
        
        // Create user profile
        userProfiles[msg.sender] = UserProfile({
            username: username,
            walletAddress: msg.sender,
            totalScore: 0,
            bestSingleScore: 0,
            gamesPlayed: 0,
            totalTokensCollected: 0,
            totalClaimsAmount: 0,
            registrationTime: block.timestamp,
            isActive: true,
            level: 1,
            experience: 0
        });
        
        usernameToAddress[username] = msg.sender;
        isRegistered[msg.sender] = true;
        totalUsers++;
        
        emit UserRegistered(msg.sender, username);
    }
    
    /// @notice Record a game result and update user stats
    function recordGameResult(
        address player,
        uint256 score,
        uint256 tokensCollected,
        uint256 sessionId,
        uint256 multiplier,
        bool isSealed
    ) external onlyOwner returns (uint256 gameId) {
        if (!isRegistered[player]) {
            revert UserNotRegistered();
        }
        
        gameId = nextGameId++;
        
        // Record game result
        gameResults[gameId] = GameResult({
            player: player,
            score: score,
            tokensCollected: tokensCollected,
            sessionId: sessionId,
            multiplier: multiplier,
            timestamp: block.timestamp,
            isSealed: isSealed
        });
        
        userGameHistory[player].push(gameId);
        
        // Update user profile
        UserProfile storage profile = userProfiles[player];
        profile.totalScore += score;
        profile.gamesPlayed++;
        profile.totalTokensCollected += tokensCollected;
        
        if (score > profile.bestSingleScore) {
            profile.bestSingleScore = score;
        }
        
        // Award XP based on performance
        uint256 xpGained = _calculateXP(score, tokensCollected, multiplier, isSealed);
        _awardXP(player, xpGained);
        
        // Update leaderboards
        _updateLeaderboards(player, score);
        
        // Check for achievements
        _checkAchievements(player);
        
        emit GameResultRecorded(player, gameId, score);
        
        return gameId;
    }
    
    /// @notice Calculate XP gained from a game
    function _calculateXP(uint256 score, uint256 tokens, uint256 multiplier, bool isSealed) 
        internal pure returns (uint256) {
        uint256 baseXP = score / 10; // 1 XP per 10 points
        uint256 tokenBonus = tokens * 5; // 5 XP per token collected
        uint256 multiplierBonus = (baseXP * multiplier) / 100; // Apply multiplier
        uint256 sealBonus = isSealed ? (baseXP * 20) / 100 : 0; // 20% bonus for sealed sessions
        
        return baseXP + tokenBonus + multiplierBonus + sealBonus;
    }
    
    /// @notice Award XP to a player and handle level ups
    function _awardXP(address player, uint256 xp) internal {
        UserProfile storage profile = userProfiles[player];
        profile.experience += xp;
        
        // Check for level up
        uint8 newLevel = _calculateLevel(profile.experience);
        if (newLevel > profile.level) {
            profile.level = newLevel;
            emit LevelUp(player, newLevel);
        }
    }
    
    /// @notice Calculate user level based on XP
    function _calculateLevel(uint256 xp) internal pure returns (uint8) {
        if (xp < LEVEL_UP_BASE_XP) return 1;
        
        // Level formula: level = sqrt(XP / 1000) + 1, capped at 100
        uint256 level = _sqrt(xp / LEVEL_UP_BASE_XP) + 1;
        return level > 100 ? 100 : uint8(level);
    }
    
    /// @notice Simple integer square root
    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    /// @notice Update leaderboards with new score
    function _updateLeaderboards(address player, uint256 score) internal {
        string memory username = userProfiles[player].username;
        uint256 timestamp = block.timestamp;
        
        LeaderboardEntry memory newEntry = LeaderboardEntry({
            player: player,
            username: username,
            score: score,
            timestamp: timestamp
        });
        
        // Update all-time leaderboard
        _insertIntoLeaderboard(allTimeLeaderboard, newEntry);
        
        // Update weekly leaderboard (check if within current week)
        _insertIntoLeaderboard(weeklyLeaderboard, newEntry);
        
        // Update daily leaderboard (check if within current day)
        _insertIntoLeaderboard(dailyLeaderboard, newEntry);
    }
    
    /// @notice Insert entry into leaderboard maintaining sorted order
    function _insertIntoLeaderboard(LeaderboardEntry[100] storage leaderboard, LeaderboardEntry memory newEntry) internal {
        // Find insertion position
        uint256 insertPos = 100;
        for (uint256 i = 0; i < 100; i++) {
            if (leaderboard[i].player == address(0) || newEntry.score > leaderboard[i].score) {
                insertPos = i;
                break;
            }
        }
        
        if (insertPos < 100) {
            // Shift entries down
            for (uint256 i = 99; i > insertPos; i--) {
                leaderboard[i] = leaderboard[i - 1];
            }
            
            // Insert new entry
            leaderboard[insertPos] = newEntry;
            
            emit LeaderboardUpdated(newEntry.player, "all-time", insertPos + 1);
        }
    }
    
    /// @notice Initialize default achievements
    function _initializeAchievements() internal {
        _createAchievement("First Game", "Play your first game", 1, 100);
        _createAchievement("Collector", "Collect 100 tokens total", 100, 250);
        _createAchievement("High Scorer", "Score 1000 points in a single game", 1000, 500);
        _createAchievement("Veteran", "Play 50 games", 50, 750);
        _createAchievement("Token Master", "Collect 1000 tokens total", 1000, 1000);
        _createAchievement("Elite Player", "Reach level 25", 25, 2000);
        _createAchievement("Seal Breaker", "Complete 10 sealed sessions", 10, 1500);
    }
    
    /// @notice Create a new achievement
    function _createAchievement(string memory name, string memory description, uint256 requirement, uint256 xpReward) internal {
        uint256 achievementId = nextAchievementId++;
        achievements[achievementId] = Achievement({
            name: name,
            description: description,
            requirement: requirement,
            xpReward: xpReward,
            isActive: true
        });
    }
    
    /// @notice Check if player has unlocked any achievements
    function _checkAchievements(address player) internal {
        UserProfile storage profile = userProfiles[player];
        
        // Check all achievements
        for (uint256 i = 1; i < nextAchievementId; i++) {
            if (!achievements[i].isActive || userAchievements[player][i]) {
                continue;
            }
            
            bool unlocked = false;
            
            // Check achievement conditions
            if (keccak256(bytes(achievements[i].name)) == keccak256(bytes("First Game"))) {
                unlocked = profile.gamesPlayed >= 1;
            } else if (keccak256(bytes(achievements[i].name)) == keccak256(bytes("Collector"))) {
                unlocked = profile.totalTokensCollected >= 100;
            } else if (keccak256(bytes(achievements[i].name)) == keccak256(bytes("High Scorer"))) {
                unlocked = profile.bestSingleScore >= 1000;
            } else if (keccak256(bytes(achievements[i].name)) == keccak256(bytes("Veteran"))) {
                unlocked = profile.gamesPlayed >= 50;
            } else if (keccak256(bytes(achievements[i].name)) == keccak256(bytes("Token Master"))) {
                unlocked = profile.totalTokensCollected >= 1000;
            } else if (keccak256(bytes(achievements[i].name)) == keccak256(bytes("Elite Player"))) {
                unlocked = profile.level >= 25;
            }
            
            if (unlocked) {
                userAchievements[player][i] = true;
                userAchievementsList[player].push(i);
                profile.experience += achievements[i].xpReward;
                
                // Check for level up after achievement XP
                uint8 newLevel = _calculateLevel(profile.experience);
                if (newLevel > profile.level) {
                    profile.level = newLevel;
                    emit LevelUp(player, newLevel);
                }
                
                emit AchievementUnlocked(player, i);
            }
        }
    }
    
    /// @notice Update user's total claims amount (called by GameClaims contract)
    function updateClaimsAmount(address player, uint256 amount) external onlyOwner {
        if (!isRegistered[player]) {
            revert UserNotRegistered();
        }
        
        userProfiles[player].totalClaimsAmount += amount;
    }
    
    /// @notice Get user profile
    function getUserProfile(address user) external view returns (UserProfile memory) {
        if (!isRegistered[user]) {
            revert UserNotRegistered();
        }
        return userProfiles[user];
    }
    
    /// @notice Get leaderboard (0=all-time, 1=weekly, 2=daily)
    function getLeaderboard(uint8 leaderboardType) external view returns (LeaderboardEntry[100] memory) {
        if (leaderboardType == 0) return allTimeLeaderboard;
        if (leaderboardType == 1) return weeklyLeaderboard;
        if (leaderboardType == 2) return dailyLeaderboard;
        revert("Invalid leaderboard type");
    }
    
    /// @notice Get user's game history
    function getUserGameHistory(address user) external view returns (uint256[] memory) {
        return userGameHistory[user];
    }
    
    /// @notice Get user's achievements
    function getUserAchievements(address user) external view returns (uint256[] memory) {
        return userAchievementsList[user];
    }
    
    /// @notice Get achievement details
    function getAchievement(uint256 achievementId) external view returns (Achievement memory) {
        if (achievementId == 0 || achievementId >= nextAchievementId) {
            revert AchievementNotFound();
        }
        return achievements[achievementId];
    }
    
    /// @notice Check if user has specific achievement
    function hasAchievement(address user, uint256 achievementId) external view returns (bool) {
        return userAchievements[user][achievementId];
    }
    
    /// @notice Get top players (first 10 from all-time leaderboard)
    function getTopPlayers() external view returns (LeaderboardEntry[10] memory topPlayers) {
        for (uint256 i = 0; i < 10; i++) {
            topPlayers[i] = allTimeLeaderboard[i];
        }
    }
    
    /// @notice Admin function to create new achievement
    function createAchievement(
        string calldata name,
        string calldata description,
        uint256 requirement,
        uint256 xpReward
    ) external onlyOwner {
        _createAchievement(name, description, requirement, xpReward);
    }
    
    /// @notice Admin function to deactivate achievement
    function deactivateAchievement(uint256 achievementId) external onlyOwner {
        if (achievementId == 0 || achievementId >= nextAchievementId) {
            revert AchievementNotFound();
        }
        achievements[achievementId].isActive = false;
    }
}
