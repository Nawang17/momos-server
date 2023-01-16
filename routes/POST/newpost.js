"use strict";
require("dotenv").config();
const router = require("express").Router();
const { posts, users, notis } = require("../../models");
const fs = require("fs");
const { cloudinary } = require("../../utils/cloudinary");
var filter = require("../../utils/bad-words-hacked");
filter = new filter();
const sequelize = require("sequelize");
const upload = require("../../utils/multermediaupload");
const { sendmessage } = require("../../utils/discordbot");

const uploadmedia = async (res, media) => {
  try {
    const imgsizelimit = 9437184; //9mb
    const videosizelimit = 52428800; //50 mb

    let mediaurl;
    let mediakey;
    let error;

    //if media is not an image or video, send error

    if (
      !media?.mimetype.startsWith("image") &&
      !media?.mimetype.startsWith("video")
    ) {
      error = "Media type not supported";
    }

    //if media size is not within limits send error
    else if (
      media?.size >
      (media?.mimetype.startsWith("image") ? imgsizelimit : videosizelimit)
    ) {
      fs.unlink(media?.path, (err) => {
        if (err) throw err;
        console.log(`media deleted from server because of size limit`);
      });

      error = `${
        media?.mimetype.startsWith("image") ? "image" : "video"
      } size cannot exceed  ${
        media?.mimetype.startsWith("image") ? "9mb" : "50mb"
      }`;
    } else {
      //upload media to cloudinary

      await cloudinary.uploader.upload(
        media?.path,
        {
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          resource_type: "auto",
        },
        (err, result) => {
          // if error, send error status
          if (err) {
            fs.unlink(media?.path, (err) => {
              if (err) throw err;
              console.log(
                `media deleted from server after error uploading to cloudinary`
              );
            });
            console.log(err);
            error = "Error uploading media";
          }
          // if no error, delete media from server
          fs.unlink(media?.path, (err) => {
            if (err) throw err;
            console.log(`media deleted from server after successful upload`);
          });

          mediaurl = result?.secure_url;
          mediakey = result?.public_id;
          if (result?.resource_type === "video") {
            if (result?.width < result?.height) {
              mediaurl = result?.secure_url.replace(
                "upload/",
                "upload/ar_1:1,b_black,c_pad/"
              );
            }
          }
        }
      );
    }

    return [mediaurl, mediakey, error];
  } catch (error) {
    console.log("error");
  }
};

router.post("/", upload.single("media"), async (req, res) => {
  try {
    const media = req.file ? req.file : null;
    let quoteExists = null;
    let newtext = req.body.text ? req.body.text : null;
    let quoteid = req.body.quoteid ? req.body.quoteid : null;
    let mediaurl;
    let mediakey;

    //check if both text and media are empty
    if (!media && !newtext) {
      return res.status(400).send("Post cannot be empty");
    }

    if (newtext) {
      //filter text for bad words and remove extra newlines(/n)
      newtext = filter.cleanHacked(newtext?.trim().replace(/\n{2,}/g, "\n"));
      //send error if text contains only whitespace
      if (/^\s*$/.test(newtext)) {
        return res.status(400).send("Post cannot be empty");
      }
      // search for posts with same text and same user
      const existingPost = await posts.findOne({
        where: {
          text: newtext,
          postUser: req.user.id,
        },
      });
      //send error if post with same text and user already exists
      if (existingPost) {
        if (media) {
          //delete media from server if it exists
          fs.unlink(media?.path, (err) => {
            if (err) throw err;
            console.log(`media deleted from server after duplicate text error`);
          });
        }
        return res.status(400).send("Whoops! You already said that");
      }
    }
    // check if quoteid is provided
    if (quoteid) {
      //check if quoteid is a number
      if (isNaN(quoteid)) {
        return res.status(400).send("Invalid quote id");
      }
      //find quoted post
      quoteExists = await posts.findOne({
        where: {
          id: Number(quoteid),
        },
      });
      //send error if quoted post not found
      if (!quoteExists) {
        return res.status(400).send("Quoted post not found");
      }
    }
    // check if media is provided
    if (media) {
      const mediauploadresults = await uploadmedia(res, media);

      if (mediauploadresults[2]) {
        return res.status(400).send(mediauploadresults[2]);
      }
      mediaurl = mediauploadresults[0];
      mediakey = mediauploadresults[1];
    }
    //create new post

    const newPost = await posts.create({
      text: newtext ? newtext : null,
      image: mediaurl ? mediaurl : null,
      imagekey: mediakey ? mediakey : null,
      postUser: req.user.id,
      filetype: media ? media?.mimetype.split("/")[0] : null,
      quoteId: quoteExists ? Number(quoteid) : null,
      hasquote: quoteExists ? true : false,
    });

    if (newPost) {
      //send notification to quoted user
      if (quoteExists) {
        if (quoteExists.postUser !== req.user.id) {
          await notis.create({
            userId: req.user.id,
            notiUser: quoteExists.postUser,
            postId: newPost.id,
            type: "QUOTE",
            text: "quoted your post",
            targetuserId: quoteExists.postUser,
          });
        }
      }
      //send notification to mentioned users in text
      if (newtext) {
        // extract mentioned users from text

        const mentionedUsers = newtext
          ?.match(/(@\w+)/gi)
          ?.map((match) => match.slice(1));
        if (mentionedUsers?.length > 0) {
          // find if mentioned users in database

          const findmentionedUsers = await users.findAll({
            where: {
              username: {
                [sequelize.Op.in]: mentionedUsers,
              },
            },
          });

          if (findmentionedUsers?.length !== 0) {
            // send notification to mentioned users

            findmentionedUsers?.forEach(async (user) => {
              if (user.id !== req.user.id) {
                await notis.create({
                  type: "MENTION",
                  text: newtext ? newtext : null,
                  targetuserId: user?.id,
                  postId: newPost?.id,
                  userId: req.user.id,
                });
              }
            });
          }
        }
      }
    }

    //send discord message

    await sendmessage(
      req,
      `${newPost?.text}${
        newPost?.image ? "\nimage added" : ""
      }\nhttps://momosz.com/post/${newPost?.id}`,
      "post"
    );

    // send success response
    return res.status(201).send({
      message: "Post created successfully",
      newpostid: newPost.id,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
