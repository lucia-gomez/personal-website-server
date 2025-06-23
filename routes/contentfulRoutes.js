const express = require("express")
const { createClient } = require("contentful")

const router = express.Router()

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_PREVIEW_TOKEN,
  host: "preview.contentful.com",
  environment: "master",
})

router.get("/preview", async (req, res) => {
  const { entryId } = req.query

  try {
    let data
    if (entryId) {
      data = await client.getEntry(entryId, { include: 2 })
    } else {
      return res.status(400).json({ error: "Missing entryId" })
    }

    res.status(200)
    res.json(data)
  } catch (e) {
    console.error(e)
    res
      .status(500)
      .json({ error: "Contentful Preview API error", details: e.message })
  }
})

module.exports = router
