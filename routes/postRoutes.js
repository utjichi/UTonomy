// routes/postRoutes.js
const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");

// 新しい投稿の作成
router.get("/post", postController.newPost);
router.post("/post", postController.addPost);

// 投稿への投票
router.post("/post/:id/vote", postController.votePost);

module.exports = router;
