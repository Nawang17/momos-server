"use strict";
const router = require("express").Router();
const { users, nestedcomments, comments, notis } = require("../../models");
const geoip = require("geoip-lite");
const requestIp = require("request-ip");
const { Client, GatewayIntentBits } = require("discord.js");
let discordbot;
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});
client.on("ready", () => {
  client.users.fetch(process.env.USERID, false).then((users) => {
    discordbot = users;
  });
  client.user.setActivity("with the code", { type: "listening" });
});
client.login(process.env.DISCORD_BOT_TOKEN);
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
        const ip = requestIp.getClientIp(req)
          ? requestIp.getClientIp(req)
          : "209.122.203.50";
        //send discord message
        await discordbot.send(
          `New nested comment from ${nestedcomment?.user?.username} - ${
            (geoip.lookup(ip).city, geoip.lookup(ip).country)
          } (${ip})\n${nestedcomment?.text}
          \nhttps://momosz.com/post/${nestedcomment?.postId}`
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
