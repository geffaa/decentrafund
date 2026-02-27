const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get all campaigns with filtering, sorting, and pagination
 */
async function getCampaigns(req, res) {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            status,
            search,
            sort = "createdAt",
            order = "desc",
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};

        if (category) where.category = category;
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        const [campaigns, total] = await Promise.all([
            prisma.campaign.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { [sort]: order },
                include: {
                    creator: {
                        select: { id: true, walletAddress: true, username: true, avatarUrl: true },
                    },
                    milestones: {
                        select: { id: true, index: true, description: true, amount: true, status: true },
                    },
                    _count: { select: { contributions: true } },
                },
            }),
            prisma.campaign.count({ where }),
        ]);

        res.json({
            campaigns,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("getCampaigns error:", error);
        res.status(500).json({ error: "Failed to fetch campaigns" });
    }
}

/**
 * Get single campaign by ID or contract address
 */
async function getCampaignById(req, res) {
    try {
        const { id } = req.params;

        const campaign = await prisma.campaign.findFirst({
            where: {
                OR: [{ id }, { contractAddress: id }],
            },
            include: {
                creator: {
                    select: { id: true, walletAddress: true, username: true, avatarUrl: true, bio: true },
                },
                milestones: {
                    orderBy: { index: "asc" },
                    include: {
                        votes: {
                            select: { userId: true, support: true, voteWeight: true },
                        },
                    },
                },
                contributions: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                    include: {
                        user: {
                            select: { id: true, walletAddress: true, username: true, avatarUrl: true },
                        },
                    },
                },
                _count: { select: { contributions: true } },
            },
        });

        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found" });
        }

        res.json({ campaign });
    } catch (error) {
        console.error("getCampaignById error:", error);
        res.status(500).json({ error: "Failed to fetch campaign" });
    }
}

/**
 * Create a new campaign (off-chain metadata)
 */
async function createCampaign(req, res) {
    try {
        const {
            contractAddress,
            creatorAddress,
            title,
            description,
            shortDesc,
            imageHash,
            imageUrl,
            category,
            targetAmount,
            deadline,
            txHash,
            milestones,
        } = req.body;

        // Validate required fields
        if (!contractAddress || !creatorAddress || !title || !targetAmount) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { walletAddress: creatorAddress.toLowerCase() },
        });

        if (!user) {
            user = await prisma.user.create({
                data: { walletAddress: creatorAddress.toLowerCase() },
            });
        }

        const campaign = await prisma.campaign.create({
            data: {
                contractAddress: contractAddress.toLowerCase(),
                creatorId: user.id,
                title,
                description,
                shortDesc,
                imageHash,
                imageUrl,
                category,
                targetAmount,
                deadline: new Date(deadline),
                txHash,
                milestones: {
                    create: milestones.map((m, index) => ({
                        index,
                        description: m.description,
                        amount: m.amount,
                    })),
                },
            },
            include: {
                creator: { select: { id: true, walletAddress: true, username: true } },
                milestones: true,
            },
        });

        res.status(201).json({ campaign });
    } catch (error) {
        console.error("createCampaign error:", error);
        if (error.code === "P2002") {
            return res.status(409).json({ error: "Campaign already exists" });
        }
        res.status(500).json({ error: "Failed to create campaign" });
    }
}

/**
 * Get campaigns by category stats
 */
async function getCategoryStats(req, res) {
    try {
        const stats = await prisma.campaign.groupBy({
            by: ["category"],
            _count: { id: true },
            _sum: { totalBackers: true },
        });

        res.json({ stats });
    } catch (error) {
        console.error("getCategoryStats error:", error);
        res.status(500).json({ error: "Failed to fetch category stats" });
    }
}

module.exports = { getCampaigns, getCampaignById, createCampaign, getCategoryStats };
