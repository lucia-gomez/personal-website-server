const chai = require("chai")
const { expect } = chai
const app = require("../index")
const { testSimulateMongoError } = require("./test")
const { getId } = require("../db")
const { hashEmail } = require("../emailUtil")

const {
  SubscribersModel,
  SubscribersTestModel,
} = require("../models/subscriberModel")

const testEmail = "test@gmail.com"
const title = "TITLEABC123"
const content = "CONTENTXYZ456"

const mockError = async (fnToMock, apiRequest) =>
  testSimulateMongoError(SubscribersModel, fnToMock, apiRequest)

describe("Subscribers API/Model Tests", () => {
  it("send confirmation email - valid email", async () => {
    const res = await chai
      .request(app)
      .post("/api/email/confirm")
      .send({ email: testEmail })
    expect(res).to.have.status(200)
  })

  it("send confirmation email - invalid email", async () => {
    const res = await chai
      .request(app)
      .post("/api/email/confirm")
      .send({ email: "test" })
    expect(res).to.have.status(400)
  })

  it("send confirmation email - missing param", async () => {
    const res = await chai.request(app).post("/api/email/confirm/")
    expect(res).to.have.status(400)
  })

  it("subscribe - success", async () => {
    const hash = hashEmail(testEmail)
    const res = await chai.request(app).post("/api/email/subscribe/" + hash)
    expect(res).to.have.status(200)

    const subscribers = await SubscribersModel.find({})
    expect(subscribers.length).to.equal(1)
    expect(subscribers[0].email).to.equal(testEmail)
    id = subscribers[0]._id
  })

  it("subscribe - duplicate", async () => {
    const hash = hashEmail(testEmail)
    const res = await chai.request(app).post("/api/email/subscribe/" + hash)
    expect(res).to.have.status(409)

    const subscribers = await SubscribersModel.find({})
    expect(subscribers.length).to.equal(1)
  })

  it("subscribe - invalid email hash", async () => {
    const hash = hashEmail("test")
    const res = await chai.request(app).post("/api/email/subscribe/" + hash)
    expect(res).to.have.status(400)

    const subscribers = await SubscribersModel.find({})
    expect(subscribers.length).to.equal(1)
  })

  it("subscribe - missing param", async () => {
    const res = await chai.request(app).post("/api/email/subscribe/")
    expect(res).to.have.status(404)

    const subscribers = await SubscribersModel.find({})
    expect(subscribers.length).to.equal(1)
  })

  it("subscribe - mongodb error", async () =>
    await mockError("create", () =>
      chai.request(app).post("/api/email/subscribe/" + hashEmail(testEmail))
    ))

  it("unsubscribe - missing param", async () => {
    const res = await chai.request(app).delete("/api/email/unsubscribe/")
    expect(res).to.have.status(404)

    const subscribers = await SubscribersModel.find({})
    expect(subscribers.length).to.equal(1)
  })

  it("unsubscribe - invalid email hash", async () => {
    const hash = hashEmail("test")
    const res = await chai.request(app).delete("/api/email/unsubscribe/" + hash)
    expect(res).to.have.status(400)

    const subscribers = await SubscribersModel.find({})
    expect(subscribers.length).to.equal(1)
  })

  it("unsubscribe - success", async () => {
    const hash = hashEmail(testEmail)
    const res = await chai.request(app).delete("/api/email/unsubscribe/" + hash)
    expect(res).to.have.status(200)
    expect(res.body.deletedCount).exists
    expect(res.body.deletedCount).to.equal(1)

    const subscribers = await SubscribersModel.find({})
    expect(subscribers.length).to.equal(0)
  })

  it("unsubscribe - email not subscribed", async () => {
    const hash = hashEmail(testEmail)
    const res = await chai.request(app).delete("/api/email/unsubscribe/" + hash)
    expect(res).to.have.status(200)
    expect(res.body.deletedCount).exists
    expect(res.body.deletedCount).to.equal(0)

    const subscribers = await SubscribersModel.find({})
    expect(subscribers.length).to.equal(0)
  })

  it("unsubscribe - mongodb error", async () =>
    await mockError("deleteOne", () =>
      chai.request(app).delete("/api/email/unsubscribe/" + hashEmail(testEmail))
    ))

  it("resubscribe same email", async () => {
    const hash = hashEmail(testEmail)
    const res = await chai.request(app).post("/api/email/subscribe/" + hash)
    expect(res).to.have.status(200)

    const subscribers = await SubscribersModel.find({})
    expect(subscribers.length).to.equal(1)
  })

  it("get table by name - subscribers", async () => {
    const res = await chai.request(app).get("/api/email/subscribers")
    expect(res).to.have.status(200)
    expect(res.body.length).to.equal(1)
    expect(res.body[0].email).to.equal(testEmail)
  })

  it("get table by name - subscribersTest", async () => {
    const res = await chai.request(app).get("/api/email/subscribersTest")
    expect(res).to.have.status(200)
    expect(res.body.length).to.equal(0)
  })

  it("get table by name - fake", async () => {
    const res = await chai.request(app).get("/api/email/fake")
    expect(res).to.have.status(400)
  })

  it("get table by name - missing param", async () => {
    const res = await chai.request(app).get("/api/email/")
    expect(res).to.have.status(404)
  })

  it("get table by name - mongodb error", async () =>
    await mockError("find", () =>
      chai.request(app).get("/api/email/subscribers")
    ))

  it("send test email - success", async () => {
    await SubscribersTestModel.create({
      email: "test2@gmail.com",
      dateAdded: new Date(),
      _id: getId(),
    })
    const res = await chai
      .request(app)
      .post("/api/email/sendTest")
      .send({ title, content })
    expect(res).to.have.status(200)
  })

  it("send test email - mongodb error", async () =>
    await testSimulateMongoError(SubscribersTestModel, "find", () =>
      chai.request(app).post("/api/email/sendTest")
    ))

  it("send email - success", async () => {
    const res = await chai
      .request(app)
      .post("/api/email/send")
      .send({ title, content })
    expect(res).to.have.status(200)
  })

  it("send email - mongodb error", async () =>
    await mockError("find", () => chai.request(app).post("/api/email/send")))
})
