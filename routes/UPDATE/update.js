const router = require("express").Router();
("use strict");

const { tokenCheck } = require("../../middleware/tokenCheck");
const { editcommentlimit } = require("../../middleware/rateLimit");

const editComment = require("./editcomments");
const editNestedComment = require("./editnestedcomments");
//routes
router.put("/editcomment", tokenCheck, editcommentlimit, editComment);
router.put(
  "/editnestedcomment",
  tokenCheck,
  editcommentlimit,
  editNestedComment
);
module.exports = router;
