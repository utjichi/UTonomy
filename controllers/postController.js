// controllers/postController.js
const db = require("../models/db");

exports.getPosts = async (req, res) => {
  const user = req.isAuthenticated() ? req.user : { id: null };
  try {
    const posts = await db.getPosts(user.id);
    const promises = posts.map(async (post) => {
      try {
        post.myVote = await db.getMyVote(user.id, post.id);
        post.isVotable = await db.checkVotable(user.id, post.id);
      } catch (err) {
        console.error("投稿の情報取得に失敗:", err);
        post.myVote = null;
        post.isVotable = false; // デフォルト値
      }
      return post;
    });
    const resolvedPosts = await Promise.all(promises);
    res.render("index", {
      user,
      data: { posts: resolvedPosts, permissions: await db.getMyGroups(user.id) },
      error: null,
    });
  } catch (err) {
    console.error("Failed to retrieve posts:", err);
    res.render("index", { user, data: {}, error: err.message });
  }
};

exports.addPost = (req, res) => {
  if (req.isAuthenticated()) {
    db.addPost(req.user.id, req.body)
      .then(() => res.redirect("/")) // 投稿後は / へリダイレクト
      .catch((err) => {
        console.error("Failed to add post:", err);
        res.redirect("/?error=" + encodeURIComponent(err.message));
      });
  } else {
    res.redirect("/");
  }
};

exports.votePost = (req, res) => {
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
        return db.votePost(userId, postId, vote);
      })
      .then(() => res.redirect("/")) // 投票後は / へリダイレクト
      .catch((err) => {
        console.error("Failed to vote post:", err);
        res.redirect("/?error=" + encodeURIComponent(err.message));
      });
  } else {
    res.redirect("/");
  }
};
