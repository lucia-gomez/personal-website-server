const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'WebsiteBlog'
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/get", (req, res) => {
  const sql = "SELECT * FROM posts;"
  db.query(sql, (err, result) => {
    res.send(result);
  });
})

app.post("/api/create", (req, res) => {
  const datetime = req.body.datetime;
  const dateString = req.body.dateString;
  const title = req.body.title;
  const summary = req.body.summary;
  const content = req.body.content;
  const slug = req.body.slug;

  const sql = "INSERT INTO posts (date, dateString, title, summary, content, slug) VALUES (?, ?, ?, ?, ?, ?);";
  db.query(sql, [datetime, dateString, title, summary, content, slug], (err, result) => {
    console.error(err);
  });
});

app.post("/api/like", (req, res) => {
  const id = req.body.id;
  const update = "UPDATE posts SET likes = likes + 1 WHERE id = ?;"
  db.query(update, [id], (err, result) => {
    console.error(err);
  });
});

app.post("/api/unlike", (req, res) => {
  const id = req.body.id;
  const update = "UPDATE posts SET likes = likes - 1 WHERE id = ?;"
  db.query(update, [id], (err, result) => {
    console.error(err);
  });
});

app.listen(3001, () => {
  console.log("server is running on port 3001");
});