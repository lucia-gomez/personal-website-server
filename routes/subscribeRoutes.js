const express = require("express")
const {
  SubscribersModel,
  SubscribersTestModel,
} = require("../models/subscriberModel")
const { isValidEmail, unhashEmail } = require("../emailUtil")
const { getId } = require("../db")

const router = express.Router()

router.post("/subscribe/:emailHash", (req, res) => {
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

router.delete("/unsubscribe/:emailHash", (req, res) => {
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

router.get("/:tableName", (req, res) => {
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

module.exports = router
