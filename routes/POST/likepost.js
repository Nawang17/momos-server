"use strict";
const router = require("express").Router();
const { likes, notis, posts, users } = require("../../models");
const asyncLock = require("async-lock");
const lock = new asyncLock();

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

    // acquire the lock
    const key = `like-post-${postId}-${req.user.id}`;
    await lock.acquire(
      key,
      async () => {
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

          // Send a 200 No Content response after deleting the like
          return res.status(200).send({ liked: false });
        }
        // Send a 201 Created response after creating a new like
        res.status(201).send({ liked: true });

        //do in background
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
          const findusersocketID = onlineusers
            .filter(
              (obj, index, self) =>
                self.findIndex((o) => o.socketid === obj.socketid) === index
            )
            .find((val) => val.userid === findpost?.postUser);
          if (findusersocketID) {
            const likeuser = await users.findOne({
              where: {
                id: req.user.id,
              },
            });
            io.to(findusersocketID?.socketid).emit("newnotification", {
              type: "liked your post",
              postId,
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
