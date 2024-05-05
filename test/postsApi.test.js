const chai = require("chai")

const { expect } = chai
const app = require("../index")
const mongoose = require("mongoose")
const { testSimulateMongoError } = require("./test")

const PostsModel = require("../models/postModel")

const mockError = async (fnToMock, apiRequest) =>
  testSimulateMongoError(PostsModel, fnToMock, apiRequest)

const postData1 = {
  title: "Test title",
  summary: "Test summary",
  content: "Test content",
  slug: "post1",
  imageUrl: "test-image-url.png",
  dateString: "1-1-2023",
  datetime: "123",
  likes: 0,
}
const updateData1 = {
  title: "Updated title",
  summary: "Updated summary",
  content: "Updated content",
  dateString: "1-2-2023",
  imageUrl: "updated-image-url.png",
  slug: "post1-updated",
}
const slugs = [updateData1.slug, "post2", "post3"]
let postId

describe("Posts API/Model Tests", () => {
  it("get all posts - empty", async () => {
    const res = await chai.request(app).get("/api/posts")
    expect(res).to.have.status(200)
    expect(res.body.length).to.equal(0)

    const posts = await PostsModel.find({})
    expect(posts.length).to.equal(0)
  })

  it("create post", async () => {
    const res = await chai.request(app).post("/api/posts").send(postData1)
    expect(res).to.have.status(200)
    postId = res.body._id

    const createdPost = await PostsModel.findOne({ _id: res.body._id })
    expect(createdPost).to.exist
    expect(createdPost.title).to.equal(postData1.title)
    expect(createdPost.summary).to.equal(postData1.summary)
    expect(createdPost.slug).to.equal(postData1.slug)
    expect(createdPost.content).to.equal(postData1.content)
    expect(createdPost.imageUrl).to.equal(postData1.imageUrl)
    expect(createdPost.date).to.equal(postData1.datetime)
    expect(createdPost.dateString).to.equal(postData1.dateString)
    expect(createdPost.likes).to.equal(postData1.likes)

    const allPosts = await PostsModel.find({})
    expect(allPosts.length).to.equal(1)
  })

  it("get post by slug - found", async () => {
    const res = await chai.request(app).get("/api/posts/" + postData1.slug)
    expect(res).to.have.status(200)
    expect(res.body.slug).to.equal(postData1.slug)

    const foundPost = await PostsModel.findOne({ _id: res.body._id })
    expect(foundPost.slug).to.equal(postData1.slug)
  })

  it("get post by slug - not found", async () => {
    const res = await chai.request(app).get("/api/posts/:fake-slug")
    expect(res).to.have.status(404)
  })

  it("like post by id", async () => {
    const res = await chai
      .request(app)
      .put("/api/posts/likes")
      .send({ id: postId, mode: 1 })
    expect(res).to.have.status(200)

    const post = await PostsModel.findOne({ _id: postId })
    expect(post.likes).to.equal(1)
  })

  it("unlike post by id", async () => {
    const res = await chai
      .request(app)
      .put("/api/posts/likes")
      .send({ id: postId, mode: -1 })
    expect(res).to.have.status(200)

    const post = await PostsModel.findOne({ _id: postId })
    expect(post.likes).to.equal(0)
  })

  it("like twice then reset post likes", async () => {
    await chai
      .request(app)
      .put("/api/posts/likes")
      .send({ id: postId, mode: 1 })
    await chai
      .request(app)
      .put("/api/posts/likes")
      .send({ id: postId, mode: 1 })

    let post = await PostsModel.findOne({ _id: postId })
    expect(post.likes).to.equal(2)

    const res = await chai
      .request(app)
      .put("/api/posts/likes")
      .send({ id: postId, mode: 0 })
    expect(res).to.have.status(200)

    post = await PostsModel.findOne({ _id: postId })
    expect(post.likes).to.equal(0)
  })

  it("unlike with 0 likes", async () => {
    const res = await chai
      .request(app)
      .put("/api/posts/likes")
      .send({ id: postId, mode: -1 })
    expect(res).to.have.status(200)

    const post = await PostsModel.findOne({ _id: postId })
    expect(post.likes).to.equal(0)
  })

  it("invalid like mode", async () => {
    const res = await chai
      .request(app)
      .put("/api/posts/likes")
      .send({ id: postId, mode: 2 })
    expect(res).to.have.status(400)

    const post = await PostsModel.findOne({ _id: postId })
    expect(post.likes).to.equal(0)
  })

  it("missing like mode", async () => {
    const res = await chai
      .request(app)
      .put("/api/posts/likes")
      .send({ id: postId })
    expect(res).to.have.status(400)

    const post = await PostsModel.findOne({ _id: postId })
    expect(post.likes).to.equal(0)
  })

  it("delete post by id", async () => {
    const res = await chai.request(app).delete("/api/posts/" + postId)
    expect(res).to.have.status(200)

    const posts = await PostsModel.find({})
    expect(posts.length).to.equal(0)
  })

  it("delete non-existent post", async () => {
    const res = await chai.request(app).delete("/api/posts/" + postId)
    expect(res).to.have.status(400)
  })

  it("recreate and update post", async () => {
    const res1 = await chai.request(app).post("/api/posts").send(postData1)
    expect(res1).to.have.status(200)
    postId = res1.body._id

    const res2 = await chai
      .request(app)
      .put("/api/posts/" + postId)
      .send(updateData1)
    expect(res2).to.have.status(200)

    const post = await PostsModel.findOne({ _id: postId })
    expect(post._id).to.deep.equal(new mongoose.Types.ObjectId(postId))
    expect(post.title).to.equal(updateData1.title)
    expect(post.summary).to.equal(updateData1.summary)
    expect(post.content).to.equal(updateData1.content)
    expect(post.dateString).to.equal(updateData1.dateString)
    expect(post.imageUrl).to.equal(updateData1.imageUrl)
    expect(post.slug).to.equal(updateData1.slug)
  })

  it("get all posts - mongodb error", async () =>
    await mockError("find", () => chai.request(app).get("/api/posts")))

  it("get post by slug - mongodb error", async () =>
    await mockError("findOne", () =>
      chai.request(app).get("/api/posts/:post1")
    ))

  it("create post - mongodb error", async () =>
    await mockError("create", () =>
      chai.request(app).post("/api/posts").send(postData1)
    ))

  it("like post - mongodb error", async () =>
    await mockError("updateOne", () =>
      chai.request(app).put("/api/posts/likes").send({ id: postId, mode: 1 })
    ))

  it("unlike post - mongodb error", async () =>
    await mockError("updateOne", () =>
      chai.request(app).put("/api/posts/likes").send({ id: postId, mode: -1 })
    ))

  it("reset likes - mongodb error", async () =>
    await mockError("updateOne", () =>
      chai.request(app).put("/api/posts/likes").send({ id: postId, mode: 0 })
    ))

  it("delete post - mongodb error", async () =>
    await mockError("deleteOne", () =>
      chai.request(app).delete("/api/posts/1")
    ))

  it("update post - mongodb error", async () =>
    await mockError("updateOne", () =>
      chai.request(app).put("/api/posts/1").send(updateData1)
    ))
})

