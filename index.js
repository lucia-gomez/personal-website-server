const bodyParser = require("body-parser")
const cors = require("cors")
const dotenv = require("dotenv")
const express = require("express")
const { connectDB } = require("./db")

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

/************* POSTS *************/
const postRoutes = require("./routes/postRoutes")
app.use("/api/posts", postRoutes)

/************* DRAFTS *************/
const draftRoutes = require("./routes/draftRoutes")
app.use("/api/drafts", draftRoutes)

/************* TEST DATA *************/
const testRoutes = require("./routes/testRoutes")
app.use("/api/test", testRoutes)

/************* EMAIL *************/
const { mailjetRoutes } = require("./routes/mailjetRoutes")
const subscribeRoutes = require("./routes/subscribeRoutes")
app.use("/api/email", mailjetRoutes)
app.use("/api/email", subscribeRoutes)

/************* CONTENTFUL *************/
const contentfulRoutes = require("./routes/contentfulRoutes")
app.use("/api/content", contentfulRoutes)

/************* IMAGEKIT.IO *************/
// const imageKitRoutes = require("./routes/imageKitRoutes")
// app.use("/api/image", imageKitRoutes)

const PORT = 3001
app.listen(process.env.PORT || PORT, () => {
  console.log("server is running")
})

module.exports = app
