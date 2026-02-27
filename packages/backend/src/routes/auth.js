const express = require("express");
const router = express.Router();
const { getNonce, verifySignature } = require("../controllers/authController");

// GET /api/auth/nonce/:address — Get nonce for SIWE
router.get("/nonce/:address", getNonce);

// POST /api/auth/verify — Verify SIWE signature
router.post("/verify", verifySignature);

module.exports = router;
