const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);

const addPost = (userId, data) => {
  const stmt = db.prepare(
    "INSERT INTO posts (user_id, viewer, voter, content, vote_type) VALUES (?, ?, ?, ?, ?)"
  );
  stmt.run(userId, data.viewer, data.voter, data.content, data.voteType);
  stmt.finalize();
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

// 他の投稿関連の関数もここに追加

module.exports = {
  addPost,
  getPost,
  // 他の関数をエクスポート
};
