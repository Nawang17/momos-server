"use strict";
const { nestedcomments } = require("../../models");

const { deleteallcache } = require("../../utils/deletecache");
const deleteNestedComment = async (req, res) => {
  const { nestedcommentid } = req.params;
  if (!nestedcommentid) {
    return res.status(400).send("Nested comment id is required");
  } else {
    try {
      const findNestedComment = await nestedcomments.findOne({
        where: {
          id: nestedcommentid,
        },
      });
      if (!findNestedComment) {
        return res.status(400).send("Nested comment not found");
      } else {
        if (
          findNestedComment.userId !== req.user.id &&
          req.user.status !== "admin"
        ) {
          return res
            .status(400)
            .send("You are not authorized to delete this comment");
        } else {
          await nestedcomments.destroy({
            where: {
              id: nestedcommentid,
            },
          });

          console.log("nested comment deleted successfully");
          deleteallcache();
          return res.status(200).send("Nested comment deleted successfully");
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send("Something went wrong");
    }
  }
};

module.exports = deleteNestedComment;
