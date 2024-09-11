const updateUser = (id, name, email) => {
  db.run("UPDATE users SET name = ?, email = ? WHERE id = ?", [
    name,
    email,
    id
  ]);
};
const getPosts = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT target FROM permissions WHERE member = ?",
      [userId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  }).then((rows) => {
    rows.push({ target: "world" });
    if (userId) rows.push({ target: "all" });
    return Promise.all(
      rows.map((row) => {
        return new Promise((resolve, reject) => {
          db.all(
            "SELECT * from posts WHERE viewer = ?",
            [row.target],
            (err, rows) => {
              if (err) reject(err);
              resolve(rows);
            }
          );
        }).then((posts) =>
          Promise.all(
            posts.map((post) => {
              switch (post.vote_type) {
                case "up/down":
                  return new Promise((resolve, reject) => {
                    db.all(
                      "SELECT value, COUNT(*) AS count FROM votes WHERE post_id = ? GROUP BY value",
                      [post.id],
                      (err, rows) => {
                        if (err) reject(err);
                        post.votes = {};
                        for (const row of rows) {
                          post.votes[row.value] = row.count;
                        }
                        resolve(post);
                      }
                    );
                  });
                default:
                  post.votes = {};
                  return post;
              }
            })
          )
        );
      })
    ).then((subsets) => {
      return subsets.reduce((a, b) => a.concat(b));
    });
  });
};

const getMyVote = (userId, postId) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM votes WHERE user_id = ? AND post_id = ?",
      [userId, postId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const getPermissions = (member) => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM permissions WHERE member = ?",
      [member],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const getMyGroups = (member) => {
  return getPermissions(member).then((permissions) => {
    const promises = permissions.map((permission) => {
      return getGroup(permission.target).then((group) => {
        permission.group = group;
        return permission;
      });
    });
    return promises ? Promise.all(promises) : [];
  });
};

const checkVotable = (userId, postId) => {
  return getPost(postId).then((row) => {
    return row.voter == "all"
      ? true
      : new Promise((resolve, reject) => {
          db.get(
            "SELECT id FROM permissions WHERE member = ? AND target = ?",
            [userId, row.voter],
            (err, row) => {
              if (err) reject("権限の確認に失敗: " + JSON.stringify(err));
              resolve(row);
            }
          );
        });
  });
};

// 他の関数と一緒にエクスポート
module.exports = {
  addPost,
  getPost,
  getPosts,
  votePost,
  addUser,
  updateUser,
  invite,
  addGroup,
  getMyVote,
  getUser,
  getGroup,
  getPermissions,
  getMyGroups,
  checkVotable,
};