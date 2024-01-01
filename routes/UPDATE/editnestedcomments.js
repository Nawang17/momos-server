"use strict";
const router = require("express").Router();
const {
  users,
  nestedcomments,
  nestedcommentlikes,

  notis,
} = require("../../models");
const { Op } = require("sequelize");

var filter = require("../../utils/bad-words-hacked");
filter = new filter();
const cache = require("../../utils/cache");
const editNestedComment = async (req, res) => {
  const { text, commentId, replytouserId, postId, gif, nestedcommentId } =
    req.body;

  const sanitizedText = filter.cleanHacked(
    text?.trim().replace(/\n{2,}/g, "\n")
  );
  if (!sanitizedText && !gif) {
    return res.status(400).send("Reply cannot be empty");
  } else if (sanitizedText) {
    if (sanitizedText.length > 255) {
      return res.status(400).send("Reply cannot be longer than 255 characters");
    }
    if (/^\s*$/.test(sanitizedText)) {
      return res.status(400).send("Invalid reply");
    }
  }
  if (!commentId || !replytouserId || !postId || !nestedcommentId) {
    return res.status(400).send("Please provide all the required data");
  }
  try {
    // find nested comment that is being edited

    const findnestedcomment = await nestedcomments.findOne({
      where: {
        id: nestedcommentId,
        userId: req.user.id,
      },
    });

    // if comment not found, send error

    if (!findnestedcomment) {
      return res.status(400).send("reply not found");
    } else {
      // check if any changes were made
      const checkedited = await nestedcomments.findOne({
        where: {
          text: sanitizedText ? sanitizedText : null,
          gif: gif ? gif : null,
          commentId,
          userId: req.user.id,
          postId,
          id: nestedcommentId,
        },
      });
      if (checkedited) {
        return res.status(400).send("You didn't change anything");
      }
      // check if reply with same text already exists

      const checkduplicate = await nestedcomments.findOne({
        where: {
          text: sanitizedText,
          commentId,
          userId: req.user.id,
          postId,
          id: {
            [Op.not]: nestedcommentId,
          },
        },
      });

      // if reply with same text already exists, send error

      if (checkduplicate) {
        return res.status(400).send("Whoops! You already said that.");
      }

      //if reply is edited, update reply

      const checkupdatedreply = await nestedcomments.update(
        {
          text: sanitizedText,
          gif: gif,
        },
        {
          where: {
            id: nestedcommentId,
          },
        },
        {
          multi: true,
        }
      );
      if (!checkupdatedreply) {
        return res.status(400).send("Something went wrong");
      }

      const updatedreply = await nestedcomments.findOne({
        where: {
          id: nestedcommentId,
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
      cache.del(`singlepost:${postId}`);

      // send success response with updated nested comment data

      res.status(200).send({
        message: "Nested Comment created successfully",
        updatedreply,
      });

      //do background job to update notifications

      //delete all old notifications for this reply

      await notis.destroy({
        where: {
          nestedcommentId: updatedreply?.id,
          userId: req.user.id,
        },
      });

      // send notification to user who was replied to if not the same user

      if (req.user.id !== replytouserId) {
        await notis.create({
          userId: req.user.id,
          type: "REPLY",
          postId,
          targetuserId: replytouserId,
          text: sanitizedText ? sanitizedText : "with a gif",
          nestedcommentId: updatedreply.id,
        });
        const findusersocketID = onlineusers
          .filter(
            (obj, index, self) =>
              self.findIndex((o) => o.socketid === obj.socketid) === index
          )
          .find((val) => val.userid === replytouserId);
        if (findusersocketID) {
          const replyuser = await users.findOne({
            where: {
              id: req.user.id,
            },
          });
          io.to(findusersocketID?.socketid).emit("newnotification", {
            type: sanitizedText
              ? "replied: " + sanitizedText
              : "replied: with a gif",
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
          if (finduser.id !== req.user.id && finduser.id !== replytouserId) {
            notis.create({
              type: "MENTION",
              text: sanitizedText ? sanitizedText : "",
              targetuserId: finduser.id,
              postId: postId,
              userId: req.user.id,
              nestedcommentId: updatedreply.id,
            });
            const findusersocketID = onlineusers
              .filter(
                (obj, index, self) =>
                  self.findIndex((o) => o.socketid === obj.socketid) === index
              )
              .find((val) => val.userid === finduser?.id);
            if (findusersocketID) {
              io.to(findusersocketID?.socketid).emit("newnotification", {
                type: sanitizedText
                  ? "replied: " + sanitizedText
                  : "replied: with a gif",
                postId,
                username: finduser?.username,
                avatar: finduser?.avatar,
              });
            }
          }
        }
      });

      return;
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
};

module.exports = editNestedComment;
