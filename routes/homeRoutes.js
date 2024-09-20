// routes/homeRoutes.js
const express = require("express");
const router = express.Router();
const homeController = require("../controllers/homeController");

// 投稿の取得
router.get("/", homeController.showHome);

module.exports = router;
