// routes/postRoutes.js
const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");

// 新しい投稿の作成
router.get("/comments/:id", commentController.comments);
router.post("/comment/:id", commentController.addComment);

module.exports = router;
