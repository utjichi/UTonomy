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

// EJSをビューエンジンとして設定
app.set("view engine", "ejs");
app.set("views", "./views");

// ミドルウェア
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
      callbackURL: process.env.CALLBACK_URL,
      scope: ["profile", "email"],
    },
    (accessToken, refreshToken, profile, done) => {
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

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on :${port}`);
});
