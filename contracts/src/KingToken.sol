// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Capped utility token. Supply allocation and public distribution remain governance decisions.
contract KingToken is ERC20Capped, ERC20Pausable, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 ether;

    error InvalidRecipient();

    constructor(address initialOwner)
        ERC20("Kingdoms of Eternity", "KING")
        ERC20Capped(MAX_SUPPLY)
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidRecipient();
        _mint(to, amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function _update(address from, address to, uint256 value)
        internal override(ERC20, ERC20Capped, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
