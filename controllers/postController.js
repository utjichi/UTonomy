// controllers/postController.js
const db = require("../db/index");

const toArray = (value) =>
  value ? (Array.isArray(value) ? value : [value]) : [];

exports.getPosts = async (user)=>{
  console.log("getPosts")
    const posts = await db.getPosts(user.id);
    console.log(posts)
    const promises = posts.map(async (post) => {
      try {
        console.log("get a post")
        post.isVotable = await db.checkVotable(user.id, post.id);
        if (post.isVotable) {
          post.myVote = await db.getMyVote(user.id, post.id);
        }
        switch (post.vote_type) {
          case "radio":
          case "checkbox":
            post.options = await db.getOptions(post.id);
        }
        post.votes = await db.getVotes(post.id, post.vote_type);
      } catch (err) {
        console.error("投稿の情報取得に失敗:", err);
        post.myVote = null;
        post.isVotable = false; // デフォルト値
      }
      console.log("done")
      return post;
    });
    console.log(promises)
    return Promise.all(promises);
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
      for (const option of toArray(data.option)) {
        nullVote[option] = 0;
      }
  }
  db.addPost(userId, data).then((id) => {
    db.votePost(userId, id, nullVote);
  });
  res.redirect("/");
};

const nullVote = async (postId) => {
  const vote = {};
  const options = await db.getOptions(postId);
  for (const option of options) {
    vote[option] = 0;
  }
  return vote;
};

exports.votePost = async (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect("/");
  }
  const postId = req.params.id;
  const userId = req.user.id;
  const data = req.body;
  const value = data.vote;
  const isVotable = await db.checkVotable(userId, postId);
  if (!isVotable) res.redirect("/");
  db.getPost(postId)
    .then(async (row) => {
      let vote;
      switch (row.vote_type) {
        case "none":
          vote = {};
          break;
        case "up/down":
          vote = { updown: parseFloat(value) };
          break;
        case "radio":
          if (Array.isArray(value))
            throw new Error("択一式なのに複数選択された");
        case "checkbox":
          vote = await nullVote(postId);
          for (const newOption of toArray(data.newOption)) {
            vote[newOption] = 0;
          }
          for (const checked of toArray(value)) {
            vote[checked] = 1;
          }
      }
      console.log("vote", vote);
      return db.votePost(userId, postId, vote);
    })
    .then(() => res.redirect("/")) // 投票後は / へリダイレクト
    .catch((err) => {
      console.error("Failed to vote post:", err);
      res.redirect("/?error=" + encodeURIComponent(err.message));
    });
};
