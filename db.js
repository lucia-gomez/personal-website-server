const mongoose = require("mongoose")

const getDatbaseName = () => {
  switch (process.env.NODE_ENV) {
    case "testBackend":
      return null
    case "development":
      return "personalWebsiteDev"
    case "test":
      return "personalWebsiteTest"
    default:
      return "personalWebsite"
  }
}

const connectDB = async () => {
  try {
    const database = getDatbaseName()
    console.log("Connecting to database:", database)
    let uri = `mongodb+srv://admin:${process.env.REACT_APP_MONGO_PASSWORD}@luciagomez.xykba6v.mongodb.net/${database}?retryWrites=true&w=majority`

    await mongoose.connect(uri)
    console.log("Connected to MongoDB")
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message)
  }
}

const closeDB = async () => {
  await mongoose.connection.close()
}

const getId = () => new mongoose.Types.ObjectId()

module.exports = {
  connectDB,
  closeDB,
  getId,
  getDatbaseName,
}
