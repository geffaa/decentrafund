const express = require("express");
const router = express.Router();
const {
    getCampaigns,
    getCampaignById,
    createCampaign,
    getCategoryStats,
} = require("../controllers/campaignController");

// GET /api/campaigns — List campaigns (filter, sort, paginate)
router.get("/", getCampaigns);

// GET /api/campaigns/categories — Category stats
router.get("/categories", getCategoryStats);

// GET /api/campaigns/:id — Single campaign
router.get("/:id", getCampaignById);

// POST /api/campaigns — Create campaign
router.post("/", createCampaign);

module.exports = router;
