"use strict";
require("dotenv").config();
const router = require("express").Router();
const { posts } = require("../../models");

router.post("/", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).send("post cannot be empty");
  } else if (/^\s*$/.test(text)) {
    res.status(400).send("post cannot be empty");
  } else {
    try {
      const newPost = await posts.create({
        text,
        postUser: req.user.id,
      });
      if (newPost) {
        res.status(201).send({
          message: "post created successfully",
          newPost,
        });
      } else {
        res.status(400).send("something went wrong");
      }
    } catch (error) {
      res.status(400).send(error);
    }
  }
});

module.exports = router;
