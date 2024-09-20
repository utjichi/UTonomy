// controllers/groupController.js
const db = require("../db/index");

exports.getUser = async (req, res) => {
  if (req.isAuthenticated()) {
    res.render("user", { user: req.user, error: null });
  } else {
    res.render("index", { user: req.user, posts: [], error: null });
  }
};

exports.getMyGroups=async(userId)=>{
  console.log("getMyGroups")
  return db.getMyGroups(userId)
}

exports.group=async (req,res)=>{
  if (req.isAuthenticated()) {
    try {
      const permissions = await db.getMyGroups(req.user.id);
      res.render("group", { user: req.user, permissions, error: req.query.error });
    } catch (err) {
      console.error("Failed to retrieve groups:", err);
      res.render("group", {
        user: req.user,
        permissions: [],
        error: err.message,
      });
    }
  } else {
    res.redirect("/");
  }
}

exports.addGroup = (req, res) => {
  if (req.isAuthenticated()) {
    db.addGroup(req.user.id, req.body.name)
  }
  res.redirect("/group") // グループ作成後は / へリダイレクト
};

exports.inviteUser = (req, res) => {
  if (req.isAuthenticated()) {
    const groupId = req.params.id;
    const inviter = req.user.id;
    const invited = req.body.email + "@g.ecc.u-tokyo.ac.jp";
    db.invite(inviter, groupId, invited)
      .then(() => res.redirect("/user")) // 招待後は /user へリダイレクト
      .catch((err) => {
        console.error("招待エラー:", err);
        res.redirect("/group?error=" + encodeURIComponent(err));
      });
  } else {
    res.redirect("/");
  }
};
