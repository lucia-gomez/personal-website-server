const ffmpeg = require("fluent-ffmpeg")
const ffmpegPath = require("ffmpeg-static")
const fs = require("fs")
const sharp = require("sharp")

ffmpeg.setFfmpegPath(ffmpegPath)

const OUTPUT_FILE_PREFIX = "./tmp."

function splitFileNameAndExtension(fileName) {
  const dotIdx = fileName.lastIndexOf(".")
  const name = fileName.substring(0, dotIdx)
  const extension = fileName.substring(dotIdx + 1).toLowerCase()
  return [name, extension]
}

function getFileSizeAsync(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err)
      } else {
        resolve(stats.size)
      }
    })
  })
}

async function compressPng(inputPath, outputPath) {
  return sharp(inputPath).webp({ quality: 50 }).toFile(outputPath)
}

async function compressJpeg(inputPath, outputPath) {
  return sharp(inputPath).jpeg({ quality: 50 }).toFile(outputPath)
}

async function compressVideo(inputPath, outputPath) {
  console.log("compressing video")
  return new Promise((resolve, reject) =>
    ffmpeg()
      .input(inputPath)
      .videoCodec("libx264")
      .videoBitrate("2000k")
      .audioBitrate("128k")
      .fps(24)
      .format("mp4")
      .outputOptions("-movflags", "faststart") // Enable MOOV atom optimization
      .output(outputPath)
      .on("end", () => {
        console.log("Compression complete")
        resolve()
      })
      .on("error", err => {
        console.error("Error during compression:", err)
        reject()
      })
      .run()
  )
}

async function noCompress(inputPath, outputPath) {
  return sharp(inputPath).toFile(outputPath)
}

function compressedFileName(fileType, fileExtension) {
  let name = OUTPUT_FILE_PREFIX
  switch (fileType) {
    case "image/png":
      name += "webp"
      break
    case "video/quicktime":
      name += "mp4"
      break
    default:
      name += fileExtension
  }
  return name
}

async function compressFile(originalName, fileExtension, fileType) {
  const originalSize = await getFileSizeAsync(originalName)
  let fn
  switch (fileType) {
    case "image/png":
      fn = compressPng
      break
    case "image/jpg":
    case "image/jpeg":
      fn = compressJpeg
      break
    case "video/quicktime":
      fn = compressVideo
      break
    default:
      fn = noCompress
  }
  const outputPath = compressedFileName(fileType, fileExtension)

  return new Promise((resolve, reject) => {
    fn(originalName, outputPath)
      .then(async info => {
        // console.log(info)
        const res = {
          originalSize,
          compressedSize: info?.size || (await getFileSizeAsync(outputPath)),
          outputFileName: outputPath,
        }
        resolve(res)
      })
      .catch(err => {
        console.error(err)
        reject(err)
      })
  })
}

module.exports = { compressFile, splitFileNameAndExtension }
