const express = require("express")
const { getId } = require("../db")
const PostsModel = require("../models/postModel")

const router = express.Router()

router.get("/", (req, res) => {
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

router.get("/:slug", (req, res) => {
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

router.post("/", (req, res) => {
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

router.put("/likes", (req, res) => {
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

router.delete("/:id", (req, res) => {
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

router.put("/:id", (req, res) => {
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

router.get("/prev/:slug", (req, res) => {
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

router.get("/next/:slug", (req, res) => {
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

module.exports = router
