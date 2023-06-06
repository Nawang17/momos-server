"use strict";
const router = require("express").Router();
const {
  comments,
  posts,
  users,
  nestedcomments,
  notis,
  commentlikes,
} = require("../../models");
var filter = require("../../utils/bad-words-hacked");
filter = new filter();
const { Op } = require("sequelize");
router.put("/", async (req, res) => {
  const { postId, commentid, text, gif } = req.body;
  const sanitizedText = filter.cleanHacked(
    text?.trim().replace(/\n{2,}/g, "\n")
  );
  if (!postId) {
    return res.status(400).send("PostId is required");
  } else if (!gif && /^\s*$/.test(sanitizedText)) {
    return res.status(400).send("Comment cannot be empty");
  } else if (sanitizedText.length > 255) {
    return res.status(400).send("Comment cannot be longer than 255 characters");
  }

  try {
    // check if post exists where comment is being made

    const findpost = await posts.findOne({
      where: {
        id: postId,
      },
    });

    // if post not found, send error

    if (!findpost) {
      return res.status(400).send("Post not found");
    }

    // check if comment exists

    const findcomment = await comments.findOne({
      where: {
        postId,
        userId: req.user.id,
        id: commentid,
      },
    });

    // if comment not found, send error

    if (!findcomment) {
      return res.status(400).send("Comment not found");
    }

    // check if any changes were made
    const checkedited = await comments.findOne({
      where: {
        text: sanitizedText ? sanitizedText : null,
        gif: gif ? gif : null,
        postId,
        id: commentid,
        userId: req.user.id,
      },
    });
    if (checkedited) {
      return res.status(400).send("You didn't change anything");
    }

    // check if comment with same text already exists

    const checkduplicate = await comments.findOne({
      where: {
        text: sanitizedText,
        postId,
        userId: req.user.id,
        id: {
          [Op.not]: commentid,
        },
      },
    });

    // if comment with same text already exists, send error

    if (checkduplicate) {
      return res.status(400).send("Whoops! You already said that.");
    }

    //if everything is ok, update comment
    const checkupdatedcomment = await comments.update(
      {
        text: sanitizedText,
        gif: gif,
      },
      {
        where: {
          id: commentid,
        },
      },
      {
        multi: true,
      }
    );
    if (!checkupdatedcomment) {
      return res.status(400).send("Something went wrong");
    }

    const updatedcomment = await comments.findOne({
      where: {
        id: commentid,
      },
      include: [
        {
          model: commentlikes,
          include: [
            {
              model: users,
              attributes: ["username", "avatar", "verified", "id"],
            },
          ],
        },
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

    res
      .status(200)
      .send({ message: "Comment updated successfully", updatedcomment });

    //do background job to update notifications

    const findnoti = await notis.findOne({
      where: {
        userId: req.user.id,
        type: "COMMENT",
        postId,
        commentId: commentid,
      },
    });
    if (findnoti) {
      await notis.update(
        {
          text: updatedcomment?.text ? updatedcomment?.text : "with a gif",
        },
        {
          where: {
            userId: req.user.id,
            type: "COMMENT",
            postId,
            commentId: commentid,
          },
        }
      );
    }

    return;
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