describe("Slug API Tests", () => {
  it("create several posts", async () => {
    let res = await chai
      .request(app)
      .post("/api/posts")
      .send({ ...postData1, slug: slugs[1] })
    expect(res).to.have.status(200)

    res = await chai
      .request(app)
      .post("/api/posts")
      .send({ ...postData1, slug: slugs[2] })
    expect(res).to.have.status(200)

    const posts = await PostsModel.find({})
    expect(posts.length).to.equal(3)
  })

  it("get prev post by slug - has post", async () => {
    // newer post
    const res = await chai.request(app).get("/api/posts/prev/" + slugs[1])
    expect(res).to.have.status(200)
    expect(res.body).to.not.deep.equal({})
    expect(res.body.slug).to.equal(slugs[0])
  })

  it("get prev post by slug - no post", async () => {
    const res = await chai.request(app).get("/api/posts/prev/" + slugs[0])
    expect(res).to.have.status(200)
    expect(res.body).to.deep.equal({})
  })

  it("get prev post by slug - invalid slug", async () => {
    const res = await chai.request(app).get("/api/posts/prev/bad-slug")
    expect(res).to.have.status(404)
  })

  it("get prev post by slug - missing param", async () => {
    const res = await chai.request(app).get("/api/posts/prev/")
    expect(res).to.have.status(404)
  })

  it("get next post by slug - has post", async () => {
    // older post
    const res = await chai.request(app).get("/api/posts/next/" + slugs[0])
    expect(res).to.have.status(200)
    expect(res.body).to.not.deep.equal({})
    expect(res.body.slug).to.equal(slugs[1])
  })

  it("get next post by slug - no post", async () => {
    const res = await chai.request(app).get("/api/posts/next/" + slugs[2])
    expect(res).to.have.status(200)
    expect(res.body).to.deep.equal({})
  })

  it("get next post by slug - invalid slug", async () => {
    const res = await chai.request(app).get("/api/posts/next/bad-slug")
    expect(res).to.have.status(404)
  })

  it("get next post by slug - missing param", async () => {
    const res = await chai.request(app).get("/api/posts/next/")
    expect(res).to.have.status(404)
  })

  it("get prev stub - mongodb error", async () =>
    await mockError("findOne", () =>
      chai.request(app).get("/api/posts/prev/" + slugs[0])
    ))

  it("get next stub - mongodb error", async () =>
    await mockError("findOne", () =>
      chai.request(app).get("/api/posts/next/" + slugs[0])
    ))
})
