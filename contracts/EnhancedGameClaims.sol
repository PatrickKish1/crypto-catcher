// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CryptoCatcherBlocklock.sol";
import "./UserManager.sol";

/// @title EnhancedGameClaims
/// @notice Enhanced claims system with VRF multipliers and sealed session support
/// @author Team FIL-B
contract EnhancedGameClaims is Ownable, ReentrancyGuard {
    
    IERC20 public usdcToken;
    CryptoCatcherBlocklock public blocklockContract;
    UserManager public userManager;
    
    struct ClaimRequest {
        address player;
        uint256 points;
        uint256 sessionId;
        uint256 baseReward;
        uint256 multiplier; // in basis points (100 = 1%)
        bool isSealed;
        bool isClaimed;
        uint256 timestamp;
    }
    
    mapping(address => uint256) public totalClaimed;
    mapping(uint256 => ClaimRequest) public claimRequests;
    mapping(address => uint256[]) public userClaimHistory;
    
    uint256 public nextClaimId = 1;
    uint256 public totalDistributed;
    
    // Base conversion rates (points to USDC)
    uint256 public constant BASE_RATE_NUMERATOR = 1; // 1 USDC
    uint256 public constant BASE_RATE_DENOMINATOR = 1000; // per 1000 points
    
    // Bonus multipliers for different features
    uint256 public constant SEALED_SESSION_BONUS = 50; // 50% bonus for sealed sessions
    uint256 public constant LEVEL_BONUS_PER_LEVEL = 2; // 2% bonus per user level
    uint256 public constant MAX_LEVEL_BONUS = 100; // Cap at 100% (level 50+)
    
    event ClaimMade(
        address indexed user, 
        uint256 indexed claimId,
        uint256 points, 
        uint256 baseAmount,
        uint256 multiplier,
        uint256 totalAmount
    );
    
    event SealedClaimPending(
        address indexed user,
        uint256 indexed claimId,
        uint256 sessionId
    );
    
    event SealedClaimRevealed(
        address indexed user,
        uint256 indexed claimId,
        uint256 revealedMultiplier
    );
    
    error InsufficientPoints();
    error InsufficientBalance();
    error ClaimNotFound();
    error ClaimAlreadyProcessed();
    error SealNotRevealed();
    error UnauthorizedClaim();
    
    constructor(
        address _usdcToken,
        address payable _blocklockContract,
        address _userManager
    ) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
        blocklockContract = CryptoCatcherBlocklock(_blocklockContract);
        userManager = UserManager(_userManager);
    }
    
    /// @notice Calculate base reward for points (before multipliers)
    function calculateBaseReward(uint256 points) public pure returns (uint256) {
        if (points < 10) return 0; // Minimum threshold
        return (points * BASE_RATE_NUMERATOR * 1e6) / BASE_RATE_DENOMINATOR; // USDC has 6 decimals
    }
    
    /// @notice Calculate total multiplier including user level bonus
    function calculateTotalMultiplier(
        address player,
        uint256 sessionMultiplier,
        bool isSealed
    ) public view returns (uint256) {
        uint256 totalMultiplier = sessionMultiplier; // Base multiplier from session
        
        // Add sealed session bonus
        if (isSealed) {
            totalMultiplier = (totalMultiplier * (100 + SEALED_SESSION_BONUS)) / 100;
        }
        
        // Add user level bonus if registered
        if (userManager.isRegistered(player)) {
            UserManager.UserProfile memory profile = userManager.getUserProfile(player);
            uint256 levelBonus = profile.level * LEVEL_BONUS_PER_LEVEL;
            if (levelBonus > MAX_LEVEL_BONUS) {
                levelBonus = MAX_LEVEL_BONUS;
            }
            totalMultiplier = (totalMultiplier * (100 + levelBonus)) / 100;
        }
        
        return totalMultiplier;
    }
    
    /// @notice Calculate final reward amount with all multipliers
    function calculateFinalReward(
        address player,
        uint256 points,
        uint256 sessionMultiplier,
        bool isSealed
    ) public view returns (uint256 baseReward, uint256 totalMultiplier, uint256 finalReward) {
        baseReward = calculateBaseReward(points);
        totalMultiplier = calculateTotalMultiplier(player, sessionMultiplier, isSealed);
        finalReward = (baseReward * totalMultiplier) / 100;
    }
    
    /// @notice Claim rewards for a regular (non-sealed) session
    function claimRewards(
        uint256 points,
        uint256 sessionId,
        uint256 sessionMultiplier
    ) external nonReentrant returns (uint256 claimId) {
        if (points < 10) {
            revert InsufficientPoints();
        }
        
        (uint256 baseReward, uint256 totalMultiplier, uint256 finalReward) = calculateFinalReward(
            msg.sender,
            points,
            sessionMultiplier,
            false // Not sealed
        );
        
        if (usdcToken.balanceOf(address(this)) < finalReward) {
            revert InsufficientBalance();
        }
        
        claimId = nextClaimId++;
        
        claimRequests[claimId] = ClaimRequest({
            player: msg.sender,
            points: points,
            sessionId: sessionId,
            baseReward: baseReward,
            multiplier: totalMultiplier,
            isSealed: false,
            isClaimed: true,
            timestamp: block.timestamp
        });
        
        userClaimHistory[msg.sender].push(claimId);
        totalClaimed[msg.sender] += finalReward;
        totalDistributed += finalReward;
        
        // Transfer USDC to player
        usdcToken.transfer(msg.sender, finalReward);
        
        // Update user manager if registered
        if (userManager.isRegistered(msg.sender)) {
            userManager.updateClaimsAmount(msg.sender, finalReward);
        }
        
        emit ClaimMade(msg.sender, claimId, points, baseReward, totalMultiplier, finalReward);
        
        return claimId;
    }
    
    /// @notice Claim rewards for a sealed session (must wait for reveal)
    function claimSealedRewards(
        uint256 points,
        uint256 sessionId
    ) external nonReentrant returns (uint256 claimId) {
        if (points < 10) {
            revert InsufficientPoints();
        }
        
        // Check if this session has a sealed multiplier
        CryptoCatcherBlocklock.SealedSession memory sealedSession;
        try blocklockContract.getSealedSessionByGameId(sessionId) returns (CryptoCatcherBlocklock.SealedSession memory session) {
            sealedSession = session;
        } catch {
            revert("Session not found or not sealed");
        }
        
        if (sealedSession.player != msg.sender) {
            revert UnauthorizedClaim();
        }
        
        claimId = nextClaimId++;
        uint256 baseReward = calculateBaseReward(points);
        
        claimRequests[claimId] = ClaimRequest({
            player: msg.sender,
            points: points,
            sessionId: sessionId,
            baseReward: baseReward,
            multiplier: 0, // Will be set when revealed
            isSealed: true,
            isClaimed: false,
            timestamp: block.timestamp
        });
        
        userClaimHistory[msg.sender].push(claimId);
        
        emit SealedClaimPending(msg.sender, claimId, sessionId);
        
        return claimId;
    }
    
    /// @notice Process sealed claim once multiplier is revealed
    function processSealedClaim(uint256 claimId) external nonReentrant {
        ClaimRequest storage claim = claimRequests[claimId];
        
        if (claim.player == address(0)) {
            revert ClaimNotFound();
        }
        
        if (!claim.isSealed) {
            revert("Not a sealed claim");
        }
        
        if (claim.isClaimed) {
            revert ClaimAlreadyProcessed();
        }
        
        // Check if sealed session is revealed
        CryptoCatcherBlocklock.SealedSession memory sealedSession = blocklockContract.getSealedSessionByGameId(claim.sessionId);
        
        if (!sealedSession.isRevealed) {
            revert SealNotRevealed();
        }
        
        // Calculate final reward with revealed multiplier
        uint256 totalMultiplier = calculateTotalMultiplier(
            claim.player,
            sealedSession.revealedMultiplier,
            true // Is sealed
        );
        
        uint256 finalReward = (claim.baseReward * totalMultiplier) / 100;
        
        if (usdcToken.balanceOf(address(this)) < finalReward) {
            revert InsufficientBalance();
        }
        
        // Update claim
        claim.multiplier = totalMultiplier;
        claim.isClaimed = true;
        
        totalClaimed[claim.player] += finalReward;
        totalDistributed += finalReward;
        
        // Transfer USDC to player
        usdcToken.transfer(claim.player, finalReward);
        
        // Update user manager if registered
        if (userManager.isRegistered(claim.player)) {
            userManager.updateClaimsAmount(claim.player, finalReward);
        }
        
        emit ClaimMade(
            claim.player, 
            claimId, 
            claim.points, 
            claim.baseReward, 
            totalMultiplier, 
            finalReward
        );
        
        emit SealedClaimRevealed(claim.player, claimId, sealedSession.revealedMultiplier);
    }
    
    /// @notice Get claim details
    function getClaimRequest(uint256 claimId) external view returns (ClaimRequest memory) {
        if (claimRequests[claimId].player == address(0)) {
            revert ClaimNotFound();
        }
        return claimRequests[claimId];
    }
    
    /// @notice Get user's claim history
    function getUserClaimHistory(address user) external view returns (uint256[] memory) {
        return userClaimHistory[user];
    }
    
    /// @notice Check if sealed claim is ready to process
    function isSealedClaimReady(uint256 claimId) external view returns (bool) {
        ClaimRequest storage claim = claimRequests[claimId];
        
        if (!claim.isSealed || claim.isClaimed) {
            return false;
        }
        
        try blocklockContract.getSealedSessionByGameId(claim.sessionId) returns (CryptoCatcherBlocklock.SealedSession memory sealedSession) {
            return sealedSession.isRevealed;
        } catch {
            return false;
        }
    }
    
    /// @notice Get pending sealed claims for a user
    function getPendingSealedClaims(address user) external view returns (uint256[] memory pendingClaims) {
        uint256[] memory userClaims = userClaimHistory[user];
        uint256 pendingCount = 0;
        
        // First pass: count pending claims
        for (uint256 i = 0; i < userClaims.length; i++) {
            ClaimRequest storage claim = claimRequests[userClaims[i]];
            if (claim.isSealed && !claim.isClaimed) {
                pendingCount++;
            }
        }
        
        // Second pass: collect pending claims
        pendingClaims = new uint256[](pendingCount);
        uint256 index = 0;
        for (uint256 i = 0; i < userClaims.length; i++) {
            ClaimRequest storage claim = claimRequests[userClaims[i]];
            if (claim.isSealed && !claim.isClaimed) {
                pendingClaims[index] = userClaims[i];
                index++;
            }
        }
    }
    
    /// @notice Emergency function to withdraw USDC (owner only)
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(usdcToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        usdcToken.transfer(owner(), amount);
    }
    
    /// @notice Fund the contract with USDC
    function fundContract(uint256 amount) external {
        usdcToken.transferFrom(msg.sender, address(this), amount);
    }
    
    /// @notice Get contract USDC balance
    function getContractBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }
    
    /// @notice Update contract addresses (owner only)
    function updateContracts(
        address _usdcToken,
        address _blocklockContract,
        address _userManager
    ) external onlyOwner {
        if (_usdcToken != address(0)) {
            usdcToken = IERC20(_usdcToken);
        }
        if (_blocklockContract != address(0)) {
            blocklockContract = CryptoCatcherBlocklock(payable(_blocklockContract));
        }
        if (_userManager != address(0)) {
            userManager = UserManager(_userManager);
        }
    }
}
