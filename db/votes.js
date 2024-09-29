const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);

// Create the votes table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    post_id INTEGER NOT NULL,
    UNIQUE(user_id, post_id)
  )`);

const votePost = (userId, postId) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id FROM votes WHERE user_id = ? AND post_id = ?",
      [userId, postId],
      (err, row) => {
        if (err) reject(err);
        if (row) {
          db.run(
            "DELETE FROM votes WHERE user_id = ? AND post_id = ?",
            [userId, postId],
            (err) => {
              if (err) reject(err);
              resolve();
            }
          );
        } else {
          db.run(
            "INSERT INTO votes (user_id, post_id) VALUES (?, ?)",
            [userId, postId],
            (err) => {
              if (err) reject(err);
              resolve();
            }
          );
        }
      }
    );
  });
};

const getMyVote = (userId, postId) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id FROM votes WHERE user_id = ? AND post_id = ?",
      [userId, postId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const getVotes = (postId, voteType) => {
      return new Promise((resolve, reject) => {
        db.get(
          "SELECT COUNT(*) AS count FROM votes WHERE post_id = ?",
          [postId],
          (err, row) => {
            if (err) reject(err);
            resolve(row.count);
          }
        );
      });
};

// 他の投票関連の関数もここに追加

module.exports = {
  votePost,
  getMyVote,
  getVotes,
};
