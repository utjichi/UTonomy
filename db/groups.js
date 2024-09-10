const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);

const addGroup = (userId, name) => {
  const groupId = uuidv4();
  db.run("INSERT INTO groups (id,name) VALUES (?,?)", [groupId, name]);
  db.run("INSERT INTO permissions (member,target,role) VALUES (?,?,?)", [
    userId,
    groupId,
    "owner",
  ]);
};

const getGroup = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM groups WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// 他のグループ関連の関数もここに追加

module.exports = {
  addGroup,
  getGroup,
  // 他の関数をエクスポート
};
