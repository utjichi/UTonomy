// controllers/authController.js
const passport = require("passport");
const db = require("../db/index");

exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

exports.googleAuthCallback = async (req, res) => {
  const user = req.user;

  // メールアドレスを取得
  const email = user.emails ? user.emails[0].value : null;

  // データベースにユーザーが存在するか確認
  db.getUser(user.id)
    .then((existingUser) => {
      if (!existingUser) {
        // ユーザーが存在しない場合、新しいユーザーを追加
        db.addUser(user.id, user.displayName, email); // メールアドレスも保存
        res.redirect("/");
      } else {
        // ユーザーが既に存在する場合
        db.updateUser(user.id, user.displayName, email);
        res.redirect("/");
      }
    })
    .catch((err) => {
      console.error("Error fetching user:", err);
      res.redirect("/"); // エラーが発生した場合はログインページにリダイレクト
    });
};

exports.logout = (req, res) => {
  req.logout(() => {});
  res.redirect("/");
};
