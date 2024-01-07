const router = require("express").Router();
("use strict");

const { tokenCheck } = require("../../middleware/tokenCheck");
const {
  editcommentlimit,
  resetPasswordtokenrequest,
} = require("../../middleware/rateLimit");

const editComment = require("./editcomments");
const editNestedComment = require("./editnestedcomments");
const {
  forgotPassword,
  resetTokenCheck,
  resetPassword,
} = require("./forgotPassword");
//routes
router.put("/editcomment", tokenCheck, editcommentlimit, editComment);
router.put(
  "/editnestedcomment",
  tokenCheck,
  editcommentlimit,
  editNestedComment
);
router.put("/forgotPassword", resetPasswordtokenrequest, forgotPassword);
router.get("/resetTokenCheck/:resetToken", resetTokenCheck);
router.put("/resetPassword", resetPassword);

module.exports = router;
