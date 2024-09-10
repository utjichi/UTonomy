const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);

const invite = (inviter, groupId, invited) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM permissions WHERE member = ? AND target = ?",
      [inviter, groupId],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return reject("権限がありません");
        if (!(row.role == "owner" || row.role == "admin"))
          return reject("権限がありません");
        db.get("SELECT id FROM users WHERE email = ?", [invited], (err, row) => {
          if (err) return reject(err);
          if (!row) return reject(`ユーザー${invited}は存在しません`);
          db.get(
            "SELECT id from permissions WHERE member = ? AND target = ?",
            [row.id, groupId],
            (err, existing) => {
              if (err) return reject(err);
              if (existing)
                return reject(`ユーザー${invited}はすでに参加しています`);
              else {
                db.run(
                  "INSERT INTO permissions (member,target) VALUES (?,?)",
                  [row.id, groupId],
                  (err) => {
                    if (err) return reject(err);
                    resolve(this.changes);
                  }
                );
              }
            }
          );
        });
      }
    );
  });
};

// 他の権限関連の関数もここに追加

module.exports = {
  invite,
  // 他の関数をエクスポート
};
