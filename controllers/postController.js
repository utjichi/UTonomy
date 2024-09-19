// controllers/postController.js
const db = require("../db/index");

exports.getPosts = async (req, res) => {
  console.log("getPosts");
  const user = req.isAuthenticated() ? req.user : { id: null };
  try {
    const posts = await db.getPosts(user.id);
    const promises = posts.map(async (post) => {
      try {
        post.isVotable = await db.checkVotable(user.id, post.id);
        if (post.isVotable) {
          post.myVote = await db.getMyVote(user.id, post.id);
        }
        switch (post.vote_type) {
          case "radio":
          case "checkbox":
            post.options = await db.getOptions(post.id);
        }
      } catch (err) {
        console.error("投稿の情報取得に失敗:", err);
        post.myVote = null;
        post.isVotable = false; // デフォルト値
      }
      return post;
    });
    const resolvedPosts = await Promise.all(promises);
    res.render("index", {
      user,
      data: {
        posts: resolvedPosts,
        permissions: await db.getMyGroups(user.id),
      },
      error: null,
    });
  } catch (err) {
    console.error("Failed to retrieve posts:", err);
    res.render("index", { user, data: {}, error: err.message });
  }
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
      const options = Array.isArray(data.option) ? data.option : [data.option];
      for (const option of options) {
        nullVote[option] = 0;
      }
  }
  db.addPost(userId, data).then((id) => {
    console.log(id, nullVote);
    db.votePost(userId, id, nullVote);
  });
  res.redirect("/");
};

const nullVote=async(postId)=>{
  const vote={};
  const options=await db.getOptions(postId)
  for(const option of options){
    vote[option]=0
  }
  return vote
}

exports.votePost = (req, res) => {
  if (req.isAuthenticated()) {
    const postId = req.params.id;
    const userId = req.user.id;
    const value = req.body.vote;
    db.getPost(postId)
      .then((row) => {
        let vote;
        switch (row.vote_type) {
          case "none":
            vote={};
            break;
          case "up/down":
            vote={ updown: parseFloat(value) };
            break;
          case "radio":
            vote=nullVote(postId)
            if(value=="none")break;
            vote[value]=1;
            break;
          case "checkbox":
            vote=nullVote(postId)
            if(!value)break;
            if(Array.isArray(value)){
              for(const checked of value){
                vote[checked]=1
              }
            }else{
              vote[value]=1
            }
        }
        return db.votePost(userId, postId, vote);
      })
      .then(() => res.redirect("/")) // 投票後は / へリダイレクト
      .catch((err) => {
        console.error("Failed to vote post:", err);
        res.redirect("/?error=" + encodeURIComponent(err.message));
      });
  } else {
    res.redirect("/");
  }
};
