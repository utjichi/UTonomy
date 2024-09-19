const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);

// Create the votes table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    post_id INTEGER NOT NULL,
    option TEXT,
    value REAL,
    UNIQUE(user_id, post_id, option)
  )`);

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

const getOptions = (postId, voter) => {
  console.log("getOptions")
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT option FROM votes WHERE post_id = ? AND user_id = ?",
      [postId, voter],
      (err, rows) => {
        if (err) reject(err);
        return rows.map((row) => row.option);
      }
    );
  });
};

// 他の投票関連の関数もここに追加

module.exports = {
  votePost,
  getMyVote,
  getOptions,
};
