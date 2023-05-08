const bodyParser = require("body-parser")
const cors = require("cors")
const CryptoJS = require("crypto-js")
const dotenv = require("dotenv")
const express = require("express")
const fs = require("fs")
const Mailjet = require("node-mailjet")
const mysql = require("mysql")

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

function isValidEmail(email) {
  const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  return regex.test(email)
}

function hashEmail(email) {
  return encodeURIComponent(
    CryptoJS.AES.encrypt(email, process.env.ENCRYPT_KEY)
  )
}

function unhashEmail(emailHash) {
  const decodedHash = decodeURIComponent(emailHash)
  const emailBytes = CryptoJS.AES.decrypt(decodedHash, process.env.ENCRYPT_KEY)
  return emailBytes.toString(CryptoJS.enc.Utf8)
}

function sendToList(contacts, subject, content, res) {
  const unsubscribe =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/unsubscribe/"
      : "https://lucia-gomez.dev/unsubscribe/"
  const newsletterTemplate = fs.readFileSync(
    "./newsletterTemplate.html",
    "utf8"
  )
  const emails = contacts
    .map(contact => contact.email)
    .filter(email => email != null && email.trim().length > 0)

  Promise.all(
    emails.map(email =>
      mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: "lucia@lucia-gomez.dev",
              Name: "Lucia Gomez",
            },
            To: [
              {
                Email: email,
              },
            ],
            Subject: subject,
            TemplateLanguage: true,
            HTMLPart: newsletterTemplate,
            Variables: {
              title: subject,
              custom_unsubscribe: unsubscribe + hashEmail(email),
              content,
            },
          },
        ],
      })
    )
  )
    .then(result => res.send(result))
    .catch(err => console.error(err))
}

app.post("/api/email/sendTest", (req, res) => {
  const subject = req.body.subject
  const content = req.body.content

  const sqlContacts = "SELECT email FROM subscribersTest;"
  db.query(sqlContacts, (err, result) => {
    if (err) {
      console.error(err)
      res.status(400)
      res.send(err)
    } else {
      sendToList(result, subject, content, res)
    }
  })
})

app.post("/api/email/send", (req, res) => {
  const subject = req.body.subject
  const content = req.body.content

  const sqlContacts = "SELECT email FROM subscribers;"
  db.query(sqlContacts, (err, result) => {
    if (err) {
      console.error(err)
      res.status(400)
      res.send(err)
    } else {
      sendToList(result, subject, content, res)
    }
  })
})

app.post("/api/email/confirm", (req, res) => {
  const email = req.body.email
  if (!isValidEmail(email)) {
    res.status(400)
    res.send(JSON.stringify({ error: "Error subscribing, invalid email" }))
    return
  }

  const confLink =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000/confirmation/"
      : "https://lucia-gomez.dev/confirmation/"
  const emailHash = hashEmail(email)
  const confTemplate = fs.readFileSync("./confirmationTemplate.html", "utf8")

  const mailjetRequest = mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "lucia@lucia-gomez.dev",
          Name: "Lucia Gomez",
        },
        To: [
          {
            Email: email,
          },
        ],
        Subject: "Confirm Subscription - lucia-gomez.dev",
        TemplateLanguage: true,
        HTMLPart: confTemplate,
        Variables: {
          confirmation_link: confLink + emailHash,
        },
      },
    ],
  })
  res.send(mailjetRequest)
})

app.post("/api/email/subscribe/:emailHash", (req, res) => {
  const emailHash = req.params.emailHash
  const email = unhashEmail(emailHash)
  if (!isValidEmail(email)) {
    res.status(400)
    res.send(JSON.stringify({ error: "Error subscribing, invalid email" }))
    return
  }

  const dateAdded = new Date().toISOString().slice(0, 19).replace("T", " ")

  const sql = "INSERT INTO subscribers (email, dateAdded) VALUES (?, ?);"
  db.query(sql, [email, dateAdded], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        console.error(err)
        res.status(409)
      } else {
        res.status(400)
      }
    }
    res.send(result)
  })
})

app.delete("/api/email/unsubscribe/:emailHash", (req, res) => {
  const emailHash = req.params.emailHash
  const email = unhashEmail(emailHash)
  if (!isValidEmail(email)) {
    res.status(400)
    res.send(JSON.stringify({ error: "Error subscribing, invalid email" }))
    return
  }

  const sql = "DELETE FROM subscribers WHERE email = ?;"
  db.query(sql, [email], (err, result) => {
    if (err) console.error(err)
    res.send(result)
  })
})

app.get("/api/email/subscriberCount", (_, res) => {
  const sql = "SELECT COUNT(*) FROM subscribers;"
  db.query(sql, (err, result) => {
    if (err) console.error(err)
    res.send(JSON.stringify(result[0]["COUNT(*)"]))
  })
})

const PORT = 3001

app.listen(process.env.PORT || PORT, () => {
  console.log("server is running")
})
