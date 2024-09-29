// controllers/homeController.js
const post = require("./postController");
const group = require("./groupController");

exports.showHome = async (req, res) => {
  console.log("showHome");
  if (req.isAuthenticated()) {
    const user=req.user;
    try {
      const permissions = await group.getMyGroups(user.id);
      const showing = req.query.show || "world";
      const posts = await post.getPosts(user.id, showing);
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
        showing: [],
        posts: [],
        permissions: [],
        error: err.message,
      });
    }
  }else{
      const showing = "world";
      const posts = await post.getPosts(null, showing);
      res.render("index", {
        user:null,
        showing,
        posts,
        permissions: [],
        error:null
      });
  }
};
