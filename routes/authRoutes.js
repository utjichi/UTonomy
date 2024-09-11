// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");

router.get("/auth/google", authController.googleAuth);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
  }),
  authController.googleAuthCallback
);
router.get("/logout", authController.logout);

module.exports = router;
