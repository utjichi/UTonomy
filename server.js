const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const SQLiteStore = require("connect-sqlite3")(session);
const db = require("./db");

const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", "./views");

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.db", dir: "./.data" }),
    secret: process.env.SESSION_SECRET || 'default_secret', // Use a default value or an environment variable
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
      callbackURL: process.env.CALLBACK_URL || "http://localhost:3000/auth/google/callback", // Default to localhost for local development
    },
    (accessToken, refreshToken, profile, done) => {
      // Serialize only the user ID
      return done(null, profile.id);
    }
  )
);

passport.serializeUser((userId, done) => {
  done(null, userId);
});

passport.deserializeUser((userId, done) => {
  // Fetch the user object based on userId if needed
  done(null, { id: userId });
});

// Routes
app.get("/", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const posts = await db.getPosts();
      const updatedPosts = await Promise.all(posts.map(async (post) => {
        try {
          post.vote = await db.getVote(req.user.id, post.id);
        } catch (err) {
          console.error("Failed to retrieve vote:", err);
          post.vote = null;
        }
        return post;
      }));
      res.render("index", { user: req.user, posts: updatedPosts, error: null });
    } catch (err) {
      console.error("Failed to retrieve posts:", err);
      res.render("index", { user: req.user, posts: [], error: err.message });
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/post", async (req, res) => {
  if (req.isAuthenticated()) {
    const { content } = req.body;
    try {
      await db.addPost(req.user.id, content);
      res.redirect("/");
    } catch (err) {
      console.error("Failed to add post:", err);
      res.redirect("/?error=" + encodeURIComponent(err.message));
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/post/:id/upvote", async (req, res) => {
  if (req.isAuthenticated()) {
    const postId = req.params.id;
    try {
      await db.upvotePost(req.user.id, postId);
      res.redirect("/");
    } catch (err) {
      console.error("Failed to upvote post:", err);
      res.redirect("/?error=" + encodeURIComponent(err.message));
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/post/:id/downvote", async (req, res) => {
  if (req.isAuthenticated()) {
    const postId = req.params.id;
    try {
      await db.downvotePost(req.user.id, postId);
      res.redirect("/");
    } catch (err) {
      console.error("Failed to downvote post:", err);
      res.redirect("/?error=" + encodeURIComponent(err.message));
    }
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

app.get("/posts", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const posts = await db.getPosts();
      const error = req.query.error ? decodeURIComponent(req.query.error) : null;
      const vote = await db.getVote(req.user.id, posts[0].id).catch(err => {
        console.error("Failed to retrieve vote:", err);
        return null;
      });
      res.render("index", { user: req.user, posts, error: error || null, vote });
    } catch (err) {
      console.error("Failed to retrieve posts:", err);
      res.render("index", { user: req.user, posts: [], error: err.message });
    }
  } else {
    res.redirect("/login");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
