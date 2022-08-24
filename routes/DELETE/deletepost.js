"use strict";
const router = require("express").Router();
const { posts } = require("../../models");

router.delete("/:postId", async (req, res) => {
  const { postId } = req.params;
  if (!postId) {
    res.status(400).send("Post id is required");
  } else {
    try {
      const findPost = await posts.findOne({
        where: {
          id: postId,
        },
      });
      if (!findPost) {
        res.status(400).send("Post not found");
      } else {
        if (findPost.postUser !== req.user.id) {
          res.status(400).send("You are not authorized to delete this post");
        } else {
          await posts.destroy({
            where: {
              id: postId,
              postUser: req.user.id,
            },
          });
          res.status(200).send("Post deleted successfully");
        }
      }
    } catch (error) {
      res.status(400).send(error);
    }
  }
});

module.exports = router;
