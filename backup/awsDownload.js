const aws = require("aws-sdk")
const fs = require("fs")
const dotenv = require("dotenv")

dotenv.config({ path: "../.env" })

const args = process.argv.slice(2)
console.log(args)

aws.config.update({ region: "us-east-1", signatureVersion: "v4" })

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

const bucketName = "lucia-gomez-db-backup"

const downloadFile = (key, localFilePath) => {
  console.log("Downloading " + key + "...")
  s3.getObject(
    {
      Bucket: bucketName,
      Key: key,
    },
    (err, data) => {
      if (err) {
        console.error("Error downloading file:", err)
      } else {
        // Save the file locally
        fs.writeFileSync(localFilePath, data.Body)
        console.log(`File downloaded successfully: ${localFilePath}`)
      }
    }
  )
}

const downloadBackup = async (restoreDir, timestamp) => {
  try {
    const response = await s3
      .listObjectsV2({
        Bucket: bucketName,
        Prefix: timestamp,
      })
      .promise()

    if (response.Contents.length === 0) {
      console.log("No objects found in the specified folder.")
      return
    }

    for (const object of response.Contents) {
      const localFilePath = `${restoreDir}/${object.Key}`
      downloadFile(object.Key, localFilePath)
    }
  } catch (error) {
    console.error("Error listing objects in the folder:", error)
  }
}

downloadBackup(args[0], args[1])
