"use strict";
const router = require("express").Router();
const { nestedcomments, nestedcommentlikes, notis } = require("../../models");

router.post("/", async (req, res) => {
  try {
    const { nestedcommentId } = req.body;

    if (!nestedcommentId) {
      return res.status(400).send("replyId is required");
    }
    //check if commentId is a number
    if (isNaN(nestedcommentId)) {
      return res.status(400).send("invalid replyId");
    }

    // Check if the nested comment exists
    const findComment = await nestedcomments.findOne({
      where: {
        id: nestedcommentId,
      },
    });
    if (!findComment) {
      return res.status(404).send("reply not found");
    }
    // Find or create a like
    const [newLike, created] = await nestedcommentlikes.findOrCreate({
      where: { nestedcommentId, userId: req.user.id },
      defaults: { nestedcommentId, userId: req.user.id },
    });
    // If like already exists, destroy it
    if (!created) {
      await nestedcommentlikes.destroy({
        where: {
          nestedcommentId,
          userId: req.user.id,
        },
      });
      // Send a 200 OK response after deleting the like
      return res.status(200).send({ liked: false });
    }
    // Create a notification if the user who liked the comment is not the comment owner
    if (req.user.id !== findComment.userId) {
      await notis.create({
        userId: req.user.id,
        type: "LIKE",
        nestedcommentId: findComment.id,
        targetuserId: findComment.userId,
        text: "liked your reply.",
        nestedcommentlikeId: newLike.id,
        postId: findComment.postId,
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
