"use strict";
const router = require("express").Router();
const { comments } = require("../../models");

router.delete("/:commentid", async (req, res) => {
  const { commentid } = req.params;
  if (!commentid) {
    return res.status(400).send("Comment id is required");
  } else {
    try {
      const findComment = await comments.findOne({
        where: {
          id: commentid,
        },
      });
      if (!findComment) {
        return res.status(400).send("Comment not found");
      } else {
        if (findComment.userId !== req.user.id) {
          return res
            .status(400)
            .send("You are not authorized to delete this comment");
        } else {
          await comments.destroy({
            where: {
              id: commentid,
              userId: req.user.id,
            },
          });
          console.log("comment deleted successfully");
          return res.status(200).send("Comment deleted successfully");
        }
      }
    } catch (error) {
      res.status(400).send(error);
    }
  }
});

module.exports = router;
