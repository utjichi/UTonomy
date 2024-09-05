const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);
const { v4: uuidv4 } = require("uuid");

db.serialize(() => {
  // Create the posts table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create the votes table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    post_id INTEGER NOT NULL,
    vote_type TEXT NOT NULL,
    UNIQUE(user_id, post_id)
  )`);

  // Create the users table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    UNIQUE(id)
  )`);

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

const addPost = (userId, content) => {
  const stmt = db.prepare("INSERT INTO posts (user_id, content) VALUES (?, ?)");
  stmt.run(userId, content);
  stmt.finalize();
};

const upvotePost = (userId, postId) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM votes WHERE user_id = ? AND post_id = ?",
      [userId, postId],
      (err, row) => {
        if (err) return reject(err);

        if (row) {
          // すでに投票している場合
          if (row.vote_type === "upvote") {
            // 既存のupvoteを取り消す
            db.run(
              "DELETE FROM votes WHERE user_id = ? AND post_id = ?",
              [userId, postId],
              function (err) {
                if (err) return reject(err);
                // 投稿のupvote数を更新
                db.run(
                  "UPDATE posts SET upvotes = upvotes - 1 WHERE id = ?",
                  postId,
                  function (err) {
                    if (err) return reject(err);
                    resolve(this.changes);
                  }
                );
              }
            );
          } else {
            // 既存の投票をupvoteに更新
            db.run(
              "UPDATE votes SET vote_type = 'upvote' WHERE user_id = ? AND post_id = ?",
              [userId, postId],
              function (err) {
                if (err) return reject(err);
                // 投稿のupvote数を更新
                db.run(
                  "UPDATE posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?",
                  postId,
                  function (err) {
                    if (err) return reject(err);
                    resolve(this.changes);
                  }
                );
              }
            );
          }
        } else {
          // 投票を追加
          db.run(
            "INSERT INTO votes (user_id, post_id, vote_type) VALUES (?, ?, 'upvote')",
            [userId, postId],
            function (err) {
              if (err) return reject(err);
              // 投稿のupvote数を更新
              db.run(
                "UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?",
                postId,
                function (err) {
                  if (err) return reject(err);
                  resolve(this.changes);
                }
              );
            }
          );
        }
      }
    );
  });
};

const downvotePost = (userId, postId) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM votes WHERE user_id = ? AND post_id = ?",
      [userId, postId],
      (err, row) => {
        if (err) return reject(err);

        if (row) {
          // すでに投票している場合
          if (row.vote_type === "downvote") {
            // 既存のdownvoteを取り消す
            db.run(
              "DELETE FROM votes WHERE user_id = ? AND post_id = ?",
              [userId, postId],
              function (err) {
                if (err) return reject(err);
                // 投稿のdownvote数を更新
                db.run(
                  "UPDATE posts SET downvotes = downvotes - 1 WHERE id = ?",
                  postId,
                  function (err) {
                    if (err) return reject(err);
                    resolve(this.changes);
                  }
                );
              }
            );
          } else {
            // 既存の投票をdownvoteに更新
            db.run(
              "UPDATE votes SET vote_type = 'downvote' WHERE user_id = ? AND post_id = ?",
              [userId, postId],
              function (err) {
                if (err) return reject(err);
                // 投稿のdownvote数を更新
                db.run(
                  "UPDATE posts SET downvotes = downvotes + 1, upvotes = upvotes - 1 WHERE id = ?",
                  postId,
                  function (err) {
                    if (err) return reject(err);
                    resolve(this.changes);
                  }
                );
              }
            );
          }
        } else {
          // 投票を追加
          db.run(
            "INSERT INTO votes (user_id, post_id, vote_type) VALUES (?, ?, 'downvote')",
            [userId, postId],
            function (err) {
              if (err) return reject(err);
              // 投稿のdownvote数を更新
              db.run(
                "UPDATE posts SET downvotes = downvotes + 1 WHERE id = ?",
                postId,
                function (err) {
                  if (err) return reject(err);
                  resolve(this.changes);
                }
              );
            }
          );
        }
      }
    );
  });
};

const invite = (inviter, groupId, invited) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM permissions WHERE member = ? AND target = ?",
      [inviter, groupId],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return reject("権限がありません");
        if (!(row.role == "owner" || row.role == "admin")) return reject("権限がありません");
        db.get("SELECT id from users WHERE id = ?",[invited],())
        db.get(
          "SELECT id from permissions WHERE member = ? AND target = ?",
          [invited, groupId],
          (err, existing) => {
            if (err) return reject(err);
            if (existing) return reject("そのユーザーはすでに参加しています");
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

const getPosts = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM posts ORDER BY timestamp DESC", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getVote = (userId, postId) => {
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
      if (err) return reject(err);
      else resolve(row);
    });
  });
};

const getGroup = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM groups WHERE id = ?", [id], (err, row) => {
      if (err) return reject(err);
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

// 他の関数と一緒にエクスポート
module.exports = {
  addPost,
  getPosts,
  upvotePost,
  downvotePost,
  invite,
  addGroup,
  getVote,
  getUser,
  getGroup,
  getPermissions,
};
