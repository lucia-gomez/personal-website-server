const CryptoJS = require("crypto-js")

function isValidEmail(email) {
  const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  return regex.test(email)
}

function hashEmail(email) {
  return encodeURIComponent(
    CryptoJS.AES.encrypt(email, process.env.ENCRYPT_KEY)
  )
}

function unhashEmail(emailHash) {
  const decodedHash = decodeURIComponent(emailHash)
  const emailBytes = CryptoJS.AES.decrypt(decodedHash, process.env.ENCRYPT_KEY)
  return emailBytes.toString(CryptoJS.enc.Utf8)
}

module.exports = { isValidEmail, hashEmail, unhashEmail }
