const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        post_id INTEGER NOT NULL,
        vote_type TEXT NOT NULL, -- 'upvote' または 'downvote'
        UNIQUE(user_id, post_id) -- ユーザーと投稿の組み合わせがユニークであることを保証
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
        if (row)
          return reject(new Error("User has already voted on this post"));

        db.run(
          "INSERT INTO votes (user_id, post_id, vote_type) VALUES (?, ?, 'upvote')",
          [userId, postId],
          function (err) {
            if (err) return reject(err);
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
        if (row)
          return reject(new Error("User has already voted on this post"));

        db.run(
          "INSERT INTO votes (user_id, post_id, vote_type) VALUES (?, ?, 'downvote')",
          [userId, postId],
          function (err) {
            if (err) return reject(err);
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
    );
  });
};

const getPosts = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM posts ORDER BY timestamp DESC", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = { addPost, getPosts, upvotePost, downvotePost };
