"use strict";
const router = require("express").Router();
const { likes, notis } = require("../../models");

router.post("/", async (req, res) => {
  const { postId, targetid } = req.body;
  if (!postId || !targetid) {
    return res.status(400).send("postId and targetid is required");
  } else {
    try {
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
        if (req.user.id !== targetid) {
          await notis.destroy({
            where: {
              postId,
              userId: req.user.id,
              targetuserId: targetid,
              type: "LIKE",
            },
          });
        }

        return res.status(200).send({ liked: false });
      } else {
        await likes.create({
          postId,
          userId: req.user.id,
        });
        if (req.user.id !== targetid) {
          await notis.create({
            userId: req.user.id,
            type: "LIKE",
            postId,
            targetuserId: targetid,
            text: "liked your post.",
          });
        }

        return res.status(200).send({ liked: true });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send("Something went wrong");
    }
  }
});

module.exports = router;
