const express = require("express");
const router = express.Router();
const { getOverview } = require("../controllers/analyticsController");

// GET /api/analytics/overview — Platform analytics
router.get("/overview", getOverview);

module.exports = router;
