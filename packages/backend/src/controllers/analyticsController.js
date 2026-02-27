const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get platform-wide analytics
 */
async function getOverview(req, res) {
    try {
        const [
            totalCampaigns,
            activeCampaigns,
            successfulCampaigns,
            totalContributions,
            recentCampaigns,
            topCampaigns,
            categoryStats,
        ] = await Promise.all([
            prisma.campaign.count(),
            prisma.campaign.count({ where: { status: "ACTIVE" } }),
            prisma.campaign.count({ where: { status: "SUCCESSFUL" } }),
            prisma.contribution.count(),
            prisma.campaign.findMany({
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    category: true,
                    currentAmount: true,
                    targetAmount: true,
                    status: true,
                    createdAt: true,
                },
            }),
            prisma.campaign.findMany({
                orderBy: { totalBackers: "desc" },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    currentAmount: true,
                    targetAmount: true,
                    totalBackers: true,
                    contractAddress: true,
                },
            }),
            prisma.campaign.groupBy({
                by: ["category"],
                _count: { id: true },
            }),
        ]);

        // Calculate total funded
        const allCampaigns = await prisma.campaign.findMany({
            select: { currentAmount: true },
        });
        const totalFunded = allCampaigns
            .reduce((sum, c) => sum + BigInt(c.currentAmount || "0"), 0n)
            .toString();

        const successRate =
            totalCampaigns > 0
                ? ((successfulCampaigns / totalCampaigns) * 100).toFixed(1)
                : "0";

        res.json({
            analytics: {
                overview: {
                    totalCampaigns,
                    activeCampaigns,
                    successfulCampaigns,
                    totalContributions,
                    totalFunded,
                    successRate: parseFloat(successRate),
                },
                recentCampaigns,
                topCampaigns,
                categoryStats,
            },
        });
    } catch (error) {
        console.error("getOverview error:", error);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
}

module.exports = { getOverview };
