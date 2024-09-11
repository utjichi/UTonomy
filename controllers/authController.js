// controllers/authController.js
const passport = require("passport");
const db = require("../db/index");

exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

exports.googleAuthCallback = async (req, res) => {
  const user = req.user;
  console.log(req.user)
  const email = user.emails ? user.emails[0].value : null;

  try {
    const existingUser = await db.getUser(user.id);
    if (!existingUser) {
      await db.addUser(user.id, user.displayName, email);
    } else {
      await db.updateUser(user.id, user.displayName, email);
    }
    res.redirect("/");
  } catch (err) {
    console.error("Error fetching user:", err);
    res.redirect("/");
  }
};

exports.logout = (req, res) => {
  req.logout(() => {});
  res.redirect("/");
};
