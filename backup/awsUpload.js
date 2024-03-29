const aws = require("aws-sdk")
const fs = require("fs")
const dotenv = require("dotenv")

dotenv.config({ path: "../.env" })

const args = process.argv.slice(2)
const dir = "./" + args[0] + "/personalWebsite/"
const timestamp = args[0].slice(args[0].indexOf("/") + 1)

aws.config.update({ region: "us-east-1", signatureVersion: "v4" })

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

const uploadFile = async (filePath, fileName) => {
  console.log(`Uploading ${fileName} to s3...`)

  // File
  const fileStream = fs.createReadStream(`${filePath}${fileName}`)
  fileStream.on("error", fsErr => {
    console.log("File Error", fsErr)
  })

  // Payload
  const uploadParams = {
    Bucket: "lucia-gomez-db-backup",
    Key: timestamp + "/" + fileName,
    Body: fileStream,
  }

  // Upload
  await s3.upload(uploadParams, (s3err, data) => {
    if (s3err) {
      console.log("Error", s3err)
    }
    if (data) {
      console.log(`Uploaded ${fileName} with success`, data.Location)
    }
  })
}

// upload all files in mongodump dir
fs.readdir(dir, function (err, files) {
  if (err) {
    console.error("Could not read from directory " + dir, err)
    process.exit(1)
  }

  files.forEach(file => {
    uploadFile(dir, file)
  })
})
