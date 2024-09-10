// routes/groupRoutes.js
const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");

// ユーザーのグループを取得
router.get("/user", groupController.getMyGroups);
router.get("/g", groupController.getMyGroups);

// 新しいグループの作成
router.post("/group/new", groupController.addGroup);

// グループへのユーザー招待
router.post("/group/:id/invite", groupController.inviteUser);

module.exports = router;
