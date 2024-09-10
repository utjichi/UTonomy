// routes/postRoutes.js
const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");

// 投稿の取得
router.get("/", postController.getPosts);

// 新しい投稿の作成
router.post("/post", postController.addPost);

// 投稿への投票
router.post("/post/:id/vote", postController.votePost);

module.exports = router;
