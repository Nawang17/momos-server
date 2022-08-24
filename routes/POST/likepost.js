"use strict";
const router = require("express").Router();
const { likes } = require("../../models");

router.post("/", async (req, res) => {
  const { postId } = req.body;
  if (!postId) {
    return res.status(400).send("postId is required");
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
        return res.status(200).send({ liked: false });
      } else {
        await likes.create({
          postId,
          userId: req.user.id,
        });
        return res.status(200).send({ liked: true });
      }
    } catch (error) {
      return res.status(500).send(error);
    }
  }
});

module.exports = router;
