const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);
const posts = require("./posts");

db.run(`CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member TEXT NOT NULL,
    target TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    UNIQUE(id)
  )`);

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
        db.get(
          "SELECT id FROM users WHERE email = ?",
          [invited],
          (err, row) => {
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
          }
        );
      }
    );
  });
};

const getPermissions = (member) => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM permissions WHERE member = ?",
      [member],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const checkPermission=(userId,groupId)=>{
  if(groupId=="world")return true;
  if(groupId=="all")return userId;
  return new Promise((resolve,reject)=>{
    db.get("SELECT id FROM permissions WHERE member = ? AND target = ?",[userId,groupId],(err,row)=>{
      if(err)reject(err);
      else resolve(row)
    })
  })
}

// 他の権限関連の関数もここに追加

module.exports = {
  invite,
  getPermissions,
  checkPermission,
};
