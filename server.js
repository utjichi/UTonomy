const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const SQLiteStore = require("connect-sqlite3")(session);
const db = require("./db");

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

// Passport configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://u-tonomy.glitch.me/auth/google/callback",
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

// Routes
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    db.getPosts()
      .then((posts) => {
        res.render("index", { user: req.user, posts });
      })
      .catch((err) => {
        console.error("Failed to retrieve posts:", err);
        res.render("index", { user: req.user, posts: [] }); // postsがない場合でもエラーを防ぐ
      });
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get("/logout", (req, res) => {
  req.logout(() => {});
  res.redirect("/");
});

app.post("/post", (req, res) => {
  if (req.isAuthenticated()) {
    const { content } = req.body;
    db.addPost(req.user.id, content);
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.post("/post/:id/upvote", (req, res) => {
  if (req.isAuthenticated()) {
    const postId = req.params.id; // ここで postId を取得
    const userId = req.user.id; // ユーザーIDを取得
    console.log("Post ID:", postId); // 追加
    db.upvotePost(userId, postId)
      .then(() => res.redirect("/posts"))
      .catch((err) => {
        console.error("Failed to upvote post:", err);
        res.redirect("/posts");
      });
  } else {
    res.redirect("/login");
  }
});


app.post("/post/:id/downvote", (req, res) => {
  if (req.isAuthenticated()) {
    const postId = req.params.id;
    db.downvotePost(postId)
      .then(() => res.redirect("/posts"))
      .catch((err) => {
        console.error("Failed to downvote post:", err);
        res.redirect("/posts");
      });
  } else {
    res.redirect("/login");
  }
});

app.get("/posts", (req, res) => {
  if (req.isAuthenticated()) {
    db.getPosts()
      .then((posts) => {
        res.render("index", { user: req.user, posts });
      })
      .catch((err) => {
        console.error("Failed to retrieve posts:", err);
        res.render("index", { user: req.user, posts: [] }); // postsがない場合でもエラーを防ぐ
      });
  } else {
    res.redirect("/login");
  }
});

app.listen(port, () => {
  console.log(`Server is running on https://u-tonomy.glitch.me:${port}`);
});

