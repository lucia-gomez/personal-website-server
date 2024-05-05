const express = require("express")
const { getId, getDatbaseName } = require("../db")
const PostsModel = require("../models/postModel")
const DraftsModel = require("../models/draftModel")
const {
  SubscribersModel,
  SubscribersTestModel,
} = require("../models/subscriberModel")

const router = express.Router()

if (
  process.env.NODE_ENV === "test" &&
  getDatbaseName() === "personalWebsiteTest"
) {
  console.log("DEBUG", "has test endpoints")
  // Create a test post with placeholder data
  router.post("/posts", (req, res) => {
    console.log("DEBUG", "creating test posts...")
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
  router.delete("/", (req, res) => {
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

module.exports = router
