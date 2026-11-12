// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @notice Capped access pass. Public paid mint is intentionally not enabled in this MVP.
contract KingdomAccessNFT is ERC721URIStorage, Ownable, Pausable {
    uint256 public constant MAX_SUPPLY = 5_000;
    uint256 public totalMinted;
    string private baseTokenURI;

    error MaxSupplyReached();
    error InvalidRecipient();
    error EmptyBaseURI();

    event AccessPassMinted(address indexed recipient, uint256 indexed tokenId);

    constructor(address initialOwner, string memory initialBaseURI)
        ERC721("Kingdoms of Eternity Access", "KOE")
        Ownable(initialOwner)
    {
        if (bytes(initialBaseURI).length == 0) revert EmptyBaseURI();
        baseTokenURI = initialBaseURI;
    }

    function mintAccessPass(address recipient) external onlyOwner whenNotPaused returns (uint256 tokenId) {
        if (recipient == address(0)) revert InvalidRecipient();
        if (totalMinted >= MAX_SUPPLY) revert MaxSupplyReached();
        tokenId = ++totalMinted;
        _safeMint(recipient, tokenId);
        emit AccessPassMinted(recipient, tokenId);
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        if (bytes(newBaseURI).length == 0) revert EmptyBaseURI();
        baseTokenURI = newBaseURI;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function _baseURI() internal view override returns (string memory) { return baseTokenURI; }

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal override whenNotPaused returns (address)
    {
        return super._update(to, tokenId, auth);
    }
}
