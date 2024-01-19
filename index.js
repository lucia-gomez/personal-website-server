const bodyParser = require("body-parser")
const cors = require("cors")
const CryptoJS = require("crypto-js")
const dotenv = require("dotenv")
const express = require("express")
const fs = require("fs")
const ImageKit = require("imagekit")
const Mailjet = require("node-mailjet")
const { connectDB, getId, getDatbaseName } = require("./db")

const PostsModel = require("./models/postModel")
const DraftsModel = require("./models/draftModel")
const {
  SubscribersModel,
  SubscribersTestModel,
} = require("./models/subscriberModel")

dotenv.config()
const app = express()
if (process.env.NODE_ENV != "testBackend") {
  /* istanbul ignore next */
  connectDB()
}

/* istanbul ignore next */
app.use(cors(), function (req, res, next) {
  const allowedOrigins = [
    "https://lucia-gomez.dev",
    "https://www.lucia-gomez.dev",
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

const imagekit = new ImageKit({
  publicKey: "public_CJFqG4/4bWXjKN1kfmDaT7UlKC4=",
  privateKey: process.env.IMAGEKIT_PRIVATE,
  urlEndpoint: "https://ik.imagekit.io/5xtlzx2c3y",
})

app.get("/api/posts", (req, res) => {
  PostsModel.find({})
    .then(docs => {
      res.send(docs)
    })
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

app.get("/api/posts/:slug", (req, res) => {
  const slug = req.params.slug
  PostsModel.findOne({ slug })
    .then(doc => {
      if (doc) {
        res.send(doc)
      } else {
        res.status(404).json({ error: "Item not found" })
      }
    })
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

app.post("/api/posts", (req, res) => {
  const datetime = req.body.datetime
  const dateString = req.body.dateString
  const title = req.body.title
  const summary = req.body.summary
  const content = req.body.content
  const slug = req.body.slug
  const imageUrl = req.body.imageUrl

  PostsModel.create({
    _id: getId(),
    title,
    summary,
    content,
    slug,
    imageUrl,
    dateString,
    date: datetime,
    likes: 0,
  })
    .then(result => res.send(result))
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

app.put("/api/posts/likes", (req, res) => {
  const id = req.body.id
  const mode = req.body.mode

  let op, sel
  switch (mode) {
    case -1: // unlike
      sel = { _id: id, likes: { $gt: 0 } }
      op = { $inc: { likes: -1 } }
      break
    case 0: // reset likes
      sel = { _id: id }
      op = { $set: { likes: 0 } }
      break
    case 1:
      sel = { _id: id }
      op = { $inc: { likes: 1 } }
      break
  }

  if (op == null || sel == null) {
    res
      .status(400)
      .json({
        error:
          "Invalid mode number: should be -1 to unlike, 1 to like, or 0 to reset likes",
      })
      .send()
  }

  PostsModel.updateOne(sel, op)
    .then(result => {
      res.send(result)
    })
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

app.delete("/api/posts/:id", (req, res) => {
  const id = req.params.id
  PostsModel.deleteOne({ _id: id })
    .then(result => {
      if (result.deletedCount === 0) {
        return res.status(400).send("Post not found or already deleted.")
      }

      res.send(result)
    })
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

app.put("/api/posts/:id", (req, res) => {
  const id = req.params.id
  const title = req.body.title
  const summary = req.body.summary
  const content = req.body.content
  const dateString = req.body.dateString
  const imageUrl = req.body.imageUrl
  const slug = req.body.slug
  PostsModel.updateOne(
    { _id: id },
    { $set: { title, summary, content, dateString, imageUrl, slug } }
  )
    .then(result => {
      res.send(result)
    })
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

app.get("/api/drafts", (req, res) => {
  DraftsModel.find({})
    .then(docs => {
      res.send(docs)
    })
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

app.post("/api/drafts", (req, res) => {
  const title = req.body.title
  const summary = req.body.summary
  const content = req.body.content
  const slug = req.body.slug
  const imageUrl = req.body.imageUrl
  const dateString = req.body.dateString
  DraftsModel.create({
    _id: getId(),
    title,
    summary,
    content,
    slug,
    imageUrl,
    dateString,
  })
    .then(result => {
      res.send(result)
    })
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

app.delete("/api/drafts/:id", (req, res) => {
  const id = req.params.id
  DraftsModel.deleteOne({ _id: id })
    .then(doc => res.send(doc))
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

app.put("/api/drafts/:id", (req, res) => {
  const id = req.params.id
  const title = req.body.title
  const summary = req.body.summary
  const slug = req.body.slug
  const content = req.body.content
  const imageUrl = req.body.imageUrl
  const dateString = req.body.dateString
  DraftsModel.updateOne(
    { _id: id },
    { $set: { title, summary, slug, content, imageUrl, dateString } }
  )
    .then(result => {
      res.send(result)
    })
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

app.get("/api/posts/next/:slug", (req, res) => {
  const slug = req.params.slug
  PostsModel.findOne({ slug })
    .then(doc => {
      if (doc) {
        PostsModel.findOne({ _id: { $lt: doc._id } })
          .sort({ _id: -1 })
          .then(nextDoc => res.send(nextDoc))
          .catch(e => {
            console.error(e)
            res.status(500).send()
          })
      } else {
        console.error("Couldn't find doc with given slug")
        res.status(404).send("Couldn't find doc with given slug")
      }
    })
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

app.get("/api/posts/prev/:slug", (req, res) => {
  const slug = req.params.slug
  PostsModel.findOne({ slug })
    .then(doc => {
      if (doc) {
        PostsModel.findOne({ _id: { $gt: doc._id } })
          .sort({ _id: 1 })
          .then(nextDoc => res.send(nextDoc))
          .catch(e => {
            console.error(e)
            res.status(500).send()
          })
      } else {
        console.error("Couldn't find doc with given slug")
        res.status(404).send("Couldn't find doc with given slug")
      }
    })
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

/************* TEST DATA *************/
if (
  process.env.NODE_ENV === "test" &&
  getDatbaseName() === "personalWebsiteTest"
) {
  // Create a test post with placeholder data
  app.post("/api/test/posts", (req, res) => {
    const count = req.body.count

    const datetime = new Date().toISOString().slice(0, 19).replace("T", " ")
    const dateString = `1/${10 - count}/2024 12:00:00`
    const title = "[Test] Title " + count
    const summary = "This is a test summary"
    const content = "This is test content"
    const slug = "test-" + count
    const imageUrl =
      "https://ik.imagekit.io/5xtlzx2c3y/website/blog/placeholder.jpeg"

    PostsModel.create({
      _id: getId(),
      title,
      summary,
      content,
      slug,
      imageUrl,
      dateString,
      date: datetime,
      likes: 0,
    })
      .then(result => res.send(result))
      .catch(e => {
        res
          .status(500)
          .json({ error: "Internal Server Error" + e })
          .send()
      })
  })

  // Clear all test data created from a test run
  app.delete("/api/test", (req, res) => {
    Promise.all([
      PostsModel.deleteMany({}),
      DraftsModel.deleteMany({}),
      SubscribersModel.deleteMany({}),
      SubscribersTestModel.deleteMany({}),
    ])
      .then(result => res.send(result))
      .catch(e => {
        res
          .status(500)
          .json({ error: "Internal Server Error" + e })
          .send()
      })
  })
}

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
    .catch(e =>
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    )
}

app.post("/api/email/sendTest", (req, res) => {
  const subject = req.body.subject
  const content = req.body.content
  SubscribersTestModel.find({})
    .then(contacts => {
      sendToList(contacts, subject, content, res)
    })
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

app.post("/api/email/send", (req, res) => {
  const subject = req.body.subject
  const content = req.body.content

  SubscribersModel.find({})
    .then(contacts => {
      sendToList(contacts, subject, content, res)
    })
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
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

  SubscribersModel.create({ _id: getId(), email, dateAdded })
    .then(result => res.send(result))
    .catch(error => {
      if (error.code === 11000 || error.code === 11001) {
        res.status(409)
        res.send("Error: email already subscribed")
      } else {
        res
          .status(500)
          .json({ error: "Internal Server Error" + error })
          .send()
      }
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

  SubscribersModel.deleteOne({ email })
    .then(result => res.send(result))
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

app.get("/api/email/:tableName", (req, res) => {
  const tableName = req.params.tableName
  let model
  if (tableName === "subscribers") {
    model = SubscribersModel
  } else if (tableName === "subscribersTest") {
    model = SubscribersTestModel
  } else {
    res.status(400).json({ error: "Table not found" }).send()
    return
  }

  model
    .find({})
    .then(contacts => res.send(contacts))
    .catch(e => {
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

/************* IMAGEKIT.IO *************/
/* istanbul ignore next */
app.post("/api/image", (req, res) => {
  const path = req.body.path
  imagekit.listFiles({ path }, function (error, result) {
    if (error) {
      console.log(error)
      res.send(error)
    } else {
      res.send(result)
    }
  })
})

const PORT = 3001

app.listen(process.env.PORT || PORT, () => {
  console.log("server is running")
})

module.exports = { app, hashEmail, mailjet }
