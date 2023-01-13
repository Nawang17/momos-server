"use strict";
const router = require("express").Router();
const { commentlikes, notis, comments } = require("../../models");
const asyncLock = require("async-lock");
const lock = new asyncLock();
router.post("/", async (req, res) => {
  try {
    const { commentId } = req.body;
    if (!commentId) {
      return res.status(400).send("commentId is required");
    }
    if (isNaN(commentId)) {
      return res.status(400).send("Invalid commentid");
    }
    const key = `like-comment-${commentId}-${req.user.id}`;
    await lock.acquire(
      key,
      async () => {
        const comment = await comments.findOne({ where: { id: commentId } });
        if (!comment) {
          return res.status(404).send("Comment not found");
        }
        // Find or create a comment like
        const [like, created] = await commentlikes.findOrCreate({
          where: { commentId, userId: req.user.id },
          defaults: { commentId, userId: req.user.id },
        });

        if (!created) {
          await commentlikes.destroy({ where: { id: like.id } });
          return res.status(200).send({ liked: false });
        }

        if (req.user.id !== comment.userId) {
          await notis.create({
            userId: req.user.id,
            type: "LIKE",
            commentId,
            targetuserId: comment.userId,
            text: "liked your comment.",
            commentlikeId: like.id,
            postId: comment.postId,
          });
        }
        return res.status(201).send({ liked: true });
      },
      { timeout: 5000 }
      // this timeout will force the lock to be released after 5 seconds if it is not released by the code
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
