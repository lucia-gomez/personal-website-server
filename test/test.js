const chai = require("chai")
const chaiHttp = require("chai-http")
const mongoose = require("mongoose")
const sinon = require("sinon")
const { mailjet } = require("../index")
const { MongoMemoryServer } = require("mongodb-memory-server")

const { expect } = chai

chai.use(chaiHttp)

let db
let mongoServer
let mailjetStub

async function connectDBTest() {
  if (mongoServer) {
    return mongoose.connection
  }
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
  return mongoose.connection
}

async function closeDBTest() {
  if (mongoServer) {
    await mongoose.connection.close(true)
    await mongoose.disconnect()
    await mongoServer.stop()
    mongoServer = null
  }
}

before(async () => {
  db = await connectDBTest()

  // stub mailjet actions
  const sandbox = sinon.createSandbox()
  mailjetStub = sandbox.stub(mailjet, "post")
  const mailjetResponse = {
    status: "success",
  }
  mailjetStub.returns({
    request: sandbox.stub().resolves(mailjetResponse),
  })
})

after(async () => {
  mailjetStub.restore()
  await closeDBTest()
})

describe("Database Tests", () => {
  it("connect to test DB", async () => {
    expect(db.readyState).to.equal(1)
  })
})

async function testSimulateMongoError(model, fnToMock, apiRequest) {
  const stub = sinon.stub(model, fnToMock)
  const msg = "Simulated MongoDB error"
  stub.rejects(new Error(msg))

  try {
    const res = await apiRequest()
    if (res.status >= 400) {
      throw new Error(`${res.status} ${res.error}`)
    }
    expect.fail("Expected the API call to fail, but it succeeded")
  } catch (err) {
    expect(err.message).to.contain(500)
  } finally {
    stub.restore()
  }
}

module.exports = { testSimulateMongoError }
