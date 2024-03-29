"use strict";
const { posts } = require("../../models");
const { cloudinary } = require("../../utils/cloudinary");
const { deleteallcache } = require("../../utils/deletecache");
const deletePost = async (req, res) => {
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
        if (findPost.postUser !== req.user.id && req.user.status !== "admin") {
          res.status(400).send("You are not authorized to delete this post");
        } else {
          if (findPost.imagekey) {
            if (findPost.filetype === "video") {
              await cloudinary.uploader.destroy(
                findPost.imagekey,
                {
                  resource_type: "video",
                  // eslint-disable-next-line no-undef
                  upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
                },
                (err, result) => {
                  if (err) {
                    res.status(500).send(err);
                  }
                  console.log("video deleted from cloudinary", result);
                }
              );
            } else if (findPost.filetype === "image") {
              await cloudinary.uploader.destroy(
                findPost.imagekey,
                {
                  // eslint-disable-next-line no-undef
                  upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
                },
                (err, result) => {
                  if (err) {
                    res.status(500).send(err);
                  }
                  console.log("Image deleted from cloudinary", result);
                }
              );
            }
          }
          await posts.destroy({
            where: {
              id: postId,
            },
          });
          deleteallcache();
          res.status(200).send("Post deleted successfully");
          console.log("post deleted successfully");
          // eslint-disable-next-line no-undef
          io.emit("post-deleted", postId);
          return;
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send("Something went wrong");
    }
  }
};

module.exports = deletePost;
