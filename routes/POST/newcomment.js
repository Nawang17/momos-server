"use strict";
const router = require("express").Router();
const {
  comments,
  posts,
  users,
  nestedcomments,
  notis,
} = require("../../models");
const geoip = require("geoip-lite");

const Discord = require("discord.js");
let discordbot;
const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES"],
});
client.on("ready", () => {
  client.users.fetch(process.env.USERID, false).then((users) => {
    discordbot = users;
  });
  client.user.setActivity("with the code", { type: "listening" });
});
client.login(process.env.DISCORD_BOT_TOKEN);
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
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      //send discord message
      await discordbot.send(
        `New comment from ${comment?.user?.username} - ${
          geoip.lookup(ip).city
        } (${ip})\n${comment?.text}
        \nhttps://momosz.com/post/${comment?.postId}`
      );
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
