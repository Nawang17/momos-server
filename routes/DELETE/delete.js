const router = require("express").Router();
("use strict");

const { tokenCheck } = require("../../middleware/tokenCheck");
const deleteComment = require("./deletecomment");
const deletePost = require("./deletepost");
const deleteNestedComment = require("./deletenestedcomment");
//routes
router.delete("/deletecomment/:commentid", tokenCheck, deleteComment);
router.delete("/deletepost/:postId", tokenCheck, deletePost);
router.delete(
  "/deletenestedcomment/:nestedcommentid",
  tokenCheck,
  deleteNestedComment
);

module.exports = router;
