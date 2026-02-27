const express = require("express");
const router = express.Router();
const {
    getUserProfile,
    updateProfile,
    getDashboard,
    markNotificationsRead,
} = require("../controllers/userController");

// GET /api/users/:address — User profile
router.get("/:address", getUserProfile);

// PUT /api/users/:address — Update profile
router.put("/:address", updateProfile);

// GET /api/users/:address/dashboard — User dashboard
router.get("/:address/dashboard", getDashboard);

// POST /api/users/:address/notifications/read — Mark notifications read
router.post("/:address/notifications/read", markNotificationsRead);

module.exports = router;
