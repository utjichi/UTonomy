// controllers/homeController.js
const post=require("./postController")
const group=require("./groupController")

exports.showHome=async(req, res) => {
  const user = req.isAuthenticated() ? req.user : { id: null };
  try {
    res.render("index", {
      user,
      data: {
        posts: await post.getPosts(user),
        permissions: await group.getMyGroups(user.id),
      },
      error: null,
    });
  } catch (err) {
    console.error("Failed to retrieve posts:", err);
    res.render("index", { user, data: {}, permissions:[], error: err.message });
  }
}