"use strict";
const router = require("express").Router();
const { posts } = require("../../models");
const { cloudinary } = require("../../utils/cloudinary");

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
        if (findPost.postUser !== req.user.id && req.user.id !== 5) {
          res.status(400).send("You are not authorized to delete this post");
        } else {
          if (findPost.imagekey) {
            await cloudinary.uploader.destroy(
              findPost.imagekey,
              (err, result) => {
                if (err) {
                  res.status(500).send(err);
                }
                console.log("Image deleted from cloudinary", result);
              }
            );
          }
          await posts.destroy({
            where: {
              id: postId,
              postUser: req.user.id,
            },
          });
          res.status(200).send("Post deleted successfully");
          console.log("post deleted successfully");
        }
      }
    } catch (error) {
      return res.status(400).send(error);
    }
  }
});

module.exports = router;
