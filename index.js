const express = require("express")
const mysql = require("mysql")
const bodyParser = require("body-parser")
const cors = require("cors")
const dotenv = require("dotenv")
const Mailjet = require("node-mailjet")

dotenv.config()
const app = express()

const db = mysql.createPool({
  host:
    process.env.NODE_ENV === "development"
      ? "localhost"
      : "us-cdbr-east-04.cleardb.com",
  user: process.env.NODE_ENV === "development" ? "root" : "b1601efb83fa98",
  password:
    process.env.NODE_ENV === "development"
      ? process.env.REACT_APP_DB_PASSWORD_DEV
      : "38c7b5a027e51f0",
  database:
    process.env.NODE_ENV === "development"
      ? "WebsiteBlog"
      : "heroku_a0f43feca6ab6ff",
})

app.use(cors(), function (req, res, next) {
  const allowedOrigins = [
    "https://lucia-gomez.netlify.app",
    "http://localhost:3000",
  ]
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
  }
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  )
  next()
})
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get("/api/get", (req, res) => {
  const sql = "SELECT * FROM posts;"
  db.query(sql, (err, result) => {
    res.send(result)
  })
})

app.get("/api/get/:slug", (req, res) => {
  const slug = req.params.slug
  const sql = "SELECT * FROM posts WHERE slug = ?;"
  db.query(sql, slug, (err, result) => {
    res.send(result)
    if (err) console.error(err)
  })
})

app.post("/api/create", (req, res) => {
  const datetime = req.body.datetime
  const dateString = req.body.dateString
  const title = req.body.title
  const summary = req.body.summary
  const content = req.body.content
  const slug = req.body.slug
  const imageUrl = req.body.imageUrl

  const sql =
    "INSERT INTO posts (date, dateString, title, summary, content, slug, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?);"
  db.query(
    sql,
    [datetime, dateString, title, summary, content, slug, imageUrl],
    (err, result) => {
      if (err) console.error(err)
      res.send(result)
    }
  )
})

app.post("/api/like", (req, res) => {
  const id = req.body.id
  const update = "UPDATE posts SET likes = likes + 1 WHERE id = ?;"
  db.query(update, [id], (err, result) => {
    if (err) console.error(err)
    res.send(result)
  })
})

app.post("/api/unlike", (req, res) => {
  const id = req.body.id
  const update = "UPDATE posts SET likes = likes - 1 WHERE id = ?;"
  db.query(update, [id], (err, result) => {
    if (err) console.error(err)
    res.send(result)
  })
})

app.post("/api/likes/reset", (req, res) => {
  const id = req.body.id
  const update = "UPDATE posts SET likes = 0 WHERE id = ?;"
  db.query(update, [id], (err, result) => {
    if (err) console.error(err)
    res.send(result)
  })
})

app.delete("/api/delete/:id", (req, res) => {
  const id = req.params.id
  const sql = "DELETE FROM posts WHERE id = ?;"
  db.query(sql, [id], (err, result) => {
    if (err) console.error(err)
    res.send(result)
  })
})

app.post("/api/update", (req, res) => {
  const id = req.body.id
  const title = req.body.title
  const summary = req.body.summary
  const newContent = req.body.content
  const newDateString = req.body.dateString
  const newImageUrl = req.body.imageUrl
  const sql =
    "UPDATE posts SET dateString = ?, content = ?, title = ?, summary = ?, imageUrl = ? WHERE id = ?;"
  db.query(
    sql,
    [newDateString, newContent, title, summary, newImageUrl, id],
    (err, result) => {
      if (err) console.error(err)
      res.send(result)
    }
  )
})

app.get("/api/draft/get", (req, res) => {
  const sql = "SELECT * from drafts;"
  db.query(sql, (err, result) => {
    if (err) console.error(err)
    res.send(result)
  })
})

app.post("/api/draft/create", (req, res) => {
  const title = req.body.title
  const summary = req.body.summary
  const content = req.body.content
  const slug = req.body.slug
  const imageUrl = req.body.imageUrl
  const sql =
    "INSERT INTO drafts (title, summary, content, slug, imageUrl) VALUES (?, ?, ?, ?, ?);"
  db.query(sql, [title, summary, content, slug, imageUrl], (err, result) => {
    if (err) console.error(err)
    res.send(result)
  })
})

app.delete("/api/draft/:id", (req, res) => {
  const id = req.params.id
  const sql = "DELETE FROM drafts WHERE id = ?;"
  db.query(sql, [id], (err, result) => {
    if (err) console.error(err)
    res.send(result)
  })
})

app.post("/api/draft/update", (req, res) => {
  const id = req.body.id
  const title = req.body.title
  const summary = req.body.summary
  const slug = req.body.slug
  const newContent = req.body.content
  const imageUrl = req.body.imageUrl
  const sql =
    "UPDATE drafts SET content = ?, title = ?, summary = ?, slug = ?, imageUrl = ? WHERE id = ?;"
  db.query(
    sql,
    [newContent, title, summary, slug, imageUrl, id],
    (err, result) => {
      if (err) console.error(err)
      res.send(result)
    }
  )
})

app.get("/api/next/:slug", (req, res) => {
  const slug = req.params.slug
  const sql =
    "SELECT slug FROM posts where id = (SELECT max(id) FROM posts WHERE id < (SELECT id FROM posts WHERE slug = ?));"
  db.query(sql, [slug], (err, result) => {
    if (err) console.error(err)
    res.send(result)
  })
})

app.get("/api/prev/:slug", (req, res) => {
  const slug = req.params.slug
  const sql =
    "SELECT slug FROM posts where id = (SELECT min(id) FROM posts WHERE id > (SELECT id FROM posts WHERE slug = ?));"
  db.query(sql, [slug], (err, result) => {
    if (err) console.error(err)
    res.send(result)
  })
})

/************* MAILJET *************/
const mailjet = Mailjet.connect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
)
// const mailjet = Mailjet.apiConnect(
//   process.env.MJ_APIKEY_PUBLIC,
//   process.env.MJ_APIKEY_PRIVATE
// )

app.post("/api/email/test", (req, res) => {
  const mailjetRequest = mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "lucia@lucia-gomez.dev",
          Name: "Lucia Gomez",
        },
        To: [
          {
            Email: "ilg7@cornell.edu",
          },
        ],
        Subject: "My first Mailjet Email!",
        HTMLPart:
          '<h3>Dear passenger 1, welcome to <a href="https://www.mailjet.com/">Mailjet</a>!</h3><br />May the delivery force be with you!',
      },
    ],
  })
  res.send(mailjetRequest)
})

app.post("/api/email/subscribe", (req, res) => {
  const email = req.body.email
  fetch("https://0r72l.mjt.lu/wgt/0r72l/z96/subscribe?c=149a033f", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ Email: email, Fields: [] }),
  })
    .then(result => {
      if (!result.ok) {
        res.status(400)
        res.send("error")
      } else {
        res.send(result.body)
      }
    })
    .catch(err => {
      console.error(err)
      res.status(400)
    })
})

app.get("/api/email/subscribers", (req, res) => {
  const mailjetRequest = mailjet
    .get("contactslist", {
      version: "v3",
      // proxyUrl: "https://peaceful-stream-10554.herokuapp.com",
    })
    .id(10308929)
    .request()
  mailjetRequest
    .then(result => {
      res.send(result.body)
    })
    .catch(err => console.error(err))
})

const PORT = 3001

app.listen(process.env.PORT || PORT, () => {
  console.log("server is running")
})
