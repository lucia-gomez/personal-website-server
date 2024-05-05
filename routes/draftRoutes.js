const express = require("express")
const { getId } = require("../db")
const DraftsModel = require("../models/draftModel")

const router = express.Router()

router.get("/", (req, res) => {
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

router.post("/", (req, res) => {
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

router.delete("/:id", (req, res) => {
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

router.put("/:id", (req, res) => {
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

module.exports = router
