// controllers/homeController.js
const post = require("./postController");
const group = require("./groupController");

exports.showHome = async (req, res) => {
  console.log("showHome");
  const user = req.isAuthenticated() ? req.user : { id: null };
  try {
    const permissions = await group.getMyGroups(user.id);
    const showing = req.query.show;
    console.log(showing);
    const posts = await post.getPosts(user.id);
    res.render("index", {
      user,
      showing,
        posts,
        permissions,
      error: null,
    });
  } catch (err) {
    console.error("Failed to retrieve posts:", err);
    res.render("index", {
      user,
      data: {},
      permissions: [],
      error: err.message,
    });
  }
};
