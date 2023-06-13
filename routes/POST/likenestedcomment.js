"use strict";
const router = require("express").Router();
const {
  nestedcomments,
  nestedcommentlikes,
  notis,
  users,
} = require("../../models");
const asyncLock = require("async-lock");
const lock = new asyncLock();
const { deleteallcache } = require("../../utils/deletecache");
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
    const key = `like-reply-${nestedcommentId}-${req.user.id}`;
    await lock.acquire(
      key,
      async () => {
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
          deleteallcache();

          // Send a 200 OK response after deleting the like
          return res.status(200).send({ liked: false });
        }
        // Send a 201 Created response after creating a new like
        deleteallcache();
        res.status(201).send({ liked: true });

        //do in background

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
          const findusersocketID = onlineusers
            .filter(
              (obj, index, self) =>
                self.findIndex((o) => o.socketid === obj.socketid) === index
            )
            .find((val) => val.userid === findComment.userId);
          if (findusersocketID) {
            const likeuser = await users.findOne({
              where: {
                id: req.user.id,
              },
            });
            io.to(findusersocketID?.socketid).emit("newnotification", {
              type: "liked your reply",
              postId: findComment.postId,
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
