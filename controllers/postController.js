// controllers/postController.js
const lib = require("../lib");
const db = require("../db/index");
const group = require("./groupController");

const getPost=async(userId,postId)=>{
  const post=await db.getPost(postId);
  post.myVote = userId?await db.getMyVote(userId, postId):null;
  post.votes = await db.getVotes(postId);
  return post;
}

const getPosts = async (userId, label) => {
  if (!(await db.checkPermission(userId, label))) return [];
  const posts = await db.getPosts(label);
  const promises = posts.map(async (post) => {
    try {
      post=await getPost(userId,post.id)
    } catch (err) {
      console.error("投稿の情報取得に失敗:", err);
      post.myVote = null;
    }
    return post;
  });
  return Promise.all(promises);
};

const newPost = async (req, res) => {
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
  } else {
    res.render("post", {
      user: null,
      permissions: [],
    });
  }
};

const addPost = async(req, res) => {
  console.log("addPost");
  if (req.isAuthenticated()) {
    const userId = req.user.id;
    const data = req.body;
    try{
      if(!(await db.checkPermission(userId, data.label)))throw "権限なし"
      db.addPost(userId, data);
    }catch(err){
      console.error(err)
    }
  }
  res.redirect("/");
};

const checkPermission = async (userId, postId) => {
  const post = await db.getPost(postId);
  return db.checkPermission(userId, post.label);
};

const votePost = async (req, res) => {
  try {
    if (!req.isAuthenticated()) throw "ログインしてない";
    const postId = req.params.id;
    const userId = req.user.id;
    const isVotable = await checkPermission(userId, postId);
    if (!isVotable) throw "権限なし";
    db.getPost(postId)
      .then(async (row) => {
        return db.votePost(userId, postId);
      })
      .then(() => res.redirect(req.body.show)) // 投票後は / へリダイレクト
      .catch((err) => {
        console.error("Failed to vote post:", err);
        res.redirect("/?error=" + encodeURIComponent(err.message));
      });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
};

module.exports = {
  getPost,
  getPosts,
  newPost,
  addPost,
  votePost,
  checkPermission,
};
