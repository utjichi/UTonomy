const post = require("./postController");
const db = require("../db/index");

exports.comments = async (req, res) => {
  try {
    const postId = req.params.id;
    if (
      !post.checkPermission(req.isAuthenticated() ? req.user.id : null, postId)
    )
      throw "権限なし";
    // 権限あり
    res.render("comments", {
      user: req.user,
      title: (await db.getPost(postId)).title,
      comments: await db.getComments(postId),
      error:null
    });
  } catch (err) {
    console.error(err)
    res.redirect("/?error="+err);
  }
};

exports.newComment = async (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user;
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
  }
};

exports.addComment = (req, res) => {};
