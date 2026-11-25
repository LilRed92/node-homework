const express = require("express");
const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("../controllers/analyticsController");

const router = express.Router();

// 🔖 [VIDEO: Analytics routes definitions]
router.get("/users/:id", getUserAnalytics);
router.get("/users", getUsersWithStats);
router.get("/tasks/search", searchTasks);

module.exports = router;
