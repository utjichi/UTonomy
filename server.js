// server.js

const express = require("express");
const path = require("path");
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
app.use(express.static(path.join(__dirname, "public")));

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
        const promises = posts.map((post) => {
          return db
            .getVote(req.user.id, post.id)
            .then((vote) => {
              post.vote = vote;
              return post;
            })
            .catch((err) => {
              console.error("Failed to retrieve vote:", err);
              post.vote = null;
              return post;
            });
        });
        return Promise.all(promises);
      })
      .then((posts) => {
        res.render("index", { user: req.user, posts, error: null });
      })
      .catch((err) => {
        console.error("Failed to retrieve posts:", err);
        res.render("index", { user: req.user, posts: [], error: err.message });
      });
  } else {
    res.render("index", { user: req.user, posts: [], error: null });
  }
});

app.get("/user", (req, res) => {
  if (req.isAuthenticated()) {
    db.getPermissions(req.user.id)
      .then((permissions) => {
        console.log(req.user.id, permissions);
        const promises = permissions.map((permission) => {
          return db.getGroup(permission.target).then((group) => {
            permission.group = group;
            return permission;
          });
        });
        return Promise.all(promises);
      })
      .then((permissions) => {
        res.render("user", { user: req.user, permissions, error: null });
      })
      .catch((err) => {
        console.error("Failed to retrieve groups:", err);
        res.render("user", {
          user: req.user,
          permissions: [],
          error: err.message,
        });
      });
  } else {
    res.render("index", { user: req.user, posts: [], error: null });
  }
});

app.post("/post", (req, res) => {
  if (req.isAuthenticated()) {
    const { content } = req.body;
    db.addPost(req.user.id, content);
    res.redirect("/"); // 投稿後は / へリダイレクト
  } else {
    res.redirect("/");
  }
});

app.post("/post/:id/upvote", (req, res) => {
  if (req.isAuthenticated()) {
    const postId = req.params.id;
    const userId = req.user.id;
    db.upvotePost(userId, postId)
      .then(() => res.redirect("/")) // 投票後は / へリダイレクト
      .catch((err) => {
        console.error("Failed to upvote post:", err);
        res.redirect("/?error=" + encodeURIComponent(err.message));
      });
  } else {
    res.redirect("/");
  }
});

app.post("/post/:id/downvote", (req, res) => {
  if (req.isAuthenticated()) {
    const postId = req.params.id;
    const userId = req.user.id;
    db.downvotePost(userId, postId)
      .then(() => res.redirect("/")) // 投票後は / へリダイレクト
      .catch((err) => {
        console.error("Failed to downvote post:", err);
        res.redirect("/?error=" + encodeURIComponent(err.message));
      });
  } else {
    res.redirect("/");
  }
});

app.post("/group", (req, res) => {
  db.addGroup(req.user.id, req.body.name);
  res.redirect("/");
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
    failureRedirect: "/",
  }),
  async (req, res) => {
    // Check if the user is already in the database
    const user = req.user;
    db.getUser(user.id)
      .then((existingUser) => {
        if (!existingUser) {
          res.redirect("/");
        } else {
          res.redirect("/");
        }
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        res.redirect("/"); // エラーが発生した場合はログインページにリダイレクト
      });
  }
);

app.get("/logout", (req, res) => {
  req.logout(() => {});
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server is running on https://u-tonomy.glitch.me:${port}`);
});
