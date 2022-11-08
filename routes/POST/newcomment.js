"use strict";
const router = require("express").Router();
const {
  comments,
  posts,
  users,
  nestedcomments,
  notis,
} = require("../../models");

router.post("/", async (req, res) => {
  const { postId, text } = req.body;
  const sanitizedText = text?.trim().replace(/\n{2,}/g, "\n");
  if (!postId || !text) {
    return res.status(400).send("PostId and Text are required");
  } else if (/^\s*$/.test(sanitizedText)) {
    return res.status(400).send("Reply cannot be empty");
  }

  try {
    const findpost = await posts.findOne({
      where: {
        id: postId,
      },
    });
    if (!findpost) {
      return res.status(400).send("Post not found");
    }
    const newComment = await comments.create({
      text: sanitizedText,
      postId,
      userId: req.user.id,
    });
    if (req.user.id !== findpost.postUser) {
      await notis.create({
        userId: req.user.id,
        type: "COMMENT",
        postId,
        targetuserId: findpost.postUser,
        text: sanitizedText,
        commentId: newComment.id,
      });
    }

    if (newComment) {
      const comment = await comments.findOne({
        where: {
          id: newComment.id,
        },
        include: [
          {
            model: users,
            attributes: ["username", "avatar", "verified", "id"],
          },
          {
            model: nestedcomments,

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
          },
        ],
      });

      return res
        .status(200)
        .send({ message: "Comment created successfully", comment });
    } else {
      return res.status(400).send("Comment creation failed");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
