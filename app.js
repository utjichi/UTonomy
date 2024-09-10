// app.js
const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const SQLiteStore = require("connect-sqlite3")(session);
const db = require("./models/db");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const groupRoutes = require("./routes/groupRoutes");
const passportConfig = require("./config/passportConfig");

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

// Passportの設定を初期化
passportConfig();

// ルートの使用
app.use("/", postRoutes);
app.use("/", groupRoutes);
app.use("/", authRoutes);

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on https://u-tonomy.glitch.me:${port}`);
});
