// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Campaign
 * @notice Individual crowdfunding campaign with milestone-based fund release
 * @dev Each campaign is deployed as a separate contract by CampaignFactory
 */
contract Campaign is ReentrancyGuard, Pausable {
    // ============ Enums ============
    enum CampaignStatus {
        Active,
        Successful,
        Failed,
        Cancelled
    }

    enum MilestoneStatus {
        Pending,
        Voting,
        Approved,
        Rejected
    }

    // ============ Structs ============
    struct Milestone {
        string description;
        uint256 amount;
        MilestoneStatus status;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votingDeadline;
        bool fundsReleased;
    }

    struct CampaignInfo {
        address creator;
        string title;
        string description;
        string imageHash; // IPFS hash
        uint256 targetAmount;
        uint256 currentAmount;
        uint256 deadline;
        uint256 createdAt;
        CampaignStatus status;
        uint256 totalMilestones;
        uint256 currentMilestone;
        uint256 totalBackers;
        string category;
    }

    // ============ State Variables ============
    address public immutable creator;
    address public immutable factory;
    string public title;
    string public description;
    string public imageHash;
    string public category;
    uint256 public targetAmount;
    uint256 public currentAmount;
    uint256 public deadline;
    uint256 public createdAt;
    CampaignStatus public status;

    Milestone[] public milestones;
    uint256 public currentMilestone;

    mapping(address => uint256) public contributions;
    mapping(uint256 => mapping(address => bool)) public milestoneVotes;
    address[] public backers;
    mapping(address => bool) public isBacker;

    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant APPROVAL_THRESHOLD = 51; // 51% needed to approve

    // ============ Events ============
    event ContributionMade(address indexed backer, uint256 amount, uint256 timestamp);
    event RefundIssued(address indexed backer, uint256 amount);
    event MilestoneSubmitted(uint256 indexed milestoneIndex, string description);
    event MilestoneVoted(uint256 indexed milestoneIndex, address indexed voter, bool support);
    event MilestoneApproved(uint256 indexed milestoneIndex, uint256 amount);
    event MilestoneRejected(uint256 indexed milestoneIndex);
    event FundsWithdrawn(address indexed creator, uint256 amount);
    event CampaignStatusChanged(CampaignStatus newStatus);

    // ============ Modifiers ============
    modifier onlyCreator() {
        require(msg.sender == creator, "Only campaign creator");
        _;
    }

    modifier onlyBacker() {
        require(isBacker[msg.sender], "Only backers");
        _;
    }

    modifier campaignActive() {
        require(status == CampaignStatus.Active, "Campaign not active");
        require(block.timestamp <= deadline, "Campaign deadline passed");
        _;
    }

    // ============ Constructor ============
    constructor(
        address _creator,
        string memory _title,
        string memory _description,
        string memory _imageHash,
        string memory _category,
        uint256 _targetAmount,
        uint256 _durationDays,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneAmounts
    ) {
        require(_creator != address(0), "Invalid creator address");
        require(_targetAmount > 0, "Target must be > 0");
        require(_durationDays > 0 && _durationDays <= 365, "Invalid duration");
        require(
            _milestoneDescriptions.length == _milestoneAmounts.length,
            "Milestone arrays mismatch"
        );
        require(_milestoneDescriptions.length > 0, "Need at least 1 milestone");

        // Validate milestones total equals target
        uint256 totalMilestoneAmount;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            require(_milestoneAmounts[i] > 0, "Milestone amount must be > 0");
            totalMilestoneAmount += _milestoneAmounts[i];
        }
        require(totalMilestoneAmount == _targetAmount, "Milestones must equal target");

        creator = _creator;
        factory = msg.sender;
        title = _title;
        description = _description;
        imageHash = _imageHash;
        category = _category;
        targetAmount = _targetAmount;
        deadline = block.timestamp + (_durationDays * 1 days);
        createdAt = block.timestamp;
        status = CampaignStatus.Active;

        for (uint256 i = 0; i < _milestoneDescriptions.length; i++) {
            milestones.push(
                Milestone({
                    description: _milestoneDescriptions[i],
                    amount: _milestoneAmounts[i],
                    status: MilestoneStatus.Pending,
                    votesFor: 0,
                    votesAgainst: 0,
                    votingDeadline: 0,
                    fundsReleased: false
                })
            );
        }
    }

    // ============ Core Functions ============

    /**
     * @notice Contribute ETH to the campaign
     */
    function contribute() external payable campaignActive whenNotPaused nonReentrant {
        require(msg.value > 0, "Must send ETH");
        require(msg.sender != creator, "Creator cannot contribute");

        if (!isBacker[msg.sender]) {
            backers.push(msg.sender);
            isBacker[msg.sender] = true;
        }

        contributions[msg.sender] += msg.value;
        currentAmount += msg.value;

        emit ContributionMade(msg.sender, msg.value, block.timestamp);

        // Check if target reached
        if (currentAmount >= targetAmount) {
            status = CampaignStatus.Successful;
            emit CampaignStatusChanged(CampaignStatus.Successful);
        }
    }

    /**
     * @notice Submit a milestone for backer voting (creator only)
     */
    function submitMilestone() external onlyCreator whenNotPaused {
        require(
            status == CampaignStatus.Successful || currentAmount > 0,
            "No funds to release"
        );
        require(currentMilestone < milestones.length, "All milestones completed");
        require(
            milestones[currentMilestone].status == MilestoneStatus.Pending,
            "Milestone not pending"
        );

        milestones[currentMilestone].status = MilestoneStatus.Voting;
        milestones[currentMilestone].votingDeadline = block.timestamp + VOTING_PERIOD;

        emit MilestoneSubmitted(currentMilestone, milestones[currentMilestone].description);
    }

    /**
     * @notice Vote on current milestone (backers only)
     * @param _support True = approve, False = reject
     */
    function voteMilestone(bool _support) external onlyBacker whenNotPaused {
        uint256 idx = currentMilestone;
        require(milestones[idx].status == MilestoneStatus.Voting, "Not in voting");
        require(block.timestamp <= milestones[idx].votingDeadline, "Voting ended");
        require(!milestoneVotes[idx][msg.sender], "Already voted");

        milestoneVotes[idx][msg.sender] = true;

        // Weight vote by contribution amount
        uint256 voteWeight = contributions[msg.sender];

        if (_support) {
            milestones[idx].votesFor += voteWeight;
        } else {
            milestones[idx].votesAgainst += voteWeight;
        }

        emit MilestoneVoted(idx, msg.sender, _support);
    }

    /**
     * @notice Finalize milestone voting and release/hold funds
     */
    function finalizeMilestone() external whenNotPaused {
        uint256 idx = currentMilestone;
        require(milestones[idx].status == MilestoneStatus.Voting, "Not in voting");
        require(block.timestamp > milestones[idx].votingDeadline, "Voting not ended");

        uint256 totalVotes = milestones[idx].votesFor + milestones[idx].votesAgainst;

        // If no votes or majority approves, release funds
        bool approved = totalVotes == 0 ||
            (milestones[idx].votesFor * 100) / totalVotes >= APPROVAL_THRESHOLD;

        if (approved) {
            milestones[idx].status = MilestoneStatus.Approved;
            milestones[idx].fundsReleased = true;

            uint256 releaseAmount = milestones[idx].amount;
            if (releaseAmount > address(this).balance) {
                releaseAmount = address(this).balance;
            }

            (bool success, ) = payable(creator).call{value: releaseAmount}("");
            require(success, "Transfer failed");

            emit MilestoneApproved(idx, releaseAmount);
            emit FundsWithdrawn(creator, releaseAmount);

            currentMilestone++;
        } else {
            milestones[idx].status = MilestoneStatus.Rejected;
            emit MilestoneRejected(idx);
        }
    }

    /**
     * @notice Request refund if campaign failed or deadline passed without reaching target
     */
    function requestRefund() external onlyBacker nonReentrant whenNotPaused {
        require(
            status == CampaignStatus.Failed ||
            status == CampaignStatus.Cancelled ||
            (block.timestamp > deadline && currentAmount < targetAmount),
            "Refund not available"
        );

        uint256 contributed = contributions[msg.sender];
        require(contributed > 0, "No contribution to refund");

        // Calculate refund proportional to remaining balance
        uint256 refundAmount = (contributed * address(this).balance) / currentAmount;
        contributions[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit RefundIssued(msg.sender, refundAmount);
    }

    /**
     * @notice Cancel campaign (creator only, before any milestone approved)
     */
    function cancelCampaign() external onlyCreator {
        require(
            status == CampaignStatus.Active || status == CampaignStatus.Successful,
            "Cannot cancel"
        );
        require(currentMilestone == 0, "Milestones already started");

        status = CampaignStatus.Cancelled;
        emit CampaignStatusChanged(CampaignStatus.Cancelled);
    }

    /**
     * @notice Pause campaign in emergencies (factory/creator only)
     */
    function pause() external {
        require(msg.sender == creator || msg.sender == factory, "Not authorized");
        _pause();
    }

    function unpause() external {
        require(msg.sender == creator || msg.sender == factory, "Not authorized");
        _unpause();
    }

    // ============ View Functions ============

    function getCampaignInfo() external view returns (CampaignInfo memory) {
        return CampaignInfo({
            creator: creator,
            title: title,
            description: description,
            imageHash: imageHash,
            targetAmount: targetAmount,
            currentAmount: currentAmount,
            deadline: deadline,
            createdAt: createdAt,
            status: status,
            totalMilestones: milestones.length,
            currentMilestone: currentMilestone,
            totalBackers: backers.length,
            category: category
        });
    }

    function getMilestone(uint256 _index) external view returns (Milestone memory) {
        require(_index < milestones.length, "Invalid milestone index");
        return milestones[_index];
    }

    function getMilestones() external view returns (Milestone[] memory) {
        return milestones;
    }

    function getBackers() external view returns (address[] memory) {
        return backers;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {
        revert("Use contribute()");
    }
}
