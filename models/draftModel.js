const { ObjectId } = require("mongodb")
const mongoose = require("mongoose")

const draftsSchema = new mongoose.Schema({
  _id: ObjectId,
  title: String,
  summary: String,
  content: String,
  slug: String,
  imageUrl: String,
  dateString: String,
})
const DraftsModel = mongoose.model("Drafts", draftsSchema, "drafts")

module.exports = DraftsModel
