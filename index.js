const bodyParser = require("body-parser")
const cors = require("cors")
const CryptoJS = require("crypto-js")
const dotenv = require("dotenv")
const express = require("express")
const fs = require("fs")
const ImageKit = require("imagekit")
const Mailjet = require("node-mailjet")
const {
  connectDB,
  getId,
  DraftsModel,
  PostsModel,
  SubscribersModel,
  SubscribersTestModel,
} = require("./db")

dotenv.config()
const app = express()
connectDB()

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

console.log(process.env.IMAGEKIT_PRIVATE)
const imagekit = new ImageKit({
  publicKey: "public_CJFqG4/4bWXjKN1kfmDaT7UlKC4=",
  privateKey: process.env.IMAGEKIT_PRIVATE,
  urlEndpoint: "https://ik.imagekit.io/5xtlzx2c3y",
})

app.get("/api/get", (req, res) => {
  PostsModel.find({})
    .then(docs => {
      res.send(docs)
    })
    .catch(e => {
      res.status(400)
      console.error(e)
    })
})

app.get("/api/get/:slug", (req, res) => {
  const slug = req.params.slug
  PostsModel.findOne({ slug })
    .then(doc => res.send(doc))
    .catch(e => {
      res.status(400)
      console.error(e)
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
      res.status(400)
      console.error(e)
    })
})

app.post("/api/like", (req, res) => {
  const id = req.body.id
  PostsModel.updateOne({ _id: id }, { $inc: { likes: 1 } })
    .then(result => {
      res.send(result)
    })
    .catch(error => {
      console.error(error)
      res.status(400)
    })
})

app.post("/api/unlike", (req, res) => {
  const id = req.body.id
  PostsModel.updateOne({ _id: id }, { $inc: { likes: -1 } })
    .then(result => {
      res.send(result)
    })
    .catch(error => {
      console.error(error)
      res.status(400)
    })
})

app.post("/api/likes/reset", (req, res) => {
  const id = req.body.id
  PostsModel.updateOne({ _id: id }, { $set: { likes: 0 } })
    .then(result => {
      res.send(result)
    })
    .catch(error => {
      console.error(error)
      res.status(400)
    })
})

app.delete("/api/delete/:id", (req, res) => {
  const id = req.params.id
  PostsModel.deleteOne({ _id: id })
    .then(result => {
      res.send(result)
    })
    .catch(error => {
      console.error(error)
      res.status(400)
    })
})

app.post("/api/update", (req, res) => {
  const id = req.body.id
  const title = req.body.title
  const summary = req.body.summary
  const content = req.body.content
  const dateString = req.body.dateString
  const imageUrl = req.body.imageUrl
  PostsModel.updateOne(
    { _id: id },
    { $set: { title, summary, content, dateString, imageUrl } }
  )
    .then(result => {
      res.send(result)
    })
    .catch(error => {
      console.error(error)
      res.status(400)
    })
})

app.get("/api/draft/get", (req, res) => {
  DraftsModel.find({})
    .then(docs => {
      res.send(docs)
    })
    .catch(e => {
      res.status(400)
      console.error(e)
    })
})

app.post("/api/draft/create", (req, res) => {
  const title = req.body.title
  const summary = req.body.summary
  const content = req.body.content
  const slug = req.body.slug
  const imageUrl = req.body.imageUrl
  DraftsModel.create({
    _id: getId(),
    title,
    summary,
    content,
    slug,
    imageUrl,
  })
    .then(result => {
      res.send(result)
    })
    .catch(error => {
      console.error(error)
      res.status(400)
    })
})

app.delete("/api/draft/:id", (req, res) => {
  const id = req.params.id
  DraftsModel.deleteOne({ _id: id })
    .then(doc => res.send(doc))
    .catch(e => {
      res.status(400)
      console.error(e)
    })
})

app.post("/api/draft/update", (req, res) => {
  const id = req.body.id
  const title = req.body.title
  const summary = req.body.summary
  const slug = req.body.slug
  const content = req.body.content
  const imageUrl = req.body.imageUrl
  DraftsModel.updateOne(
    { _id: id },
    { $set: { title, summary, slug, content, imageUrl } }
  )
    .then(result => {
      res.send(result)
    })
    .catch(error => {
      console.error(error)
      res.status(400)
    })
})

app.get("/api/next/:slug", (req, res) => {
  const slug = req.params.slug
  PostsModel.findOne({ slug })
    .then(doc => {
      if (doc) {
        PostsModel.findOne({ _id: { $lt: doc._id } })
          .sort({ _id: -1 })
          .then(nextDoc => res.send(nextDoc))
          .catch(e => {
            console.error(e)
            res.status(400)
          })
      } else {
        console.error("Couldn't find doc with given slug")
        res.status(400)
        res.send(null)
      }
    })
    .catch(e => {
      console.error(e)
      res.status(400)
    })
})

app.get("/api/prev/:slug", (req, res) => {
  const slug = req.params.slug
  PostsModel.findOne({ slug })
    .then(doc => {
      if (doc) {
        PostsModel.findOne({ _id: { $gt: doc._id } })
          .sort({ _id: 1 })
          .then(nextDoc => res.send(nextDoc))
          .catch(e => {
            console.error(e)
            res.status(400)
          })
      } else {
        console.error("Couldn't find doc with given slug")
        res.status(400)
        res.send(null)
      }
    })
    .catch(e => {
      console.error(e)
      res.status(400)
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
  SubscribersTestModel.find({})
    .then(contacts => {
      sendToList(contacts, subject, content, res)
    })
    .catch(e => {
      console.error(e)
      res.status(400)
      res.send(e)
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
      console.error(e)
      res.status(400)
      res.send(e)
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
      console.error(error)
      if (error.code === 11000 || error.code === 11001) {
        res.status(409)
        res.send("Error: email already subscribed")
      } else {
        res.status(400)
        res.send("Error: can't add email")
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
      res.status(400)
      res.send(e)
    })
})

app.get("/api/email/subscribers/:tableName", (req, res) => {
  const tableName = req.params.tableName
  if (tableName == null) {
    res.status(400)
    res.send(JSON.stringify({ error: "Undefined table name" }))
    return
  }

  const model =
    tableName === "subscribers" ? SubscribersModel : SubscribersTestModel
  model
    .find({})
    .then(contacts => res.send(contacts))
    .catch(e => {
      res.status(400)
      res.send(e)
    })
})

/************* IMAGEKIT.IO *************/
app.post("/api/image", (req, res) => {
  const path = req.body.path
  console.log(path)
  console.log(process.env.IMAGEKIT_PRIVATE)
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
