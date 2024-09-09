const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);
const { v4: uuidv4 } = require("uuid");

db.serialize(() => {
  // Create the posts table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    viewer TEXT NOT NULL,
    voter TEXT,
    content TEXT NOT NULL,
    vote_type TEXT DEFAULT "none",
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create the votes table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    post_id INTEGER NOT NULL,
    option TEXT,
    value REAL,
    UNIQUE(user_id, post_id, option)
  )`);

  // Create the users table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    UNIQUE(id)
  )`);

  // Create the groups table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    member_limit INTEGER,
    UNIQUE(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member TEXT NOT NULL,
    target TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    UNIQUE(id)
  )`);
});

const addPost = (userId, data) => {
  const stmt = db.prepare(
    "INSERT INTO posts (user_id, viewer, voter, content, vote_type) VALUES (?, ?, ?, ?, ?)"
  );
  stmt.run(userId, data.viewer, data.voter, data.content, data.voteType);
  stmt.finalize();
};

const votePost = (userId, postId, vote) => {
  return new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM votes WHERE user_id = ? AND post_id = ?",
      [userId, postId],
      (err) => {
        if (err) reject(err);
        resolve();
      }
    );
  }).then(() => {
    return Promise.all(
      Object.entries(vote).map(
        (entry) =>
          new Promise((resolve, reject) => {
            db.run(
              "INSERT INTO votes (user_id, post_id, option, value) VALUES (?, ?, ?, ?)",
              [userId, postId, entry[0], entry[1]],
              (err) => {
                if (err) reject(err);
                resolve();
              }
            );
          })
      )
    );
  });
};

const addUser = (id, name, email) => {
  db.run("INSERT INTO users (id, name, email) VALUES (?, ?, ?)", [
    id,
    name,
    email,
  ]);
};

const invite = (inviter, groupId, invited) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM permissions WHERE member = ? AND target = ?",
      [inviter, groupId],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return reject("権限がありません");
        if (!(row.role == "owner" || row.role == "admin"))
          return reject("権限がありません");
        db.get("SELECT id FROM users WHERE id = ?", [invited], (err, row) => {
          if (err) return reject(err);
          if (!row) return reject(`ユーザー${invited}は存在しません`);
          db.get(
            "SELECT id from permissions WHERE member = ? AND target = ?",
            [invited, groupId],
            (err, existing) => {
              if (err) return reject(err);
              if (existing)
                return reject(`ユーザー${invited}はすでに参加しています`);
              else {
                db.run(
                  "INSERT INTO permissions (member,target) VALUES (?,?)",
                  [invited, groupId],
                  (err) => {
                    if (err) return reject(err);
                    resolve(this.changes);
                  }
                );
              }
            }
          );
        });
      }
    );
  });
};

const addGroup = (userId, name) => {
  const groupId = uuidv4();
  db.run("INSERT INTO groups (id,name) VALUES (?,?)", [groupId, name]);
  db.run("INSERT INTO permissions (member,target,role) VALUES (?,?,?)", [
    userId,
    groupId,
    "owner",
  ]);
};

const getPost = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * from posts WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      if (row) resolve(row);
      reject("投稿が見つかりません");
    });
  });
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

const getUser = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const getGroup = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM groups WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
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
  invite,
  addGroup,
  getMyVote,
  getUser,
  getGroup,
  getPermissions,
  getMyGroups,
  checkVotable,
};