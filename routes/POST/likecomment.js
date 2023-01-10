"use strict";
const router = require("express").Router();
const { commentlikes, notis, posts, comments } = require("../../models");

router.post("/", async (req, res) => {
  const { commentId } = req.body;
  if (!commentId) {
    return res.status(400).send("commentId is required");
  }
  try {
    const findcomment = await comments.findOne({
      where: {
        id: commentId,
      },
    });
    if (!findcomment) {
      return res.status(400).send("comment not found");
    }
    const findcommentlike = await commentlikes.findOne({
      where: {
        commentId,
        userId: req.user.id,
      },
    });
    if (findcommentlike) {
      await commentlikes.destroy({
        where: {
          commentId,
          userId: req.user.id,
        },
      });
      return res.status(200).send({ liked: false });
    } else {
      const newcommentlike = await commentlikes.create({
        commentId,
        userId: req.user.id,
      });
      if (newcommentlike) {
        if (req.user.id !== findcomment?.userId) {
          const noti = await notis.create({
            userId: req.user.id,
            type: "LIKE",
            commentId,
            targetuserId: findcomment?.userId,
            text: "liked your comment.",
            commentlikeId: newcommentlike?.id,
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
