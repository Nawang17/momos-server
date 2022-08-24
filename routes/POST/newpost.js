"use strict";
const router = require("express").Router();
const { posts } = require("../../models");

router.post("/", async (req, res) => {
  const { text } = req.body;
  const sanitizedText = text.trim().replace(/\n{2,}/g, "\n");
  if (!text) {
    res.status(400).send("Post cannot be empty");
  } else if (/^\s*$/.test(text)) {
    res.status(400).send("Post cannot be empty");
  } else {
    try {
      const findPost = await posts.findOne({
        where: {
          text: sanitizedText,
          postUser: req.user.id,
        },
      });
      if (findPost) {
        res.status(400).send("Whoops! You already said that");
      } else {
        const newPost = await posts.create({
          text: sanitizedText,
          postUser: req.user.id,
        });
        if (newPost) {
          res.status(201).send({
            message: "Post created successfully",
          });
        } else {
          res.status(400).send("Something went wrong");
        }
      }
    } catch (error) {
      res.status(400).send(error);
    }
  }
});

module.exports = router;
