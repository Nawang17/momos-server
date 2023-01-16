"use strict";
const router = require("express").Router();
const {
  users,
  nestedcomments,
  nestedcommentlikes,
  comments,
  notis,
} = require("../../models");

var filter = require("../../utils/bad-words-hacked");
filter = new filter();
const { sendmessage } = require("../../utils/discordbot");
router.post("/", async (req, res) => {
  const { text, commentId, replytouserId, postId } = req.body;
  const sanitizedText = filter.cleanHacked(
    text?.trim().replace(/\n{2,}/g, "\n")
  );
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
      const checkduplicate = await nestedcomments.findOne({
        where: {
          text: sanitizedText,
          commentId,
          userId: req.user.id,
          postId,
        },
      });
      if (checkduplicate) {
        return res.status(400).send("Whoops! You already said that.");
      }
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
              model: nestedcommentlikes,
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
        });
        if (req.user.id !== replytouserId) {
          await notis.create({
            userId: req.user.id,
            type: "REPLY",
            postId,
            targetuserId: replytouserId,
            text: sanitizedText,
            nestedcommentId: createNewNestedComment.id,
          });
        }
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
            if (finduser.id !== req.user.id && finduser.id !== replytouserId) {
              notis.create({
                type: "MENTION",
                text: sanitizedText ? sanitizedText : "",
                targetuserId: finduser.id,
                postId: postId,
                userId: req.user.id,
                nestedcommentId: createNewNestedComment.id,
              });
            }
          }
        });

        //send discord message
        await sendmessage(
          req,
          `${nestedcomment?.text}
          \nhttps://momosz.com/post/${nestedcomment?.postId}`,
          "nested Comment"
        );
        return res.status(200).send({
          message: "Nested Comment created successfully",
          nestedcomment,
        });
      } else {
        return res.status(400).send("Nested Comment creation failed");
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
