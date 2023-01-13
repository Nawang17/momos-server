"use strict";
const router = require("express").Router();
const { likes, notis, posts } = require("../../models");

router.post("/", async (req, res) => {
  try {
    // Check if postId is provided in the request body
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).send("postId is required");
    }
    //check if postId is a number
    if (isNaN(postId)) {
      return res.status(400).send("invalid postId");
    }

    // Check if the post exists
    const findpost = await posts.findOne({
      where: {
        id: postId,
      },
    });
    if (!findpost) {
      return res.status(404).send("Post not found");
    }

    // Find or create a like
    const [newlike, created] = await likes.findOrCreate({
      where: { postId, userId: req.user.id },
      defaults: { postId, userId: req.user.id },
    });
    // If like already exists, destroy it
    if (!created) {
      await likes.destroy({
        where: {
          postId,
          userId: req.user.id,
        },
      });

      // Send a 204 No Content response after deleting the like
      return res.status(200).send({ liked: false });
    }

    // Create a notification if the user who liked the post is not the post owner
    if (req.user.id !== findpost?.postUser) {
      await notis.create({
        userId: req.user.id,
        type: "LIKE",
        postId,
        targetuserId: findpost?.postUser,
        text: "liked your post.",
        likeId: newlike?.id,
      });
    }

    // Send a 201 Created response after creating a new like
    return res.status(201).send({ liked: true });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
