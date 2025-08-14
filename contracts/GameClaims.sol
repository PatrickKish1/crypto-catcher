// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameClaims is Ownable {
    IERC20 public usdcToken;
    
    event ClaimMade(address indexed user, uint256 points, uint256 amount);
    
    constructor(address _usdcToken) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
    }
    
    function claimRewards(uint256 points) external {
        uint256 amount = calculateReward(points);
        require(usdcToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        
        usdcToken.transfer(msg.sender, amount);
        emit ClaimMade(msg.sender, points, amount);
    }
    
    function calculateReward(uint256 points) public pure returns (uint256) {
        if (points < 10) return 0;
        return (points * 1e4) / 100; // 0.1 USDC per 10 points
    }
}