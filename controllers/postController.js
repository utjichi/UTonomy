// controllers/postController.js
const db = require("../db/index");

exports.getPosts = async (req, res) => {
  console.log("getPosts");
  const user = req.isAuthenticated() ? req.user : { id: null };
  try {
    console.log("投稿を取得...");
    const posts = await db.getPosts(user.id);
    console.log("完了");
    console.log("投票の情報を取得...");
    const promises = posts.map(async (post) => {
      try {
        console.log("")
        post.isVotable = await db.checkVotable(user.id, post.id);
        if (post.isVotable) {
          console.log("自分はどこに投票したっけ");
          post.myVote = await db.getMyVote(user.id, post.id);
        }
        switch (post.vote_type) {
          case "radio":
          case "checkbox":
          case "select":
          case "select-multiple":
            post.options = await db.getOptions(
              post.id,
              await db.getPoster(post.id)
            );
        }
      } catch (err) {
        console.error("投稿の情報取得に失敗:", err);
        post.myVote = null;
        post.isVotable = false; // デフォルト値
      }
      return post;
    });
    const resolvedPosts = await Promise.all(promises);
    console.log("完了");
    res.render("index", {
      user,
      data: {
        posts: resolvedPosts,
        permissions: await db.getMyGroups(user.id),
      },
      error: null,
    });
  } catch (err) {
    console.error("Failed to retrieve posts:", err);
    res.render("index", { user, data: {}, error: err.message });
  }
};

exports.addPost = (req, res) => {
  console.log("addPost");
  if (!req.isAuthenticated()) res.redirect("/");
  const userId = req.user.id;
  const data = req.body;
  let nullVote = {};
  switch (data.voteType) {
    case "up/down":
      nullVote.updown = 0;
      break;
    case "radio":
    case "checkbox":
    case "select":
    case "select-multiple":
      const options = Array.isArray(data.option) ? data.option : [data.option];
      for (const option of options) {
        nullVote[option] = 0;
      }
  }
  db.addPost(userId, data).then((id) => {
    console.log(nullVote);
    db.votePost(userId, id, nullVote);
  });
  res.redirect("/");
};

exports.votePost = (req, res) => {
  if (req.isAuthenticated()) {
    const postId = req.params.id;
    const userId = req.user.id;
    const vote = req.body.vote;
    db.getPost(postId)
      .then((row) => {
        switch (row.vote_type) {
          case "none":
            return {};
          case "up/down":
            return { updown: parseFloat(vote) };
          case "radio":
            return {};
          case "checkbox":
            return {};
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
