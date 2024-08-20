const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/posts.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

const addPost = (userId, content) => {
    const stmt = db.prepare('INSERT INTO posts (user_id, content) VALUES (?, ?)');
    stmt.run(userId, content);
    stmt.finalize();
};

const getPosts = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM posts ORDER BY timestamp DESC', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

module.exports = { addPost, getPosts };
