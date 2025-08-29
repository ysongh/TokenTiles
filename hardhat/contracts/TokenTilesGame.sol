// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./TokenTilesERC1155.sol";
import "./TileTokenERC20.sol";
import "./RandomNumber.sol";

/**
 * @title TokenTilesGame
 * @dev Main game contract managing sessions and word validation with custom word lists
 */
contract TokenTilesGame is ReentrancyGuard {    
    // Contract references
    TokenTilesERC1155 public immutable tilesContract;
    TileTokenERC20 public immutable rewardToken;
    RandomNumber public immutable randomNumber;
    
    // Game constants
    uint256 public constant TILES_PER_PLAYER = 7;
    uint256 public constant BASE_REWARD = 10 * 10**18; // 10 TILE tokens
    uint256 public constant WORD_LENGTH_MULTIPLIER = 2 * 10**18; // 2 TILE per letter
    uint256 public constant MAX_SWAPS_PER_SESSION = 100;
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
        bool word3LetterClaimed;
        bool word4LetterClaimed;
        bool word5LetterClaimed;
        bool word6LetterClaimed;
        address word3LetterClaimedBy;
        address word4LetterClaimedBy;
        address word5LetterClaimedBy;
        address word6LetterClaimedBy;
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
    
    // Events
    event WordListCreated(uint256 indexed wordListId, address indexed creator, string word3, string word4, string word5, string word6);
    event SessionStarted(uint256 indexed sessionId, uint256 indexed wordListId, address indexed creator, uint256 timestamp);
    event SessionEnded(uint256 indexed sessionId, uint256 timestamp, address[] topPlayers);
    event PlayerJoined(uint256 indexed sessionId, address indexed player, uint256[] tiles);
    event WordSubmitted(uint256 indexed sessionId, address indexed player, string word, bool valid, uint256 points);
    event TokensRewarded(address indexed player, uint256 amount);
    event TileSwapped(uint256 indexed sessionId, address indexed player, uint256 oldTile, uint256 newTile, uint256 swapsRemaining);
    event SessionCompleted(uint256 indexed sessionId, uint256 timestamp);
    event TargetWordClaimed(
        uint256 indexed sessionId, 
        address indexed player, 
        string word, 
        string wordType, 
        uint256 points
    );
    event WordAlreadyClaimed(
        uint256 indexed sessionId, 
        address indexed player, 
        string word, 
        address claimedBy
    );

    constructor(
        address _tilesContract,
        address _rewardToken,
        address _randomNumber
    ){
        tilesContract = TokenTilesERC1155(_tilesContract);
        rewardToken = TileTokenERC20(_rewardToken);
        randomNumber = RandomNumber(_randomNumber);
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
    ) external returns (uint256 sessionId) {
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
     * @dev Join a specific game session
     * @param sessionId ID of the session to join
     */
    function joinGame(uint256 sessionId) external nonReentrant {
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
    function swapTile(uint256 sessionId, uint256 tileIndex) external nonReentrant {
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
        
        uint256 swapsRemaining = MAX_SWAPS_PER_SESSION - session.playerSwapsUsed[msg.sender];
        
        emit TileSwapped(sessionId, msg.sender, oldTile, newTile, swapsRemaining);
    }
    
    /**
    * @dev Submit a word for validation and rewards in a specific session
    * @param sessionId ID of the session
    * @param word The word to submit
    */
    function submitWord(uint256 sessionId, string memory word) external nonReentrant {
        require(sessionId > 0 && sessionId <= _sessionIds, "Invalid session ID");
        
        GameSession storage session = gameSessions[sessionId];
        require(session.active, "Session not active");
        require(session.players[msg.sender], "Player not in session");

        // Convert word to uppercase for consistent comparison
        string memory upperWord = _toUpperCase(word);
        
        TargetWordList storage wordList = targetWordLists[session.wordListId];
        
        // Check if the submitted word matches any target word and if it's still available
        bool isTargetWord = false;
        bool isAvailable = false;
        uint256 points = 0;
        string memory targetWordType = "";
        
        if (_compareStrings(upperWord, _toUpperCase(wordList.word3Letter))) {
            isTargetWord = true;
            isAvailable = !session.word3LetterClaimed;
            points = BASE_REWARD + (3 * WORD_LENGTH_MULTIPLIER);
            targetWordType = "3-letter";
        } else if (_compareStrings(upperWord, _toUpperCase(wordList.word4Letter))) {
            isTargetWord = true;
            isAvailable = !session.word4LetterClaimed;
            points = BASE_REWARD + (4 * WORD_LENGTH_MULTIPLIER);
            targetWordType = "4-letter";
        } else if (_compareStrings(upperWord, _toUpperCase(wordList.word5Letter))) {
            isTargetWord = true;
            isAvailable = !session.word5LetterClaimed;
            points = BASE_REWARD + (5 * WORD_LENGTH_MULTIPLIER);
            targetWordType = "5-letter";
        } else if (_compareStrings(upperWord, _toUpperCase(wordList.word6Letter))) {
            isTargetWord = true;
            isAvailable = !session.word6LetterClaimed;
            points = BASE_REWARD + (6 * WORD_LENGTH_MULTIPLIER);
            targetWordType = "6-letter";
        }
        
        // Check if it's a target word, still available, and player can form it
        bool isValid = false;
        if (isTargetWord && isAvailable) {
            isValid = _canPlayerFormWord(sessionId, msg.sender, upperWord);
            
            if (isValid) {
                // Mark the specific target word as claimed
                if (_compareStrings(upperWord, _toUpperCase(wordList.word3Letter))) {
                    session.word3LetterClaimed = true;
                    session.word3LetterClaimedBy = msg.sender;
                } else if (_compareStrings(upperWord, _toUpperCase(wordList.word4Letter))) {
                    session.word4LetterClaimed = true;
                    session.word4LetterClaimedBy = msg.sender;
                } else if (_compareStrings(upperWord, _toUpperCase(wordList.word5Letter))) {
                    session.word5LetterClaimed = true;
                    session.word5LetterClaimedBy = msg.sender;
                } else if (_compareStrings(upperWord, _toUpperCase(wordList.word6Letter))) {
                    session.word6LetterClaimed = true;
                    session.word6LetterClaimedBy = msg.sender;
                }
                
                // Mint reward tokens
                rewardToken.mintReward(msg.sender, points);
                
                emit TokensRewarded(msg.sender, points);
                emit TargetWordClaimed(sessionId, msg.sender, upperWord, targetWordType, points);
            }
        }
        
        // Store submitted word (for history tracking)
        session.submittedWords[msg.sender].push(upperWord);
        
        // Emit with additional info about availability
        emit WordSubmitted(sessionId, msg.sender, upperWord, isValid, points);
        
        // If it was a target word but already claimed, emit special event
        if (isTargetWord && !isAvailable) {
            address claimedBy = _getWordClaimedBy(sessionId, upperWord, wordList);
            emit WordAlreadyClaimed(sessionId, msg.sender, upperWord, claimedBy);
        }
    }

    /**
    * @dev Check if a player can form a word using their tiles
    * @param sessionId ID of the session
    * @param player Player address
    * @param word Word to check
    * @return True if player can form the word
    */
    function _canPlayerFormWord(uint256 sessionId, address player, string memory word) private view returns (bool) {
        GameSession storage session = gameSessions[sessionId];
        uint256[] memory playerTiles = session.playerTiles[player];
        
        // Convert word to uppercase bytes for processing
        bytes memory wordBytes = bytes(_toUpperCase(word));
        
        // Count required letters
        uint256[26] memory requiredLetters; // A=0, B=1, ..., Z=25
        for (uint256 i = 0; i < wordBytes.length; i++) {
            uint8 letterIndex = uint8(wordBytes[i]) - 65; // Convert ASCII to 0-25 (A=65 in ASCII)
            require(letterIndex < 26, "Invalid character in word");
            requiredLetters[letterIndex]++;
        }
        
        // Count available letters from player's tiles
        uint256[26] memory availableLetters;
        for (uint256 i = 0; i < playerTiles.length; i++) {
            require(playerTiles[i] < 26, "Invalid tile ID");
            availableLetters[playerTiles[i]]++;
        }
        
        // Check if player has enough of each required letter
        for (uint256 i = 0; i < 26; i++) {
            if (requiredLetters[i] > availableLetters[i]) {
                return false;
            }
        }
        
        return true;
    }

    /**
    * @dev Convert string to uppercase
    * @param str Input string
    * @return Uppercase string
    */
    function _toUpperCase(string memory str) private pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bUpper = new bytes(bStr.length);
        
        for (uint256 i = 0; i < bStr.length; i++) {
            // If lowercase letter, convert to uppercase
            if (uint8(bStr[i]) >= 97 && uint8(bStr[i]) <= 122) {
                bUpper[i] = bytes1(uint8(bStr[i]) - 32);
            } else {
                bUpper[i] = bStr[i];
            }
        }
        
        return string(bUpper);
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
                    i,
                    randomNumber.randomness
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

    function generateWithDirectFunding(uint32 callbackGasLimit) external payable returns (uint256, uint256) {
      return randomNumber.generateWithDirectFunding{value: msg.value}(callbackGasLimit);
    }

    // Helper function to get who claimed a specific word
    function _getWordClaimedBy(uint256 sessionId, string memory word, TargetWordList storage wordList) private view returns (address) {
        GameSession storage session = gameSessions[sessionId];
        
        if (_compareStrings(word, _toUpperCase(wordList.word3Letter))) {
            return session.word3LetterClaimedBy;
        } else if (_compareStrings(word, _toUpperCase(wordList.word4Letter))) {
            return session.word4LetterClaimedBy;
        } else if (_compareStrings(word, _toUpperCase(wordList.word5Letter))) {
            return session.word5LetterClaimedBy;
        } else if (_compareStrings(word, _toUpperCase(wordList.word6Letter))) {
            return session.word6LetterClaimedBy;
        }
        
        return address(0);
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
        address creator,
        bool word3LetterClaimed,
        bool word4LetterClaimed,
        bool word5LetterClaimed,
        bool word6LetterClaimed
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
            session.creator,
            session.word3LetterClaimed,
            session.word4LetterClaimed,
            session.word5LetterClaimed,
            session.word6LetterClaimed
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
