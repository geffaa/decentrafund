const { PrismaClient } = require("@prisma/client");
const { SiweMessage } = require("siwe");
const crypto = require("crypto");

const prisma = new PrismaClient();

/**
 * Get or create user and return nonce for SIWE authentication
 */
async function getNonce(req, res) {
    try {
        const { address } = req.params;

        if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return res.status(400).json({ error: "Invalid wallet address" });
        }

        const nonce = crypto.randomUUID();

        await prisma.user.upsert({
            where: { walletAddress: address.toLowerCase() },
            update: { nonce },
            create: {
                walletAddress: address.toLowerCase(),
                nonce,
            },
        });

        res.json({ nonce });
    } catch (error) {
        console.error("getNonce error:", error);
        res.status(500).json({ error: "Failed to generate nonce" });
    }
}

/**
 * Verify SIWE signature and return user data
 */
async function verifySignature(req, res) {
    try {
        const { message, signature } = req.body;

        if (!message || !signature) {
            return res.status(400).json({ error: "Message and signature required" });
        }

        const siweMessage = new SiweMessage(message);
        const result = await siweMessage.verify({ signature });

        if (!result.success) {
            return res.status(401).json({ error: "Invalid signature" });
        }

        const address = siweMessage.address.toLowerCase();

        // Verify nonce matches
        const user = await prisma.user.findUnique({
            where: { walletAddress: address },
        });

        if (!user || user.nonce !== siweMessage.nonce) {
            return res.status(401).json({ error: "Invalid nonce" });
        }

        // Rotate nonce after successful auth
        await prisma.user.update({
            where: { walletAddress: address },
            data: { nonce: crypto.randomUUID() },
        });

        res.json({
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                username: user.username,
                avatarUrl: user.avatarUrl,
            },
        });
    } catch (error) {
        console.error("verifySignature error:", error);
        res.status(500).json({ error: "Verification failed" });
    }
}

module.exports = { getNonce, verifySignature };
