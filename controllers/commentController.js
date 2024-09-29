const post = require("./postController");
const db = require("../db/index");

exports.comments = async (req, res) => {
  const user=req.user
  try {
    const postId = req.params.id;
    if (
      !post.checkPermission(req.isAuthenticated() ? user.id : null, postId)
    )
      throw "権限なし";
    // 権限あり
    res.render("comments", {
      user,
      post: await post.getPost(user?user.id:null,postId),
      comments: await db.getComments(postId),
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.render("comments",{
      user,
      post:{},
      comments:[],
      error
    });
  }
};

exports.newComment = async (req, res) => {
  const postId = req.params.id;
  if (req.isAuthenticated()) {
    const user = req.user;
    try {
      if (!post.checkPermission(req.user.id, postId)) throw "権限なし";
      // 権限あり
      res.render("comment", {
        user,
        post: await db.getPost(postId),
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
  } else {
    res.render("comment", {
      user: null,
      post: await db.getPost(postId),
    });
  }
};

exports.addComment = async (req, res) => {
  const data = req.body;
  const postId = req.params.id;
  if (req.isAuthenticated()) {
    const userId = req.user.id;
    try {
      if (!(await post.checkPermission(userId, postId))) throw "権限なし";
      db.addComment(userId, postId, data);
    } catch (err) {
      console.error(err);
    }
  }
  res.redirect("/comments/" + postId);
};
