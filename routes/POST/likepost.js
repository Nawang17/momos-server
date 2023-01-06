"use strict";
const router = require("express").Router();
const { likes, notis, posts } = require("../../models");

router.post("/", async (req, res) => {
  const { postId } = req.body;
  if (!postId) {
    return res.status(400).send("postId is required");
  } else {
    try {
      const findpost = await posts.findOne({
        where: {
          id: postId,
        },
      });
      if (!findpost) {
        return res.status(400).send("post not found");
      }

      const findLike = await likes.findOne({
        where: {
          postId,
          userId: req.user.id,
        },
      });
      if (findLike) {
        await likes.destroy({
          where: {
            postId,
            userId: req.user.id,
          },
        });

        return res.status(200).send({ liked: false });
      } else {
        const newlike = await likes.create({
          postId,
          userId: req.user.id,
        });
        if (newlike) {
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

          return res.status(200).send({ liked: true });
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send("Something went wrong");
    }
  }
});

module.exports = router;
