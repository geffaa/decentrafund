const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get user profile by wallet address
 */
async function getUserProfile(req, res) {
    try {
        const { address } = req.params;

        // Auto-create user if not found
        let user = await prisma.user.findUnique({
            where: { walletAddress: address.toLowerCase() },
            select: {
                id: true,
                walletAddress: true,
                username: true,
                email: true,
                avatarUrl: true,
                bio: true,
                createdAt: true,
                _count: {
                    select: { campaigns: true, contributions: true },
                },
            },
        });

        if (!user) {
            user = await prisma.user.create({
                data: { walletAddress: address.toLowerCase() },
                select: {
                    id: true,
                    walletAddress: true,
                    username: true,
                    email: true,
                    avatarUrl: true,
                    bio: true,
                    createdAt: true,
                    _count: {
                        select: { campaigns: true, contributions: true },
                    },
                },
            });
        }

        res.json({ user });
    } catch (error) {
        console.error("getUserProfile error:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
}

/**
 * Update user profile
 */
async function updateProfile(req, res) {
    try {
        const { address } = req.params;
        const { username, email, bio, avatarUrl } = req.body;

        const user = await prisma.user.update({
            where: { walletAddress: address.toLowerCase() },
            data: {
                ...(username !== undefined && { username }),
                ...(email !== undefined && { email }),
                ...(bio !== undefined && { bio }),
                ...(avatarUrl !== undefined && { avatarUrl }),
            },
            select: {
                id: true,
                walletAddress: true,
                username: true,
                email: true,
                avatarUrl: true,
                bio: true,
            },
        });

        res.json({ user });
    } catch (error) {
        console.error("updateProfile error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
}

/**
 * Get user dashboard (campaigns created + contributions made)
 */
async function getDashboard(req, res) {
    try {
        const { address } = req.params;

        // Auto-create user if not found (first-time wallet connection)
        const user = await prisma.user.upsert({
            where: { walletAddress: address.toLowerCase() },
            update: {},
            create: { walletAddress: address.toLowerCase() },
        });

        const [myCampaigns, myContributions, notifications] = await Promise.all([
            // Campaigns I created
            prisma.campaign.findMany({
                where: { creatorId: user.id },
                orderBy: { createdAt: "desc" },
                include: {
                    milestones: { select: { status: true, amount: true } },
                    _count: { select: { contributions: true } },
                },
            }),
            // Campaigns I backed
            prisma.contribution.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
                include: {
                    campaign: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            contractAddress: true,
                            imageUrl: true,
                            currentAmount: true,
                            targetAmount: true,
                        },
                    },
                },
            }),
            // Recent notifications
            prisma.notification.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
                take: 20,
            }),
        ]);

        // Aggregate stats
        const totalRaised = myCampaigns.reduce(
            (sum, c) => sum + BigInt(c.currentAmount || "0"),
            0n
        ).toString();
        const totalContributed = myContributions.reduce(
            (sum, c) => sum + BigInt(c.amount || "0"),
            0n
        ).toString();

        res.json({
            dashboard: {
                creator: {
                    campaigns: myCampaigns,
                    totalRaised,
                    totalCampaigns: myCampaigns.length,
                },
                backer: {
                    contributions: myContributions,
                    totalContributed,
                    totalBacked: myContributions.length,
                },
                notifications,
                unreadCount: notifications.filter((n) => !n.read).length,
            },
        });
    } catch (error) {
        console.error("getDashboard error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard" });
    }
}

/**
 * Mark notifications as read
 */
async function markNotificationsRead(req, res) {
    try {
        const { address } = req.params;
        const { notificationIds } = req.body;

        const user = await prisma.user.findUnique({
            where: { walletAddress: address.toLowerCase() },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                userId: user.id,
            },
            data: { read: true },
        });

        res.json({ success: true });
    } catch (error) {
        console.error("markNotificationsRead error:", error);
        res.status(500).json({ error: "Failed to update notifications" });
    }
}

module.exports = { getUserProfile, updateProfile, getDashboard, markNotificationsRead };
