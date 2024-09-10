const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);

const addUser = (id, name, email) => {
  db.run("INSERT INTO users (id, name, email) VALUES (?, ?, ?)", [
    id,
    name,
    email,
  ]);
};

const getUser = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// 他のユーザー関連の関数もここに追加

module.exports = {
  addUser,
  getUser,
  // 他の関数をエクスポート
};
