"use strict";
const router = require("express").Router();
const {
  comments,
  posts,
  users,
  nestedcomments,
  notis,
  commentlikes,
  nestedcommentlikes,
} = require("../../models");
var filter = require("../../utils/bad-words-hacked");
filter = new filter();
const { Op } = require("sequelize");
const cache = require("../../utils/cache");
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
          seperate: true,
          include: [
            {
              model: users,
              attributes: ["username", "avatar", "verified", "id"],
            },
          ],
          seperate: true,
        },

        {
          model: users,
          attributes: ["username", "avatar", "verified", "id"],
        },
        {
          model: nestedcomments,
          seperate: true,
          include: [
            {
              model: nestedcommentlikes,
              seperate: true,

              include: [
                {
                  model: users,
                  attributes: ["username", "avatar", "verified", "id"],
                },
              ],
            },
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
    cache.del(`singlepost:${postId}`);
    res
      .status(200)
      .send({ message: "Comment updated successfully", updatedcomment });

    //do background job to update notifications
    // send notification to post owner if not the same user

    //delete all old notifications for this comment

    await notis.destroy({
      where: {
        commentId: commentid,
        userId: req.user.id,
      },
    });

    // create new notification for this comment
    if (req.user.id !== findpost.postUser) {
      await notis.create({
        userId: req.user.id,
        type: "COMMENT",
        postId,
        targetuserId: findpost.postUser,
        text: sanitizedText ? sanitizedText : "with a gif",
        commentId: updatedcomment.id,
      });
      const findusersocketID = onlineusers
        .filter(
          (obj, index, self) =>
            self.findIndex((o) => o.socketid === obj.socketid) === index
        )
        .find((val) => val.userid === findpost.postUser);
      if (findusersocketID) {
        const replyuser = await users.findOne({
          where: {
            id: req.user.id,
          },
        });
        io.to(findusersocketID?.socketid).emit("newnotification", {
          type: sanitizedText
            ? "commented: " + sanitizedText
            : "commented with a gif",
          postId,
          username: replyuser?.username,
          avatar: replyuser?.avatar,
        });
      }
    }

    // send notifications to all users mentioned in the comment

    const mentionsarr = sanitizedText?.match(/(@\w+)/gi);

    let mentions = [];
    mentionsarr?.map((val) => {
      mentions?.push(val.slice(1));
    });
    mentions?.forEach(async (val) => {
      const finduser = await users.findOne({
        where: {
          username: val,
        },
      });
      if (finduser) {
        if (finduser.id !== req.user.id && finduser.id !== findpost.postUser) {
          notis.create({
            type: "MENTION",
            text: sanitizedText ? sanitizedText : "with a gif",
            targetuserId: finduser.id,
            postId: postId,
            userId: req.user.id,
            commentId: updatedcomment.id,
          });

          const findusersocketID = onlineusers
            .filter(
              (obj, index, self) =>
                self.findIndex((o) => o.socketid === obj.socketid) === index
            )
            .find((val) => val.userid === finduser.id);
          if (findusersocketID) {
            io.to(findusersocketID?.socketid).emit("newnotification", {
              type: sanitizedText
                ? "commented: " + sanitizedText
                : "commented with a gif",
              postId,
              username: finduser?.username,
              avatar: finduser?.avatar,
            });
          }
        }
      }
    });

    return;
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
