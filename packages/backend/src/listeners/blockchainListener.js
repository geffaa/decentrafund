const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// ABI fragments for events we care about
const FACTORY_ABI = [
    "event CampaignCreated(address indexed campaignAddress, address indexed creator, string title, uint256 targetAmount, uint256 deadline, string category, uint256 timestamp)",
];

const CAMPAIGN_ABI = [
    "event ContributionMade(address indexed backer, uint256 amount, uint256 timestamp)",
    "event RefundIssued(address indexed backer, uint256 amount)",
    "event MilestoneSubmitted(uint256 indexed milestoneIndex, string description)",
    "event MilestoneVoted(uint256 indexed milestoneIndex, address indexed voter, bool support)",
    "event MilestoneApproved(uint256 indexed milestoneIndex, uint256 amount)",
    "event MilestoneRejected(uint256 indexed milestoneIndex)",
    "event FundsWithdrawn(address indexed creator, uint256 amount)",
    "event CampaignStatusChanged(uint8 newStatus)",
    "function getCampaignInfo() view returns (tuple(address creator, string title, string description, string imageHash, uint256 targetAmount, uint256 currentAmount, uint256 deadline, uint256 createdAt, uint8 status, uint256 totalMilestones, uint256 currentMilestone, uint256 totalBackers, string category))",
];

let provider;
let factoryContract;

/**
 * Start listening to blockchain events and sync to database
 */
async function startEventListener(prisma, app) {
    const alchemyUrl = process.env.ALCHEMY_API_URL;
    if (!alchemyUrl) {
        throw new Error("ALCHEMY_API_URL not configured");
    }

    // Use JsonRpcProvider with polling (more reliable, works with all Alchemy plans)
    provider = new ethers.JsonRpcProvider(alchemyUrl);
    provider.pollingInterval = 15000; // Poll every 15 seconds

    // Try to load deployment info
    const deploymentPath = path.join(
        __dirname,
        "../../../contracts/deployments/sepolia.json"
    );

    let factoryAddress;
    if (fs.existsSync(deploymentPath)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
        factoryAddress = deployment.contracts.CampaignFactory;
    } else {
        factoryAddress = process.env.VITE_CONTRACT_FACTORY_ADDRESS;
    }

    if (!factoryAddress) {
        throw new Error("CampaignFactory address not found");
    }

    factoryContract = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);

    console.log(`📡 Listening to CampaignFactory at ${factoryAddress}`);

    // Listen: New Campaign Created
    factoryContract.on("CampaignCreated", async (campaignAddress, creator, title, targetAmount, deadline, category, timestamp, event) => {
        console.log(`\n🆕 New Campaign: "${title}" by ${creator}`);
        console.log(`   Address: ${campaignAddress}`);

        try {
            // Find or create user
            let user = await prisma.user.upsert({
                where: { walletAddress: creator.toLowerCase() },
                update: {},
                create: { walletAddress: creator.toLowerCase() },
            });

            // Fetch full campaign info from contract
            const campaignContract = new ethers.Contract(
                campaignAddress,
                CAMPAIGN_ABI,
                provider
            );
            const info = await campaignContract.getCampaignInfo();

            // Create campaign in DB
            await prisma.campaign.upsert({
                where: { contractAddress: campaignAddress.toLowerCase() },
                update: {},
                create: {
                    contractAddress: campaignAddress.toLowerCase(),
                    creatorId: user.id,
                    title: info.title,
                    description: info.description,
                    imageHash: info.imageHash,
                    category: info.category,
                    targetAmount: info.targetAmount.toString(),
                    deadline: new Date(Number(info.deadline) * 1000),
                    txHash: event.log.transactionHash,
                },
            });

            // Create milestones from on-chain data
            for (let i = 0; i < Number(info.totalMilestones); i++) {
                // We'd need getMilestone ABI here; for now we store basic info
            }

            // Broadcast via WebSocket
            const broadcast = app.get("broadcast");
            if (broadcast) {
                broadcast({
                    type: "CAMPAIGN_CREATED",
                    data: {
                        address: campaignAddress,
                        creator,
                        title,
                        targetAmount: targetAmount.toString(),
                        category,
                    },
                });
            }

            // Listen to this specific campaign's events
            listenToCampaign(campaignAddress, prisma, app);

            console.log(`   ✅ Synced to database`);
        } catch (error) {
            console.error(`   ❌ Sync failed:`, error.message);
        }
    });

    // Also listen to already deployed campaigns
    try {
        const existingCampaigns = await prisma.campaign.findMany({
            select: { contractAddress: true },
        });
        for (const c of existingCampaigns) {
            listenToCampaign(c.contractAddress, prisma, app);
        }
        console.log(`📡 Listening to ${existingCampaigns.length} existing campaigns`);
    } catch (error) {
        console.warn("⚠️ Could not load existing campaigns:", error.message);
    }

    // Handle provider errors
    provider.on("error", (error) => {
        console.error("Provider error:", error.message);
    });
}

