// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TileTokenERC20
 * @dev ERC20 reward token for TokenTiles game
 */
contract TileTokenERC20 is ERC20, Pausable {
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    
    // Game contract that can mint rewards
    address public gameContract;
    
    event GameContractSet(address indexed gameContract);
    event RewardsMinted(address indexed player, uint256 amount);
    
    constructor() ERC20("TileToken", "TILE") {
        // Mint initial supply to owner
        _mint(msg.sender, 100000000 * 10**18); // 100 million initial supply
    }
    
    /**
     * @dev Set the game contract address
     * @param _gameContract Address of the game contract
     */
    function setGameContract(address _gameContract) external {
        require(gameContract == address(0), "Game contract already set");
        gameContract = _gameContract;
        emit GameContractSet(_gameContract);
    }
    
    /**
     * @dev Mint reward tokens (only callable by game contract)
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mintReward(address to, uint256 amount) external {
        require(msg.sender == gameContract, "Only game contract can mint rewards");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        
        _mint(to, amount);
        emit RewardsMinted(to, amount);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external {
        _unpause();
    }
}
