// controllers/postController.js
const lib = require("../lib");
const db = require("../db/index");
const group = require("./groupController");

exports.getPosts = async (userId, group) => {
  console.log("getPosts");
  if(!(await db.checkPermission(userId, group)))return []
  const posts = await db.getPosts(group);
  const promises = posts.map(async (post) => {
    try {
        post.myVote = await db.getMyVote(userId, post.id);
      post.votes = await db.getVotes(post.id);
    } catch (err) {
      console.error("投稿の情報取得に失敗:", err);
      post.myVote = null;
    }
    return post;
  });
  return Promise.all(promises);
};

exports.newPost = async (req, res) => {
  const user = req.isAuthenticated() ? req.user : { id: null };
  try {
    const permissions = await group.getMyGroups(user.id);
    res.render("post", {
      user,
      permissions,
    });
  } catch (err) {
    console.error("Failed to retrieve data:", err);
    res.render("index", {
      user,
      showing: [],
      posts: [],
      permissions: [],
      error: err.message,
    });
  }
};

exports.addPost = (req, res) => {
  console.log("addPost");
  if (req.isAuthenticated()){
  const userId = req.user.id;
  const data = req.body;
  db.addPost(userId, data);}
  res.redirect("/");
};

exports.votePost = async (req, res) => {
  if (req.isAuthenticated()) {
  const postId = req.params.id;
  const userId = req.user.id;
  const isVotable = await db.checkVotable(userId, postId);
  if (!isVotable) res.redirect("/");
  db.getPost(postId)
    .then(async (row) => {
      return db.votePost(userId, postId);
    })
    .then(() => res.redirect("/")) // 投票後は / へリダイレクト
    .catch((err) => {
      console.error("Failed to vote post:", err);
      res.redirect("/?error=" + encodeURIComponent(err.message));
    });}else{res.redirect("/")}
};