/**
 * Listen to events for a specific campaign
 */
function listenToCampaign(campaignAddress, prisma, app) {
    const campaignContract = new ethers.Contract(
        campaignAddress,
        CAMPAIGN_ABI,
        provider
    );

    // Contribution
    campaignContract.on("ContributionMade", async (backer, amount, timestamp, event) => {
        console.log(`💰 Contribution: ${ethers.formatEther(amount)} ETH from ${backer}`);

        try {
            let user = await prisma.user.upsert({
                where: { walletAddress: backer.toLowerCase() },
                update: {},
                create: { walletAddress: backer.toLowerCase() },
            });

            const campaign = await prisma.campaign.findUnique({
                where: { contractAddress: campaignAddress.toLowerCase() },
            });

            if (campaign) {
                await prisma.contribution.upsert({
                    where: { txHash: event.log.transactionHash },
                    update: {},
                    create: {
                        userId: user.id,
                        campaignId: campaign.id,
                        amount: amount.toString(),
                        txHash: event.log.transactionHash,
                        blockNumber: event.log.blockNumber,
                    },
                });

                // Update campaign totals
                await prisma.campaign.update({
                    where: { id: campaign.id },
                    data: {
                        currentAmount: (
                            BigInt(campaign.currentAmount) + BigInt(amount.toString())
                        ).toString(),
                        totalBackers: { increment: 1 },
                    },
                });

                // Create notification for campaign creator
                await prisma.notification.create({
                    data: {
                        userId: campaign.creatorId,
                        type: "CAMPAIGN_FUNDED",
                        title: "New Contribution!",
                        message: `${backer.slice(0, 6)}...${backer.slice(-4)} contributed ${ethers.formatEther(amount)} ETH`,
                        data: { campaignId: campaign.id, amount: amount.toString() },
                    },
                });

                const broadcast = app.get("broadcast");
                if (broadcast) {
                    broadcast({
                        type: "CONTRIBUTION_MADE",
                        data: {
                            campaignAddress,
                            backer,
                            amount: amount.toString(),
                            campaignId: campaign.id,
                        },
                    });
                }
            }
        } catch (error) {
            console.error("ContributionMade handler error:", error.message);
        }
    });

    // Milestone Approved
    campaignContract.on("MilestoneApproved", async (milestoneIndex, amount) => {
        console.log(`✅ Milestone ${milestoneIndex} approved: ${ethers.formatEther(amount)} ETH`);

        try {
            const campaign = await prisma.campaign.findUnique({
                where: { contractAddress: campaignAddress.toLowerCase() },
            });

            if (campaign) {
                await prisma.milestone.updateMany({
                    where: { campaignId: campaign.id, index: Number(milestoneIndex) },
                    data: { status: "APPROVED", fundsReleased: true },
                });
            }
        } catch (error) {
            console.error("MilestoneApproved handler error:", error.message);
        }
    });

    // Campaign Status Changed
    campaignContract.on("CampaignStatusChanged", async (newStatus) => {
        const statusMap = ["ACTIVE", "SUCCESSFUL", "FAILED", "CANCELLED"];
        const statusStr = statusMap[Number(newStatus)] || "ACTIVE";

        try {
            await prisma.campaign.update({
                where: { contractAddress: campaignAddress.toLowerCase() },
                data: { status: statusStr },
            });
        } catch (error) {
            console.error("CampaignStatusChanged handler error:", error.message);
        }
    });
}

module.exports = { startEventListener };
