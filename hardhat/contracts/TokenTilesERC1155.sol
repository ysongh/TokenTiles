// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title TokenTilesERC1155
 * @dev ERC1155 contract for letter tiles (A-Z)
 */
contract TokenTilesERC1155 is ERC1155, Ownable, Pausable {
    using Counters for Counters.Counter;
    
    // Tile IDs: A=0, B=1, ..., Z=25
    uint256 public constant TOTAL_LETTERS = 26;
    
    // Mapping from letter to tile ID
    mapping(string => uint256) public letterToId;
    mapping(uint256 => string) public idToLetter;
    
    // Events
    event TilesMinted(address indexed to, uint256[] ids, uint256[] amounts);
    event TilesDistributed(address indexed player, uint256[] tiles);
    
    constructor() ERC1155("https://api.tokentiles.game/metadata/{id}.json") {
        _initializeLetters();
    }
    
    /**
     * @dev Initialize letter mappings
     */
    function _initializeLetters() private {
        string[26] memory letters = [
            "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
            "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
        ];
        
        for (uint256 i = 0; i < TOTAL_LETTERS; i++) {
            letterToId[letters[i]] = i;
            idToLetter[i] = letters[i];
        }
    }
    
    /**
     * @dev Mint initial tile supplies to owner
     * @param amounts Array of amounts for each letter (A-Z)
     */
    function mintInitialSupply(uint256[] memory amounts) external onlyOwner {
        require(amounts.length == TOTAL_LETTERS, "Invalid amounts array length");
        
        uint256[] memory ids = new uint256[](TOTAL_LETTERS);
        for (uint256 i = 0; i < TOTAL_LETTERS; i++) {
            ids[i] = i;
        }
        
        _mintBatch(owner(), ids, amounts, "");
        emit TilesMinted(owner(), ids, amounts);
    }
    
    /**
     * @dev Mint specific tiles to an address
     * @param to Address to mint to
     * @param ids Array of tile IDs
     * @param amounts Array of amounts
     */
    function mintTiles(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external onlyOwner {
        _mintBatch(to, ids, amounts, "");
        emit TilesMinted(to, ids, amounts);
    }
    
    /**
     * @dev Get letter by tile ID
     * @param id Tile ID
     * @return Letter string
     */
    function getLetter(uint256 id) external view returns (string memory) {
        require(id < TOTAL_LETTERS, "Invalid tile ID");
        return idToLetter[id];
    }
    
    /**
     * @dev Get tile ID by letter
     * @param letter Letter string
     * @return Tile ID
     */
    function getTileId(string memory letter) external view returns (uint256) {
        uint256 id = letterToId[letter];
        require(id < TOTAL_LETTERS || keccak256(bytes(letter)) == keccak256(bytes("A")), "Invalid letter");
        return id;
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override transfer functions to include pause check
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
