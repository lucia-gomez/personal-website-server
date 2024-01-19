const { ObjectId } = require("mongodb")
const mongoose = require("mongoose")

const postsSchema = new mongoose.Schema({
  _id: ObjectId,
  date: String,
  dateString: String,
  title: String,
  summary: String,
  content: String,
  slug: String,
  likes: Number,
  imageUrl: String,
})
const PostsModel = mongoose.model("Posts", postsSchema, "posts")

module.exports = PostsModel
