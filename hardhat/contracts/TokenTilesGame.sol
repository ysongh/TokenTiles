// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./TokenTilesERC1155.sol";
import "./TileTokenERC20.sol";

/**
 * @title TokenTilesGame
 * @dev Main game contract managing sessions and word validation
 */
contract TokenTilesGame is Pausable, ReentrancyGuard {    
    // Contract references
    TokenTilesERC1155 public immutable tilesContract;
    TileTokenERC20 public immutable rewardToken;
    
    // Game constants
    uint256 public constant TILES_PER_PLAYER = 7;
    uint256 public constant BASE_REWARD = 10 * 10**18; // 10 TILE tokens
    uint256 public constant WORD_LENGTH_MULTIPLIER = 2 * 10**18; // 2 TILE per letter
    uint256 public constant MAX_SWAPS_PER_SESSION = 3;

    // Game session structure
    struct GameSession {
        uint256 sessionId;
        bool active;
        uint256 playerCount;
        mapping(address => bool) players;
        mapping(address => uint256[]) playerTiles;
        mapping(address => string[]) submittedWords;
        mapping(address => uint256) playerSwapsUsed;
        uint256 startTime;
        uint256 endTime;
    }
    
    // Current active session
    uint256 private _sessionIds;
    GameSession public currentSession;
    bool public hasActiveSession;
    
    // Player statistics
    mapping(address => uint256) public playerTotalRewards;
    mapping(address => uint256) public playerWordsSubmitted;
    mapping(address => uint256) public playerTotalSwaps;
    
    // Leaderboard
    address[] public leaderboard;
    mapping(address => uint256) public leaderboardIndex;
    
    // Simple word validation (in production, use Chainlink oracle)
    mapping(string => bool) public validWords;
    
    // Events
    event SessionStarted(uint256 indexed sessionId, uint256 timestamp);
    event SessionEnded(uint256 indexed sessionId, uint256 timestamp);
    event PlayerJoined(uint256 indexed sessionId, address indexed player, uint256[] tiles);
    event WordSubmitted(uint256 indexed sessionId, address indexed player, string word, bool valid);
    event TokensRewarded(address indexed player, uint256 amount);
    event LeaderboardUpdated(address indexed player, uint256 newTotal);
    event TileSwapped(uint256 indexed sessionId, address indexed player, uint256 oldTile, uint256 newTile, uint256 swapsRemaining);

    constructor(
        address _tilesContract,
        address _rewardToken
    ) {
        tilesContract = TokenTilesERC1155(_tilesContract);
        rewardToken = TileTokenERC20(_rewardToken);
        _initializeValidWords();
    }
    
    /**
     * @dev Initialize some valid words for testing
     */
    function _initializeValidWords() private {
        string[20] memory words = [
            "THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HER",
            "WAS", "ONE", "OUR", "HAD", "BY", "HOT", "WORD", "WHAT", "SOME", "TIME"
        ];
        
        for (uint256 i = 0; i < words.length; i++) {
            validWords[words[i]] = true;
        }
    }
    
    /**
     * @dev Start a new game session
     */
    function startNewSession() external whenNotPaused {
        require(!hasActiveSession, "Session already active");
        
        _sessionIds++;
        uint256 newSessionId = _sessionIds;
        
        currentSession.sessionId = newSessionId;
        currentSession.active = true;
        currentSession.playerCount = 0;
        currentSession.startTime = block.timestamp;
        currentSession.endTime = 0;
        hasActiveSession = true;
        
        emit SessionStarted(newSessionId, block.timestamp);
    }
    
    /**
     * @dev End the current game session
     */
    function endCurrentSession() external {
        require(hasActiveSession, "No active session");
        
        currentSession.active = false;
        currentSession.endTime = block.timestamp;
        hasActiveSession = false;
        
        emit SessionEnded(currentSession.sessionId, block.timestamp);
    }
    
    /**
     * @dev Join the current game session
     */
   function joinGame() external whenNotPaused nonReentrant {
        require(hasActiveSession, "No active session");
        require(currentSession.active, "Session not active");
        require(!currentSession.players[msg.sender], "Player already joined");
        
        // Generate 7 random tiles for the player
        uint256[] memory playerTiles = _generateRandomTiles(msg.sender);
        
        // Mint tiles directly to the player instead of transferring
        uint256[] memory amounts = new uint256[](TILES_PER_PLAYER);
        for (uint256 i = 0; i < TILES_PER_PLAYER; i++) {
            amounts[i] = 1;
        }
        
        // Mint the tiles to the player
        tilesContract.mintTiles(msg.sender, playerTiles, amounts, "");
        
        // Update session state
        currentSession.players[msg.sender] = true;
        currentSession.playerTiles[msg.sender] = playerTiles;
        currentSession.playerCount++;
        
        emit PlayerJoined(currentSession.sessionId, msg.sender, playerTiles);
    }

    /**
     * @dev Swap a player's tile with a random new tile
     * @param tileIndex Index of the tile to swap (0-6)
     */
    function swapTile(uint256 tileIndex) external whenNotPaused nonReentrant {
        require(hasActiveSession, "No active session");
        require(currentSession.active, "Session not active");
        require(currentSession.players[msg.sender], "Player not in session");
        require(tileIndex < TILES_PER_PLAYER, "Invalid tile index");
        require(currentSession.playerSwapsUsed[msg.sender] < MAX_SWAPS_PER_SESSION, "Max swaps reached");
        
        uint256[] storage playerTiles = currentSession.playerTiles[msg.sender];
        uint256 oldTile = playerTiles[tileIndex];
        
        // Generate a new random tile
        uint256 newTile = _generateSingleRandomTile(msg.sender, currentSession.playerSwapsUsed[msg.sender]);
        
        // Transfer old tile back to contract
        tilesContract.safeTransferFrom(
            msg.sender,
            address(this),
            oldTile,
            1,
            ""
        );
        
        // Transfer new tile to player
        tilesContract.safeTransferFrom(
            address(this),
            msg.sender,
            newTile,
            1,
            ""
        );
        
        // Update player's tile array
        playerTiles[tileIndex] = newTile;
        
        // Increment swap counters
        currentSession.playerSwapsUsed[msg.sender]++;
        playerTotalSwaps[msg.sender]++;
        
        uint256 swapsRemaining = MAX_SWAPS_PER_SESSION - currentSession.playerSwapsUsed[msg.sender];
        
        emit TileSwapped(currentSession.sessionId, msg.sender, oldTile, newTile, swapsRemaining);
    }
    
    /**
     * @dev Submit a word for validation and rewards
     * @param word The word to submit
     */
    function submitWord(string memory word) external whenNotPaused nonReentrant {
        require(hasActiveSession, "No active session");
        require(currentSession.active, "Session not active");
        require(currentSession.players[msg.sender], "Player not in session");
        
        bool isValid = validWords[word];
        
        if (isValid) {
            // Calculate reward based on word length
            uint256 wordLength = bytes(word).length;
            uint256 reward = BASE_REWARD + (wordLength * WORD_LENGTH_MULTIPLIER);
            
            // Mint reward tokens
            rewardToken.mintReward(msg.sender, reward);
            
            // Update player statistics
            playerTotalRewards[msg.sender] += reward;
            playerWordsSubmitted[msg.sender]++;
            
            // Update leaderboard
            _updateLeaderboard(msg.sender);
            
            emit TokensRewarded(msg.sender, reward);
        }
        
        // Store submitted word
        currentSession.submittedWords[msg.sender].push(word);
        
        emit WordSubmitted(currentSession.sessionId, msg.sender, word, isValid);
    }
    
    /**
     * @dev Generate random tiles for a player (simplified randomness)
     * @param player Player address for entropy
     * @return Array of tile IDs
     */
    function _generateRandomTiles(address player) private view returns (uint256[] memory) {
        uint256[] memory tiles = new uint256[](TILES_PER_PLAYER);
        
        for (uint256 i = 0; i < TILES_PER_PLAYER; i++) {
            // Simple pseudo-random generation (use Chainlink VRF in production)
            uint256 randomValue = uint256(
                keccak256(abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    player,
                    i
                ))
            );
            tiles[i] = randomValue % 26; // 0-25 for A-Z
        }
        
        return tiles;
    }

    /**
     * @dev Generate a single random tile for swapping
     * @param player Player address for entropy
     * @param nonce Additional entropy source
     * @return Single tile ID
     */
    function _generateSingleRandomTile(address player, uint256 nonce) private view returns (uint256) {
        uint256 randomValue = uint256(
            keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                player,
                nonce,
                gasleft()
            ))
        );
        return randomValue % 26; // 0-25 for A-Z
    }
    
    /**
     * @dev Update leaderboard with player's new total
     * @param player Player address
     */
    function _updateLeaderboard(address player) private {
        uint256 playerTotal = playerTotalRewards[player];
        
        // If player not on leaderboard, add them
        if (leaderboardIndex[player] == 0 && leaderboard.length == 0 || 
            (leaderboard.length > 0 && leaderboard[leaderboardIndex[player]] != player)) {
            leaderboard.push(player);
            leaderboardIndex[player] = leaderboard.length - 1;
        }
        
        // Simple bubble sort for top positions (optimize for production)
        uint256 currentIndex = leaderboardIndex[player];
        
        while (currentIndex > 0 && 
               playerTotalRewards[leaderboard[currentIndex - 1]] < playerTotal) {
            // Swap positions
            address temp = leaderboard[currentIndex - 1];
            leaderboard[currentIndex - 1] = leaderboard[currentIndex];
            leaderboard[currentIndex] = temp;
            
            // Update indices
            leaderboardIndex[temp] = currentIndex;
            leaderboardIndex[player] = currentIndex - 1;
            
            currentIndex--;
        }
        
        emit LeaderboardUpdated(player, playerTotal);
    }
    
    /**
     * @dev Add valid words (owner only)
     * @param words Array of valid words to add
     */
    function addValidWords(string[] memory words) external {
        for (uint256 i = 0; i < words.length; i++) {
            validWords[words[i]] = true;
        }
    }
    
    /**
     * @dev Get player's tiles in current session
     * @param player Player address
     * @return Array of tile IDs
     */
    function getPlayerTiles(address player) external view returns (uint256[] memory) {
        require(currentSession.players[player], "Player not in current session");
        return currentSession.playerTiles[player];
    }
    
    /**
     * @dev Get player's submitted words in current session
     * @param player Player address
     * @return Array of submitted words
     */
    function getPlayerWords(address player) external view returns (string[] memory) {
        require(currentSession.players[player], "Player not in current session");
        return currentSession.submittedWords[player];
    }
    
    /**
     * @dev Get leaderboard (top 10)
     * @return Array of top player addresses and their rewards
     */
    function getLeaderboard() external view returns (address[] memory, uint256[] memory) {
        uint256 length = leaderboard.length > 10 ? 10 : leaderboard.length;
        address[] memory topPlayers = new address[](length);
        uint256[] memory topRewards = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            topPlayers[i] = leaderboard[i];
            topRewards[i] = playerTotalRewards[leaderboard[i]];
        }
        
        return (topPlayers, topRewards);
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
    
    /**
     * @dev Handle ERC1155 token receipts
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
    
    /**
     * @dev Handle ERC1155 batch token receipts
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }
}
