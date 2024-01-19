const { ObjectId } = require("mongodb")
const mongoose = require("mongoose")

const emailSchema = new mongoose.Schema({
  _id: ObjectId,
  email: {
    type: String,
    unique: true,
  },
  dateAdded: String,
})
const SubscribersModel = mongoose.model(
  "Subscribers",
  emailSchema,
  "subscribers"
)
const SubscribersTestModel = mongoose.model(
  "SubscribersTest",
  emailSchema,
  "subscribersTest"
)

module.exports = { SubscribersModel, SubscribersTestModel }
