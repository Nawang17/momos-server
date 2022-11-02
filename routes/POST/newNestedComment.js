"use strict";
const router = require("express").Router();
const { users, nestedcomments, comments } = require("../../models");
const { route } = require("./newpost");

router.post("/", async (req, res) => {
  const { text, commentId, replytouserId, postId } = req.body;
  const sanitizedText = text?.trim().replace(/\n{2,}/g, "\n");
  if (!text || !commentId || !replytouserId || !postId) {
    return res.status(400).send("Please provide all the required data");
  } else if (/^\s*$/.test(sanitizedText)) {
    return res.status(400).send("Reply cannot be empty");
  }
  try {
    const findcomment = await comments.findOne({
      where: {
        id: commentId,
      },
    });
    if (!findcomment) {
      return res.status(400).send("Comment not found");
    } else {
      const createNewNestedComment = await nestedcomments.create({
        text: sanitizedText,
        commentId,
        repliedtouserId: replytouserId,
        userId: req.user.id,
        postId,
      });
      if (createNewNestedComment) {
        const nestedcomment = await nestedcomments.findOne({
          where: {
            id: createNewNestedComment.id,
          },
          include: [
            {
              model: users,
              as: "user",

              attributes: ["username", "avatar", "verified", "id"],
            },
            {
              model: users,
              as: "repliedtouser",

              attributes: ["username", "avatar", "verified", "id"],
            },
          ],
        });
        return res.status(200).send({
          message: "Nested Comment created successfully",
          nestedcomment,
        });
      } else {
        return res.status(400).send("Nested Comment creation failed");
      }
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});

module.exports = router;
