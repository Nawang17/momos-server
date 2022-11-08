"use strict";
require("dotenv").config();

const router = require("express").Router();
const { posts, users, likes, comments } = require("../../models");
const { cloudinary } = require("../../utils/cloudinary");
router.post("/", async (req, res) => {
  const { text, imageblob } = req.body;
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
        let uploadedResponse;
        if (imageblob) {
          try {
            uploadedResponse = await cloudinary.uploader.upload(imageblob, {
              upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
            });
          } catch (error) {
            return res.status(500).send("error uploading image to cloudinary");
          }
        }
        const newPost = await posts.create({
          text: sanitizedText,
          postUser: req.user.id,
          image: uploadedResponse?.secure_url,
          imagekey: uploadedResponse?.public_id,
        });
        if (newPost) {
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
            ],
          });

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
