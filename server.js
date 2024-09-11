// app.js
const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const SQLiteStore = require("connect-sqlite3")(session);
const db = require("./db/index");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const groupRoutes = require("./routes/groupRoutes");

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", "./views");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.db", dir: "./.data" }),
    secret: process.env.GOOGLE_CLIENT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://u-tonomy.glitch.me/auth/google/callback",
      scope: ["profile", "email"],
    },
    (accessToken, refreshToken, profile, done) => {
      // Log the profile to see what is being returned
      console.log("Google profile:", profile);
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// ルートの使用
app.use("/", postRoutes);
app.use("/", groupRoutes);
app.use("/", authRoutes);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
  }),
  async (req, res) => {
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
  }
);

app.listen(port, () => {
  console.log(`Server is running on https://u-tonomy.glitch.me:${port}`);
});
