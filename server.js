const express = require('express');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// DB (file in project root)
const db = new sqlite3.Database(path.join(__dirname, 'subscribers.db'));
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve static site
app.use(express.static(path.join(__dirname)));

// subscribe endpoint
app.post('/subscribe', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email' });
  }

  const sql = 'INSERT OR IGNORE INTO subscribers (email) VALUES (?)';
  db.run(sql, [email], function (err) {
    if (err) return res.status(500).json({ success: false, message: 'DB error' });
    if (this.changes === 0) {
      // email already exists
      return res.json({ success: true, message: 'Email already subscribed' });
    }
    return res.json({ success: true, message: 'Subscribed successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});