"use strict";
const router = require("express").Router();
const { nestedcomments, nestedcommentlikes, notis } = require("../../models");

router.post("/", async (req, res) => {
  const { nestedcommentId } = req.body;
  if (!nestedcommentId) {
    return res.status(400).send("commentId is required");
  }
  try {
    const findcomment = await nestedcomments.findOne({
      where: {
        id: nestedcommentId,
      },
    });
    if (!findcomment) {
      return res.status(400).send("comment not found");
    }
    const findcommentlike = await nestedcommentlikes.findOne({
      where: {
        nestedcommentId,
        userId: req.user.id,
      },
    });
    if (findcommentlike) {
      await nestedcommentlikes.destroy({
        where: {
          nestedcommentId,
          userId: req.user.id,
        },
      });
      return res.status(200).send({ liked: false });
    } else {
      const newcommentlike = await nestedcommentlikes.create({
        nestedcommentId,
        userId: req.user.id,
      });
      if (newcommentlike) {
        if (req.user.id !== findcomment?.userId) {
          await notis.create({
            userId: req.user.id,
            type: "LIKE",
            nestedcommentId,
            targetuserId: findcomment?.userId,
            text: "liked your comment.",
            nestedcommentlikeId: newcommentlike?.id,
            postId: findcomment?.postId,
          });
        }
        return res.status(200).send({ liked: true });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
