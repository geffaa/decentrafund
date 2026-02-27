// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Campaign.sol";

/**
 * @title CampaignFactory
 * @notice Factory contract for creating and managing crowdfunding campaigns
 * @dev Uses factory pattern to deploy individual Campaign contracts
 */
contract CampaignFactory {
    // ============ State Variables ============
    address public owner;
    uint256 public platformFee = 250; // 2.5% (basis points)
    uint256 public constant MAX_FEE = 1000; // 10% max fee

    address[] public deployedCampaigns;
    mapping(address => address[]) public campaignsByCreator;
    mapping(address => bool) public isCampaign;

    // ============ Events ============
    event CampaignCreated(
        address indexed campaignAddress,
        address indexed creator,
        string title,
        uint256 targetAmount,
        uint256 deadline,
        string category,
        uint256 timestamp
    );
    event PlatformFeeUpdated(uint256 newFee);
    event FeesWithdrawn(address indexed owner, uint256 amount);

    // ============ Modifiers ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // ============ Constructor ============
    constructor() {
        owner = msg.sender;
    }

    // ============ Core Functions ============

    /**
     * @notice Create a new crowdfunding campaign
     * @param _title Campaign title
     * @param _description Campaign description
     * @param _imageHash IPFS hash for campaign image
     * @param _category Campaign category
     * @param _targetAmount Funding target in wei
     * @param _durationDays Campaign duration in days
     * @param _milestoneDescriptions Array of milestone descriptions
     * @param _milestoneAmounts Array of milestone amounts (must sum to targetAmount)
     */
    function createCampaign(
        string memory _title,
        string memory _description,
        string memory _imageHash,
        string memory _category,
        uint256 _targetAmount,
        uint256 _durationDays,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneAmounts
    ) external returns (address) {
        require(bytes(_title).length > 0, "Title required");
        require(_targetAmount > 0, "Target must be > 0");

        Campaign newCampaign = new Campaign(
            msg.sender,
            _title,
            _description,
            _imageHash,
            _category,
            _targetAmount,
            _durationDays,
            _milestoneDescriptions,
            _milestoneAmounts
        );

        address campaignAddress = address(newCampaign);
        deployedCampaigns.push(campaignAddress);
        campaignsByCreator[msg.sender].push(campaignAddress);
        isCampaign[campaignAddress] = true;

        emit CampaignCreated(
            campaignAddress,
            msg.sender,
            _title,
            _targetAmount,
            block.timestamp + (_durationDays * 1 days),
            _category,
            block.timestamp
        );

        return campaignAddress;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update platform fee (owner only)
     */
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "Fee too high");
        platformFee = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }

    /**
     * @notice Withdraw accumulated platform fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit FeesWithdrawn(owner, balance);
    }

    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }

    // ============ View Functions ============

    function getDeployedCampaigns() external view returns (address[] memory) {
        return deployedCampaigns;
    }

    function getCampaignsByCreator(address _creator) external view returns (address[] memory) {
        return campaignsByCreator[_creator];
    }

    function getCampaignCount() external view returns (uint256) {
        return deployedCampaigns.length;
    }

    receive() external payable {}
}
