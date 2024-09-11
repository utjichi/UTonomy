const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(process.env.DATABASE_URL);

// Create the posts table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    nickname TEXT DEFAULT "東大構成員",
    viewer TEXT NOT NULL,
    voter TEXT,
    content TEXT NOT NULL,
    vote_type TEXT DEFAULT "none",
    timestamp INTEGER NOT NULL
  )`);

const addPost = (userId, data) => {
  const stmt = db.prepare(
    "INSERT INTO posts (user_id, nickname, viewer, voter, content, vote_type, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  stmt.run(
    userId,
    data.nickname,
    data.viewer,
    data.voter,
    data.content,
    data.voteType,
    Date.now()
  );
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

const getPosts = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT target FROM permissions WHERE member = ?",
      [userId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  }).then((rows) => {
    rows.push({ target: "world" });
    if (userId) rows.push({ target: "all" });
    return Promise.all(
      rows.map((row) => {
        return new Promise((resolve, reject) => {
          db.all(
            "SELECT * from posts WHERE viewer = ?",
            [row.target],
            (err, rows) => {
              if (err) reject(err);
              resolve(rows);
            }
          );
        }).then((posts) =>
          Promise.all(
            posts.map((post) => {
              switch (post.vote_type) {
                case "up/down":
                  return new Promise((resolve, reject) => {
                    db.all(
                      "SELECT value, COUNT(*) AS count FROM votes WHERE post_id = ? GROUP BY value",
                      [post.id],
                      (err, rows) => {
                        if (err) reject(err);
                        post.votes = {};
                        for (const row of rows) {
                          post.votes[row.value] = row.count;
                        }
                        resolve(post);
                      }
                    );
                  });
                default:
                  post.votes = {};
                  return post;
              }
            })
          )
        );
      })
    ).then((subsets) => {
      return subsets.reduce((a, b) => a.concat(b));
    });
  });
};

// 他の投稿関連の関数もここに追加

module.exports = {
  addPost,
  getPost,
  getPosts,
};
