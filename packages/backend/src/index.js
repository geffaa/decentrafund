require("dotenv").config({ path: "../../.env" });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { PrismaClient } = require("@prisma/client");
const { WebSocketServer } = require("ws");
const http = require("http");

// Import routes
const authRoutes = require("./routes/auth");
const campaignRoutes = require("./routes/campaigns");
const userRoutes = require("./routes/users");
const ipfsRoutes = require("./routes/ipfs");
const analyticsRoutes = require("./routes/analytics");

// Import event listener
const { startEventListener } = require("./listeners/blockchainListener");

// Initialize
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// ============ Middleware ============
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Make prisma available in routes
app.set("prisma", prisma);

// ============ Routes ============
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ipfs", ipfsRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    });
});

// ============ Server ============
const server = http.createServer(app);

// WebSocket for real-time updates
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    ws.on("close", () => console.log("WebSocket client disconnected"));
});

// Broadcast function
app.set("broadcast", (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(data));
        }
    });
});

// Start server
server.listen(PORT, async () => {
    console.log(`\n🚀 DecentraFund API running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket on ws://localhost:${PORT}/ws`);

    // Start blockchain event listener
    try {
        await startEventListener(prisma, app);
        console.log("🔗 Blockchain event listener started");
    } catch (error) {
        console.warn("⚠️ Event listener failed to start:", error.message);
        console.warn("   Make sure contracts are deployed and ALCHEMY_API_URL is set");
    }
});

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\nShutting down...");
    await prisma.$disconnect();
    server.close();
    process.exit(0);
});

module.exports = app;
