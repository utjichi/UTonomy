const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);

db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
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

module.exports = {
 getComments
};
