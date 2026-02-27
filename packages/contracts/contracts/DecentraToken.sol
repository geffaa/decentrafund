// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title DecentraToken (DFUND)
 * @notice Governance token for DecentraFund platform
 * @dev ERC-20 token minted proportional to contributions for voting power
 */
contract DecentraToken is ERC20, ERC20Burnable, Ownable {
    // ============ State Variables ============
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18; // 100M tokens
    uint256 public constant TOKENS_PER_ETH = 1000; // 1 ETH = 1000 DFUND

    mapping(address => bool) public authorizedMinters;

    // ============ Events ============
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event TokensMinted(address indexed to, uint256 amount, string reason);

    // ============ Modifiers ============
    modifier onlyAuthorizedMinter() {
        require(
            authorizedMinters[msg.sender] || msg.sender == owner(),
            "Not authorized to mint"
        );
        _;
    }

    // ============ Constructor ============
    constructor() ERC20("DecentraFund Token", "DFUND") Ownable(msg.sender) {
        // Mint initial supply for platform treasury (10%)
        _mint(msg.sender, (MAX_SUPPLY * 10) / 100);
    }

    // ============ Core Functions ============

    /**
     * @notice Mint tokens proportional to ETH contribution
     * @param _to Address to mint to
     * @param _ethAmount ETH amount contributed
     */
    function mintForContribution(address _to, uint256 _ethAmount)
        external
        onlyAuthorizedMinter
    {
        uint256 tokensToMint = (_ethAmount * TOKENS_PER_ETH);
        require(totalSupply() + tokensToMint <= MAX_SUPPLY, "Max supply exceeded");

        _mint(_to, tokensToMint);
        emit TokensMinted(_to, tokensToMint, "contribution");
    }

    /**
     * @notice Mint reward tokens (for platform activities)
     * @param _to Address to mint to
     * @param _amount Amount of tokens to mint
     */
    function mintReward(address _to, uint256 _amount) external onlyAuthorizedMinter {
        require(totalSupply() + _amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(_to, _amount);
        emit TokensMinted(_to, _amount, "reward");
    }

    // ============ Admin Functions ============

    /**
     * @notice Authorize a contract to mint tokens (e.g., CampaignFactory)
     */
    function authorizeMinter(address _minter) external onlyOwner {
        authorizedMinters[_minter] = true;
        emit MinterAuthorized(_minter);
    }

    /**
     * @notice Revoke minting authorization
     */
    function revokeMinter(address _minter) external onlyOwner {
        authorizedMinters[_minter] = false;
        emit MinterRevoked(_minter);
    }
}
