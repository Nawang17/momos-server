"use strict";
const router = require("express").Router();
const { commentlikes, notis, comments, users } = require("../../models");
const asyncLock = require("async-lock");
const lock = new asyncLock();
const { deleteallcache } = require("../../utils/deletecache");
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
          deleteallcache();

          return res.status(200).send({ liked: false });
        }
        deleteallcache();
        res.status(201).send({ liked: true });

        //do background task
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
          const findusersocketID = onlineusers
            .filter(
              (obj, index, self) =>
                self.findIndex((o) => o.socketid === obj.socketid) === index
            )
            .find((val) => val.userid === comment.userId);
          if (findusersocketID) {
            const likeuser = await users.findOne({
              where: {
                id: req.user.id,
              },
            });
            io.to(findusersocketID?.socketid).emit("newnotification", {
              type: "liked your comment",
              postId: comment.postId,
              username: likeuser?.username,
              avatar: likeuser?.avatar,
            });
          }
        }
        return;
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
