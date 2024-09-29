const db = require("../db/index");

exports.comments = async (req, res) => {
  try {
    const postId=req.params.id;
    if(req.isAuthenticated())
    const user = req.user;
    res.render("comments", { user: req.user });
  } catch (err) {
    res.redirect("/");
  }
};

exports.addComment = (req, res) => {};
