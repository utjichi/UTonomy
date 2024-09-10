const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);

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

// 他の投票関連の関数もここに追加

module.exports = {
  votePost,
  // 他の関数をエクスポート
};
