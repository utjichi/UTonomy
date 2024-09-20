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
    db.all(
      "SELECT option, value FROM votes WHERE user_id = ? AND post_id = ?",
      [userId, postId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const getOptions = (postId) => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT DISTINCT option FROM votes WHERE post_id = ?",
      [postId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows.map((row) => row.option));
      }
    );
  });
};

const getVotes = (postId,voteType) => {
  switch (voteType) {
    case "up/down":
      return new Promise((resolve, reject) => {
        db.all(
          "SELECT value, COUNT(*) AS count FROM votes WHERE post_id = ? GROUP BY value",
          [postId],
          (err, rows) => {
            if (err) reject(err);
            const votes = {};
            for (const row of rows) {
              votes[row.value] = row.count;
            }
            resolve(votes);
          }
        );
      });
    case "radio":
    case "checkbox":
      return new Promise((resolve, reject) => {
        db.all(
          "SELECT option, SUM(value) AS sum FROM votes WHERE post_id = ? GROUP BY option",
          [postId],
          (err, rows) => {
            if (err) reject(err);
            const votes = {};
            if (rows) {
              for (const row of rows) {
                votes[row.option] = row.sum;
              }
            }
            resolve(votes);
          }
        );
      });
    default:
      return {};
  }
};

// 他の投票関連の関数もここに追加

module.exports = {
  votePost,
  getMyVote,
  getOptions,
  getVotes,
};
