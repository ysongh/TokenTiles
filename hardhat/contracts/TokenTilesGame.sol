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
 * @dev Main game contract managing sessions and word validation with custom word lists
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
    uint256 public constant GAME_CREATION_FEE = 0 * 10**18; // 0 TILE token to create a game

    // Target word list structure for each game
    struct TargetWordList {
        string word3Letter;  // 3-letter target word
        string word4Letter;  // 4-letter target word
        string word5Letter;  // 5-letter target word
        string word6Letter;  // 6-letter target word
        address creator;     // Game creator
        uint256 createdAt;   // Creation timestamp
        bool active;         // Whether this word list is active
    }

    // Game session structure
    struct GameSession {
        uint256 sessionId;
        uint256 wordListId;  // Reference to the target word list
        bool active;
        uint256 playerCount;
        mapping(address => bool) players;
        mapping(address => uint256[]) playerTiles;
        mapping(address => string[]) submittedWords;
        mapping(address => uint256) playerSwapsUsed;
        mapping(address => uint256) playerScores; // Track scores per session
        uint256 startTime;
        uint256 endTime;
        address creator;     // Session creator
    }

    // Game info for list view (without mappings)
    struct GameInfo {
        uint256 sessionId;
        uint256 wordListId;
        bool active;
        uint256 playerCount;
        uint256 startTime;
        uint256 endTime;
        address creator;
        string gameName; // Derived from first word of word list
    }
    
    // Game and word list tracking
    uint256 private _sessionIds;
    uint256 private _wordListIds;
    
    // Storage for target word lists and sessions
    mapping(uint256 => TargetWordList) public targetWordLists;
    mapping(uint256 => GameSession) private gameSessions;
    
    // Array to track all game session IDs for listing
    uint256[] public allGameSessions;
    
    // Current active session tracking
    uint256 public currentActiveSessionId;
    bool public hasActiveSession;
    
    // Player statistics
    mapping(address => uint256) public playerTotalRewards;
    mapping(address => uint256) public playerWordsSubmitted;
    mapping(address => uint256) public playerTotalSwaps;
    mapping(address => uint256) public playerGamesCreated;
    
    // Leaderboard
    address[] public leaderboard;
    mapping(address => uint256) public leaderboardIndex;
    
    // Events
    event WordListCreated(uint256 indexed wordListId, address indexed creator, string word3, string word4, string word5, string word6);
    event SessionStarted(uint256 indexed sessionId, uint256 indexed wordListId, address indexed creator, uint256 timestamp);
    event SessionEnded(uint256 indexed sessionId, uint256 timestamp, address[] topPlayers);
    event PlayerJoined(uint256 indexed sessionId, address indexed player, uint256[] tiles);
    event WordSubmitted(uint256 indexed sessionId, address indexed player, string word, bool valid, uint256 points);
    event TokensRewarded(address indexed player, uint256 amount);
    event LeaderboardUpdated(address indexed player, uint256 newTotal);
    event TileSwapped(uint256 indexed sessionId, address indexed player, uint256 oldTile, uint256 newTile, uint256 swapsRemaining);

    constructor(
        address _tilesContract,
        address _rewardToken
    ) {
        tilesContract = TokenTilesERC1155(_tilesContract);
        rewardToken = TileTokenERC20(_rewardToken);
    }
    
    /**
     * @dev Create a new target word list and automatically start a game session
     * @param word3Letter 3-letter target word
     * @param word4Letter 4-letter target word  
     * @param word5Letter 5-letter target word
     * @param word6Letter 6-letter target word
     */
    function createWordList(
        string memory word3Letter,
        string memory word4Letter,
        string memory word5Letter,
        string memory word6Letter
    ) external whenNotPaused returns (uint256 sessionId) {
        require(bytes(word3Letter).length == 3, "3-letter word must be exactly 3 characters");
        require(bytes(word4Letter).length == 4, "4-letter word must be exactly 4 characters");
        require(bytes(word5Letter).length == 5, "5-letter word must be exactly 5 characters");
        require(bytes(word6Letter).length == 6, "6-letter word must be exactly 6 characters");
        
        // Charge creation fee if applicable
        if (GAME_CREATION_FEE > 0) {
            require(rewardToken.balanceOf(msg.sender) >= GAME_CREATION_FEE, "Insufficient tokens for creation fee");
            rewardToken.transferFrom(msg.sender, address(this), GAME_CREATION_FEE);
        }
        
        // Create word list
        _wordListIds++;
        uint256 newWordListId = _wordListIds;
        
        TargetWordList storage newWordList = targetWordLists[newWordListId];
        newWordList.word3Letter = word3Letter;
        newWordList.word4Letter = word4Letter;
        newWordList.word5Letter = word5Letter;
        newWordList.word6Letter = word6Letter;
        newWordList.creator = msg.sender;
        newWordList.createdAt = block.timestamp;
        newWordList.active = true;
        
        playerGamesCreated[msg.sender]++;
        
        emit WordListCreated(newWordListId, msg.sender, newWordList.word3Letter, newWordList.word4Letter, newWordList.word5Letter, newWordList.word6Letter);
        
        // Automatically create and start a game session
        _sessionIds++;
        uint256 newSessionId = _sessionIds;
        
        GameSession storage newSession = gameSessions[newSessionId];
        newSession.sessionId = newSessionId;
        newSession.wordListId = newWordListId;
        newSession.active = true;
        newSession.playerCount = 0;
        newSession.startTime = block.timestamp;
        newSession.endTime = 0;
        newSession.creator = msg.sender;
        
        // Add to list of all game sessions
        allGameSessions.push(newSessionId);
        
        emit SessionStarted(newSessionId, newWordListId, msg.sender, block.timestamp);
        
        return newSessionId;
    }

    
    /**
     * @dev Set the current active session (players can only join the active session)
     * @param sessionId ID of the session to make active
     */
    function setActiveSession(uint256 sessionId) external {
        require(sessionId > 0 && sessionId <= _sessionIds, "Invalid session ID");
        GameSession storage session = gameSessions[sessionId];
        require(session.active, "Session is not active");
        require(session.creator == msg.sender, "Only session creator can set as active");
        
        currentActiveSessionId = sessionId;
        hasActiveSession = true;
    }
    
    /**
     * @dev End a specific game session
     * @param sessionId ID of the session to end
     */
    function endSession(uint256 sessionId) external {
        require(sessionId > 0 && sessionId <= _sessionIds, "Invalid session ID");
        
        GameSession storage session = gameSessions[sessionId];
        require(session.active, "Session already ended");
        require(session.creator == msg.sender || block.timestamp >= session.startTime + 1 hours, "Only creator can end early, or anyone after 1 hour");
        
        session.active = false;
        session.endTime = block.timestamp;
        
        // If this was the current active session, clear it
        if (currentActiveSessionId == sessionId) {
            hasActiveSession = false;
            currentActiveSessionId = 0;
        }
        
        // Get top players for this session (simplified)
        address[] memory topPlayers = new address[](0); // Could implement session-specific leaderboard
        
        emit SessionEnded(sessionId, block.timestamp, topPlayers);
    }
    
    /**
     * @dev Join a specific game session
     * @param sessionId ID of the session to join
     */
    function joinGame(uint256 sessionId) external whenNotPaused nonReentrant {
        require(sessionId > 0 && sessionId <= _sessionIds, "Invalid session ID");
        
        GameSession storage session = gameSessions[sessionId];
        require(session.active, "Session not active");
        require(!session.players[msg.sender], "Player already joined");
        
        // Generate 7 random tiles for the player
        uint256[] memory playerTiles = _generateRandomTiles(msg.sender);
        
        // Mint tiles directly to the player
        uint256[] memory amounts = new uint256[](TILES_PER_PLAYER);
        for (uint256 i = 0; i < TILES_PER_PLAYER; i++) {
            amounts[i] = 1;
        }
        
        tilesContract.mintTiles(msg.sender, playerTiles, amounts, "");
        
        // Update session state
        session.players[msg.sender] = true;
        session.playerTiles[msg.sender] = playerTiles;
        session.playerScores[msg.sender] = 0;
        session.playerCount++;
        
        emit PlayerJoined(sessionId, msg.sender, playerTiles);
    }

    /**
     * @dev Swap a player's tile with a random new tile in a specific session
     * @param sessionId ID of the session
     * @param tileIndex Index of the tile to swap (0-6)
     */
    function swapTile(uint256 sessionId, uint256 tileIndex) external whenNotPaused nonReentrant {
        require(sessionId > 0 && sessionId <= _sessionIds, "Invalid session ID");
        
        GameSession storage session = gameSessions[sessionId];
        require(session.active, "Session not active");
        require(session.players[msg.sender], "Player not in session");
        require(tileIndex < TILES_PER_PLAYER, "Invalid tile index");
        require(session.playerSwapsUsed[msg.sender] < MAX_SWAPS_PER_SESSION, "Max swaps reached");
        
        uint256[] storage playerTiles = session.playerTiles[msg.sender];
        uint256 oldTile = playerTiles[tileIndex];
        
        // Generate a new random tile
        uint256 newTile = _generateSingleRandomTile(msg.sender, session.playerSwapsUsed[msg.sender]);
        
        // Check if player actually owns the old tile
        require(tilesContract.balanceOf(msg.sender, oldTile) >= 1, "Player doesn't own the tile");
        
        tilesContract.burnSingle(msg.sender, oldTile, 1);
        tilesContract.mintSingle(msg.sender, newTile, 1, "");
        
        // Update player's tile array
        playerTiles[tileIndex] = newTile;
        
        // Increment swap counters
        session.playerSwapsUsed[msg.sender]++;
        playerTotalSwaps[msg.sender]++;
        
        uint256 swapsRemaining = MAX_SWAPS_PER_SESSION - session.playerSwapsUsed[msg.sender];
        
        emit TileSwapped(sessionId, msg.sender, oldTile, newTile, swapsRemaining);
    }
    
    /**
     * @dev Submit a word for validation and rewards in a specific session
     * @param sessionId ID of the session
     * @param word The word to submit
     */
    function submitWord(uint256 sessionId, string memory word) external whenNotPaused nonReentrant {
        require(sessionId > 0 && sessionId <= _sessionIds, "Invalid session ID");
        
        GameSession storage session = gameSessions[sessionId];
        require(session.active, "Session not active");
        require(session.players[msg.sender], "Player not in session");

        TargetWordList storage wordList = targetWordLists[session.wordListId];
        
        // Check if the submitted word matches any target word
        bool isValid = false;
        uint256 points = 0;
        
        if (_compareStrings(word, wordList.word3Letter)) {
            isValid = true;
            points = BASE_REWARD + (3 * WORD_LENGTH_MULTIPLIER);
        } else if (_compareStrings(word, wordList.word4Letter)) {
            isValid = true;
            points = BASE_REWARD + (4 * WORD_LENGTH_MULTIPLIER);
        } else if (_compareStrings(word, wordList.word5Letter)) {
            isValid = true;
            points = BASE_REWARD + (5 * WORD_LENGTH_MULTIPLIER);
        } else if (_compareStrings(word, wordList.word6Letter)) {
            isValid = true;
            points = BASE_REWARD + (6 * WORD_LENGTH_MULTIPLIER);
        }
        
        if (isValid) {
            // Mint reward tokens
            rewardToken.mintReward(msg.sender, points);
            
            // Update player statistics
            playerTotalRewards[msg.sender] += points;
            playerWordsSubmitted[msg.sender]++;
            session.playerScores[msg.sender] += points;
            
            // Update leaderboard
            _updateLeaderboard(msg.sender);
            
            emit TokensRewarded(msg.sender, points);
        }
        
        // Store submitted word
        session.submittedWords[msg.sender].push(word);
        
        emit WordSubmitted(sessionId, msg.sender, word, isValid, points);
    }
    
    /**
     * @dev Get a list of all games with their basic information
     * @return Array of GameInfo structs
     */
    function getAllGames() external view returns (GameInfo[] memory) {
        GameInfo[] memory games = new GameInfo[](allGameSessions.length);
        
        for (uint256 i = 0; i < allGameSessions.length; i++) {
            uint256 sessionId = allGameSessions[i];
            GameSession storage session = gameSessions[sessionId];
            TargetWordList storage wordList = targetWordLists[session.wordListId];
            
            games[i] = GameInfo({
                sessionId: session.sessionId,
                wordListId: session.wordListId,
                active: session.active,
                playerCount: session.playerCount,
                startTime: session.startTime,
                endTime: session.endTime,
                creator: session.creator,
                gameName: wordList.word3Letter // Use first word as game name
            });
        }
        
        return games;
    }
    
    /**
     * @dev Get total number of games created
     * @return Total number of game sessions
     */
    function getTotalGamesCount() external view returns (uint256) {
        return allGameSessions.length;
    }
    
    /**
     * @dev Compare two strings for equality
     */
    function _compareStrings(string memory a, string memory b) private pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
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
     * @dev Get target word list details
     */
    function getWordList(uint256 wordListId) external view returns (
        string memory word3Letter,
        string memory word4Letter,
        string memory word5Letter,
        string memory word6Letter,
        address creator,
        uint256 createdAt,
        bool active
    ) {
        TargetWordList storage wordList = targetWordLists[wordListId];
        return (
            wordList.word3Letter,
            wordList.word4Letter,
            wordList.word5Letter,
            wordList.word6Letter,
            wordList.creator,
            wordList.createdAt,
            wordList.active
        );
    }
    
    /**
     * @dev Get specific session details
     * @param sessionId ID of the session
     */
    function getSession(uint256 sessionId) external view returns (
        uint256 sessionIdRet,
        uint256 wordListId,
        bool active,
        uint256 playerCount,
        uint256 startTime,
        uint256 endTime,
        address creator
    ) {
        require(sessionId > 0 && sessionId <= _sessionIds, "Invalid session ID");
        
        GameSession storage session = gameSessions[sessionId];
        return (
            session.sessionId,
            session.wordListId,
            session.active,
            session.playerCount,
            session.startTime,
            session.endTime,
            session.creator
        );
    }
    

    /**
     * @dev Get player's remaining swaps in a specific session
     * @param sessionId ID of the session
     * @param player Player address
     * @return Number of swaps remaining
     */
    function getPlayerSwapsRemaining(uint256 sessionId, address player) external view returns (uint256) {
        require(sessionId > 0 && sessionId <= _sessionIds, "Invalid session ID");
        GameSession storage session = gameSessions[sessionId];
        require(session.players[player], "Player not in session");
        return MAX_SWAPS_PER_SESSION - session.playerSwapsUsed[player];
    }

    /**
     * @dev Get player's tiles in a specific session
     * @param sessionId ID of the session
     * @param player Player address
     * @return Array of tile IDs
     */
    function getPlayerTiles(uint256 sessionId, address player) external view returns (uint256[] memory) {
        require(sessionId > 0 && sessionId <= _sessionIds, "Invalid session ID");
        GameSession storage session = gameSessions[sessionId];
        require(session.players[player], "Player not in session");
        return session.playerTiles[player];
    }

    /**
     * @dev Get player's submitted words in a specific session
     * @param sessionId ID of the session
     * @param player Player address
     * @return Array of submitted words
     */
    function getPlayerWords(uint256 sessionId, address player) external view returns (string[] memory) {
        require(sessionId > 0 && sessionId <= _sessionIds, "Invalid session ID");
        GameSession storage session = gameSessions[sessionId];
        require(session.players[player], "Player not in session");
        return session.submittedWords[player];
    }

    /**
     * @dev Get player's submitted words in current session (backward compatibility)
     * @param player Player address
     * @return Array of submitted words
     */
    function getPlayerWords(address player) external view returns (string[] memory) {
        require(hasActiveSession, "No active session");
        GameSession storage session = gameSessions[currentActiveSessionId];
        require(session.players[player], "Player not in current session");
        return session.submittedWords[player];
    }
    
    /**
     * @dev Get player's score in a specific session
     * @param sessionId ID of the session
     * @param player Player address
     * @return Current session score
     */
    function getPlayerSessionScore(uint256 sessionId, address player) external view returns (uint256) {
        require(sessionId > 0 && sessionId <= _sessionIds, "Invalid session ID");
        GameSession storage session = gameSessions[sessionId];
        require(session.players[player], "Player not in session");
        return session.playerScores[player];
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
