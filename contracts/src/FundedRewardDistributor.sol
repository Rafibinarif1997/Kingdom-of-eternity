// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @notice Claims are possible only from tokens already funded into this contract.
contract FundedRewardDistributor is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable rewardToken;
    mapping(uint256 => bytes32) public merkleRoots;
    mapping(uint256 => mapping(address => bool)) public claimed;

    error ZeroAddress();
    error InvalidRoot();
    error AlreadyClaimed();
    error InvalidProof();
    error InsufficientFundedBalance();

    event SeasonRootSet(uint256 indexed season, bytes32 indexed root);
    event RewardClaimed(uint256 indexed season, address indexed account, uint256 amount);

    constructor(address initialOwner, IERC20 token) Ownable(initialOwner) {
        if (address(token) == address(0)) revert ZeroAddress();
        rewardToken = token;
    }

    function setSeasonRoot(uint256 season, bytes32 root) external onlyOwner {
        if (root == bytes32(0)) revert InvalidRoot();
        merkleRoots[season] = root;
        emit SeasonRootSet(season, root);
    }

    function claim(uint256 season, uint256 amount, bytes32[] calldata proof) external nonReentrant whenNotPaused {
        if (claimed[season][msg.sender]) revert AlreadyClaimed();
        bytes32 leaf = keccak256(abi.encodePacked(season, msg.sender, amount));
        if (!MerkleProof.verify(proof, merkleRoots[season], leaf)) revert InvalidProof();
        if (rewardToken.balanceOf(address(this)) < amount) revert InsufficientFundedBalance();
        claimed[season][msg.sender] = true;
        rewardToken.safeTransfer(msg.sender, amount);
        emit RewardClaimed(season, msg.sender, amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
