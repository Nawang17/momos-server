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
const { sendmessage, sendchannelmessage } = require("../../utils/discordbot");

router.post("/", async (req, res) => {
  const { postId, text, gif } = req.body;
  const sanitizedText = filter.cleanHacked(
    text?.trim().replace(/\n{2,}/g, "\n")
  );
  if (!postId) {
    return res.status(400).send("PostId is required");
  } else if (!gif && /^\s*$/.test(sanitizedText)) {
    return res.status(400).send("Comment cannot be empty");
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

    // check if comment with same text already exists

    const checkduplicate = await comments.findOne({
      where: {
        text: sanitizedText,
        postId,
        userId: req.user.id,
      },
    });

    // if comment with same text already exists, send error

    if (checkduplicate) {
      return res.status(400).send("Whoops! You already said that.");
    }

    // create new comment
    const newComment = await comments.create({
      text: sanitizedText ? sanitizedText : null,
      gif: gif ? gif : null,
      postId,
      userId: req.user.id,
    });

    if (newComment) {
      //like own comment

      await commentlikes.create({
        commentId: newComment?.id,
        userId: req.user.id,
      });

      // get new comment with all the data
      const comment = await comments.findOne({
        where: {
          id: newComment.id,
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

      //send success response with new comment data

      res
        .status(200)
        .send({ message: "Comment created successfully", comment });

      // BACKGROUND TASKS

      // send notification to post owner if not the same user

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
          if (
            finduser.id !== req.user.id &&
            finduser.id !== findpost.postUser
          ) {
            notis.create({
              type: "MENTION",
              text: sanitizedText ? sanitizedText : "",
              targetuserId: finduser.id,
              postId: postId,
              userId: req.user.id,
              commentId: newComment.id,
            });
          }
        }
      });

      if (process.env.NODE_ENV === "production") {
        // send discord channel message for new comment on post to momos server

        await sendchannelmessage(
          `💬 New comment by ${comment?.user?.username}${
            comment?.text ? "\n" + "**" + comment?.text + "**" : ""
          }
        
        ${comment?.gif ? "\n**gif**" : ""}\nhttps://momosz.com/post/${
            comment?.postId
          }
          `
        );

        //send discord message
        await sendmessage(
          req,
          `${comment?.text}
          \nhttps://momosz.com/post/${comment?.postId}`,
          "comment"
        );
      }

      return;
    } else {
      return res.status(400).send("Comment creation failed");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
