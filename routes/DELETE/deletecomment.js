"use strict";
const { comments } = require("../../models");
const { deleteallcache } = require("../../utils/deletecache");
const deleteComment = async (req, res) => {
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
        if (findComment.userId !== req.user.id && req.user.status !== "admin") {
          return res
            .status(400)
            .send("You are not authorized to delete this comment");
        } else {
          await comments.destroy({
            where: {
              id: commentid,
            },
          });

          console.log("comment deleted successfully");
          deleteallcache();
          return res.status(200).send("Comment deleted successfully");
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send("Something went wrong");
    }
  }
};

module.exports = deleteComment;
