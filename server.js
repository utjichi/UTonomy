const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Passport configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://u-tonomy.glitch.me/auth/google/callback",
      scope: ["profile","email"],
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
  const user = req.isAuthenticated() ? req.user : { id: null };
  Promise.all([
    db.getPosts(user.id).then((posts) => {
      const promises = posts.map((post) => {
        return db
          .getMyVote(user.id, post.id)
          .then((myVote) => {
            post.myVote = myVote;
            return;
          })
          .then(() => {
            return db.checkVotable(user.id, post.id).then((isVotable) => {
              post.isVotable = isVotable;
              return post;
            });
          })
          .catch((err) => {
            console.error("投稿の情報取得に失敗:", err);
            post.vote = null;
            return post;
          });
      });
      return Promise.all(promises);
    }),
    db.getMyGroups(user.id),
  ])
    .then((data) => {
      res.render("index", {
        user,
        data: { posts: data[0], permissions: data[1] },
        error: null,
      });
    })
    .catch((err) => {
      console.error("Failed to retrieve posts:", err);
      res.render("index", { user, data: {}, error: err.message });
    });
});

app.get("/user", (req, res) => {
  if (req.isAuthenticated()) {
    db.getMyGroups(req.user.id)
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
    db.addPost(req.user.id, req.body);
    res.redirect("/"); // 投稿後は / へリダイレクト
  } else {
    res.redirect("/");
  }
});

app.post("/group/new", (req, res) => {
  db.addGroup(req.user.id, req.body.name);
  res.redirect("/");
});

app.post("/post/:id/vote", (req, res) => {
  if (req.isAuthenticated()) {
    const postId = req.params.id;
    const userId = req.user.id;
    db.getPost(postId)
      .then((row) => {
        switch (row.vote_type) {
          case "none":
            return {};
          case "up/down":
            return { updown: parseFloat(req.body.updown) };
        }
      })
      .then((vote) => {
        db.votePost(userId, postId, vote)
          .then(() => res.redirect("/")) // 投票後は / へリダイレクト
          .catch((err) => {
            console.error("Failed to vote post:", err);
            res.redirect("/?error=" + encodeURIComponent(err.message));
          });
      });
  } else {
    res.redirect("/");
  }
});

app.post("/group/:id/invite", (req, res) => {
  if (req.isAuthenticated()) {
    const groupId = req.params.id;
    const inviter = req.user.id;
    const invited = req.body.email+"@g.ecc.u-tokyo.ac.jp";
    db.invite(inviter, groupId, invited)
      .then(() => res.redirect("/user")) // 招待後は /user へリダイレクト
      .catch((err) => {
        console.error("招待エラー:", err);
        res.redirect("/?error=" + encodeURIComponent(err.message));
      });
  } else {
    res.redirect("/");
  }
});