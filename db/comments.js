const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);

db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    post_id INTEGER NOT NULL,
    nickname TEXT NOT NULL
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    UNIQUE(id)
  )`);

const getComments=(postId)=>{
  return new Promise((resolve,reject)=>{db.all("SELECT * FROM comments WHERE post_id = ?",[postId],(err,rows)=>{
    if(err)reject(err);
    else resolve(rows)
  })})
}

const addComment = (userId, data) => {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO comments (user_id, post_id, nickname, content, timestamp) VALUES (?, ?, ?, ?, ?)",
      [
        userId,
        data.postId,
        data.nickname,
        data.content,
        Date.now(),
      ],
      function (err) {
        if (err) reject(err);
        console.log(this.lastID);
        resolve(this.lastID);
      }
    );
  });
};

module.exports = {
  getComments,
  addComment
};
