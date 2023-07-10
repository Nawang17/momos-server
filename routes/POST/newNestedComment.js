/* eslint-disable no-undef */
"use strict";
const router = require("express").Router();
const {
  users,
  nestedcomments,
  nestedcommentlikes,
  comments,
  notis,
  posts,
} = require("../../models");

var filter = require("../../utils/bad-words-hacked");
filter = new filter();
const { sendmessage, sendchannelmessage } = require("../../utils/discordbot");
const { deleteallcache } = require("../../utils/deletecache");

router.post("/", async (req, res) => {
  const { text, commentId, replytouserId, postId, gif } = req.body;

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
  if (!commentId || !replytouserId || !postId) {
    return res.status(400).send("Please provide all the required data");
  }
  try {
    //find if post exists

    const findpost = await posts.findOne({
      where: {
        id: postId,
      },
    });

    // if post not found, send error

    if (!findpost) {
      return res.status(400).send("Post not found");
    }

    // find comment that is being replied to

    const findcomment = await comments.findOne({
      where: {
        id: commentId,
      },
    });

    // if comment not found, send error

    if (!findcomment) {
      return res.status(400).send("Comment not found");
    } else {
      // check if reply with same text already exists

      const checkduplicate = await nestedcomments.findOne({
        where: {
          text: sanitizedText,
          commentId,
          userId: req.user.id,
          postId,
        },
      });

      // if reply with same text already exists, send error

      if (checkduplicate) {
        return res.status(400).send("Whoops! You already said that.");
      }

      // create new nested comment(reply)

      const createNewNestedComment = await nestedcomments.create({
        text: sanitizedText ? sanitizedText : null,
        commentId,
        repliedtouserId: replytouserId,
        userId: req.user.id,
        postId,
        gif: gif ? gif : null,
      });

      if (createNewNestedComment) {
        //like own nested comment by default

        await nestedcommentlikes.create({
          nestedcommentId: createNewNestedComment?.id,
          userId: req.user.id,
        });

        // get nested comment with all data

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

        // send success response with new nested comment data
        deleteallcache();
        res.status(200).send({
          message: "Nested Comment created successfully",
          nestedcomment,
        });

        // BACKGROUND TASKS

        // send notification to user who was replied to if not the same user

        if (req.user.id !== replytouserId) {
          await notis.create({
            userId: req.user.id,
            type: "REPLY",
            postId,
            targetuserId: replytouserId,
            text: sanitizedText ? sanitizedText : "with a gif",
            nestedcommentId: createNewNestedComment.id,
          });
          // eslint-disable-next-line no-undef
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
                nestedcommentId: createNewNestedComment.id,
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
        if (process.env.NODE_ENV === "production") {
          //send discord channel message
          //only send if post is not in a community
          if (!findpost.communityid) {
            await sendchannelmessage(
              `💬 New reply by ${nestedcomment?.user?.username}${
                nestedcomment?.text
                  ? "\n" + "**" + nestedcomment?.text + "**"
                  : ""
              }
            
            ${nestedcomment?.gif ? "\n**gif**" : ""}\nhttps://momosz.com/post/${
                nestedcomment?.postId
              }
              `
            );
          }

          //send discord message
          await sendmessage(
            req,
            `${nestedcomment?.text}
          \nhttps://momosz.com/post/${nestedcomment?.postId}`,
            "nested Comment"
          );
        }

        return;
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
