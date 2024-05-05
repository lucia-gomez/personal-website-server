const express = require("express")
const fs = require("fs")
const Mailjet = require("node-mailjet")
const {
  SubscribersModel,
  SubscribersTestModel,
} = require("../models/subscriberModel")
const { isValidEmail, hashEmail } = require("../emailUtil")

const router = express.Router()

const mailjet = Mailjet.connect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
)

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

router.post("/sendTest", (req, res) => {
  const subject = req.body.subject
  const content = req.body.content
  SubscribersTestModel.find({})
    .then(contacts => {
      sendToList(contacts, subject, content, res)
    })
    .catch(e => {
      console.error(e)
      res
        .status(500)
        .json({ error: "Internal Server Error" + e })
        .send()
    })
})

router.post("/send", (req, res) => {
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

router.post("/confirm", (req, res) => {
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

router.post("/dns", (req, res) => {
  const request = mailjet
    .post("dns", { version: "v3" })
    .id("lucia-gomez.dev")
    .action("check")
    .request()
  request
    .then(result => {
      res.status(200).json(result.body.Data[0])
    })
    .catch(err => {
      console.log(err.statusCode)
      res.status(400).json({ error: err }).send()
    })
})

module.exports = { mailjetRoutes: router, mailjet }
