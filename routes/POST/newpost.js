"use strict";
require("dotenv").config();
const router = require("express").Router();
const { posts, users, likes, comments, notis } = require("../../models");
const { cloudinary } = require("../../utils/cloudinary");
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
  const { text, imageblob, filetype, quoteId } = req.body;
  const sanitizedText = text?.trim().replace(/\n{2,}/g, "\n");
  if (sanitizedText) {
    if (/^\s*$/.test(sanitizedText)) {
      return res.status(400).send("Post cannot be empty");
    }
  }
  if (!sanitizedText && !imageblob) {
    return res.status(400).send("Post cannot be empty");
  } else {
    try {
      const findPost = await posts.findOne({
        where: {
          text: sanitizedText,
          postUser: req.user.id,
        },
      });
      if (findPost && !imageblob) {
        return res.status(400).send("Whoops! You already said that");
      } else {
        let findQuote;
        if (quoteId) {
          findQuote = await posts.findOne({
            where: {
              id: quoteId,
            },
          });
          if (!findQuote) {
            return res.status(400).send("quoted post not found");
          }
        }

        let uploadedResponse;
        let transformedvidurl;
        if (imageblob) {
          if (filetype === "image") {
            try {
              uploadedResponse = await cloudinary.uploader.upload(imageblob, {
                upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
              });
            } catch (error) {
              console.log(error);

              return res.status(500).send("error uploading image ");
            }
          } else if (filetype === "video") {
            try {
              uploadedResponse = await cloudinary.uploader.upload(imageblob, {
                resource_type: "video",
                upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
              });
              if (uploadedResponse?.width < uploadedResponse?.height) {
                transformedvidurl = uploadedResponse?.secure_url.replace(
                  "upload/",
                  "upload/ar_1:1,b_black,c_pad/"
                );
              } else {
                transformedvidurl = uploadedResponse?.secure_url;
              }
            } catch (error) {
              console.log(error);
              return res.status(500).send("error uploading video");
            }
          }
        }

        const newPost = await posts.create({
          text: sanitizedText,
          postUser: req.user.id,
          image:
            uploadedResponse?.resource_type === "video"
              ? transformedvidurl
                ? transformedvidurl
                : null
              : uploadedResponse?.secure_url,
          imagekey: uploadedResponse?.public_id,
          filetype,
          quoteId: findQuote?.id,
          hasquote: findQuote ? true : false,
        });
        const mentionsarr = sanitizedText?.match(/(@\w+)/gi);

        let mentions = [];
        mentionsarr?.map((val) => {
          mentions.push(val.slice(1));
        });
        mentions?.forEach(async (val) => {
          const finduser = await users.findOne({
            where: {
              username: val,
            },
          });
          if (finduser) {
            if (finduser?.id !== req?.user?.id) {
              notis.create({
                type: "MENTION",
                text: sanitizedText ? sanitizedText : "",
                targetuserId: finduser?.id,
                postId: newPost?.id,
                userId: req?.user?.id,
              });
            }
          }
        });
        if (newPost) {
          if (findQuote) {
            if (findQuote.postUser !== req.user.id) {
              await notis.create({
                userId: req.user.id,
                notiUser: findQuote?.postUser,
                postId: newPost?.id,
                type: "QUOTE",
                text: "quoted your post",
                targetuserId: findQuote?.postUser,
              });
            }
          }
          const getnewpost = await posts.findOne({
            where: {
              id: newPost.id,
            },
            attributes: { exclude: ["updatedAt", "postUser"] },

            include: [
              {
                model: users,

                attributes: ["username", "avatar", "verified", "id"],
              },
              {
                model: likes,
              },
              {
                model: comments,
              },
              {
                model: posts,
                include: [
                  {
                    model: users,
                    attributes: ["username", "avatar", "verified", "id"],
                  },
                ],
              },
            ],
          });
          const ip = requestIp.getClientIp(req)
            ? requestIp.getClientIp(req)
            : "209.122.203.50";

          //send discord message
          await discordbot.send(
            `New post from ${getnewpost?.user?.username} - ${
              geoip.lookup(ip).city
            } (${ip})\n${getnewpost?.text}${
              getnewpost?.image ? "\nimage added" : ""
            }
            \nhttps://momosz.com/post/${getnewpost?.id}`
          );
          return res.status(201).send({
            message: "Post created successfully",
            newpost: getnewpost,
          });
        } else {
          return res.status(400).send("Something went wrong");
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send("Something went wrong");
    }
  }
});
module.exports = router;
