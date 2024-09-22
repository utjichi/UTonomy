const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);

// Create the posts table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    nickname TEXT DEFAULT "東大構成員",
    viewer TEXT NOT NULL,
    voter TEXT,
    content TEXT NOT NULL,
    vote_type TEXT DEFAULT "none",
    timestamp INTEGER NOT NULL
  )`);

const addPost = (userId, data) => {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO posts (user_id, nickname, viewer, voter, content, vote_type, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        data.nickname,
        data.viewer,
        data.voter,
        data.content,
        data.voteType,
        Date.now(),
      ],
      function (err) {
        if (err) reject(err);
        console.log(this.lastID);
        resolve(this.lastID);
      }
    );
  });
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

const getPosts = (groups) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * from posts WHERE viewer IN (${groups.map(() => "?").join(",")}) ORDER BY timestamp`,
      groups,
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  });
};

const getPoster = (postId) => {
  console.log("getPoster");
  return new Promise((resolve, reject) => {
    db.get("SELECT user_id FROM posts WHERE id = ?", postId, (err, row) => {
      if (err) reject(err);
      resolve(row.user_id);
    });
  });
};

// 他の投稿関連の関数もここに追加

module.exports = {
  addPost,
  getPost,
  getPosts,
  getPoster,
};
