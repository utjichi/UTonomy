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
    });
  } catch (err) {
    console.error(err)
    res.redirect("/?error="+err);
  }
};

exports.addComment = (req, res) => {};
