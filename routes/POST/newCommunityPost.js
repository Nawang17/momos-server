"use strict";
require("dotenv").config();
const router = require("express").Router();
const {
  posts,
  users,
  notis,
  previewlinks,
  postquotes,
  likes,
  polls,
  pollchoices,
  communities,
  communitymembers,
} = require("../../models");
const fs = require("fs");
const { cloudinary } = require("../../utils/cloudinary");
var filter = require("../../utils/bad-words-hacked");
filter = new filter();
const sequelize = require("sequelize");
const upload = require("../../utils/multermediaupload");
const { sendmessage, sendchannelmessage } = require("../../utils/discordbot");
const { getLinkPreview } = require("link-preview-js");
const { deleteallcache } = require("../../utils/deletecache");
router.post("/", upload.single("media"), async (req, res) => {
  try {
    const communityname = req.body.communityname
      ? req.body.communityname
      : null;
    if (!communityname) {
      return res.status(400).send("Community name cannot be empty");
    }
    const community = await communities.findOne({
      where: {
        name: communityname,
      },
    });
    if (!community) {
      return res.status(400).send("Community does not exist");
    }
    //check if user is a member of the community
    const isMember = await communitymembers.findOne({
      where: {
        communityId: community.id,
        userId: req.user.id,
      },
    });
    if (!isMember) {
      return res.status(400).send("You are not a member of this community");
    }

    const media = req.file ? req.file : null;
    let quoteExists = null;
    let newtext = req.body.text ? req.body.text : null;
    let quoteid = req.body.quoteid ? req.body.quoteid : null;
    let gif = req.body.gif ? req.body.gif : null;
    let mediaurl;
    let mediakey;

    //check if all the values are empty
    if (!media && !newtext && !gif) {
      return res.status(400).send("Post cannot be empty");
    }
    if (media && gif) {
      return res.status(400).send("Cannot add media and gif at the same time");
    }

    if (newtext) {
      //filter text for bad words and keep only 3 newlines max in a row and trim whitespace
      newtext = filter.cleanHacked(
        newtext
          ?.trim()
          .replace(/(\r?\n){4,}/g, "$1$1$1")
          .replace(/(\r?\n){3,}/g, "$1$1$1")
      );
      //send error if text contains only whitespace
      if (/^\s*$/.test(newtext)) {
        return res.status(400).send("Post cannot be empty");
      }

      //send error if text is longer than 500 characters
      if (newtext.length > 500) {
        return res
          .status(400)
          .send("Text cannot be longer than 500 characters");
      }
      // search for posts with same text and same user
      const existingPost = await posts.findOne({
        where: {
          text: newtext,
          postUser: req.user.id,
          communityid: community.id,
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
      gif: gif ? gif : null,
      communityid: community.id,
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
          // eslint-disable-next-line no-undef
          const findusersocketID = onlineusers
            .filter(
              (obj, index, self) =>
                self.findIndex((o) => o.socketid === obj.socketid) === index
            )
            .find((val) => val.userid === quoteExists.postUser);
          if (findusersocketID) {
            const quoteuser = await users.findOne({
              where: {
                id: req.user.id,
              },
            });
            // eslint-disable-next-line no-undef
            io.to(findusersocketID?.socketid).emit("newnotification", {
              type: newtext
                ? "quoted: " + newtext
                : "quoted: with a " + media?.mimetype.split("/")[0],
              postId: newPost.id,
              username: quoteuser?.username,
              avatar: quoteuser?.avatar,
            });
          }
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
                //check if target user is member  in community
                const member = await communitymembers.findOne({
                  where: {
                    communityId: community.id,
                    userId: user.id,
                  },
                });
                if (member) {
                  await notis.create({
                    type: "MENTION",
                    text: newtext ? newtext : null,
                    targetuserId: user?.id,
                    postId: newPost?.id,
                    userId: req.user.id,
                    communityid: community.id,
                  });
                }
              }
            });
          }
        }
      }
    }
    //check if text contains a link and add preview link to database if it does
    if (!newPost?.image) {
      await addpreviewlink(newPost);
    }

    //like own post

    await likes.create({
      postId: newPost?.id,
      userId: req.user.id,
    });
    deleteallcache();

    // send success response
    res.status(201).send({
      message: "Post created successfully",
      newpostid: newPost.id,
    });

    //do background tasks after sending response

    if (quoteExists) {
      //add quote to quote table
      await postquotes.create({
        postId: newPost.id,
        quotedPostId: quoteExists.id,
      });
    }

    //find user who posted the post

    const postuser = await users.findOne({
      where: {
        id: req.user.id,
      },
    });
    // eslint-disable-next-line no-undef
    if (process.env.NODE_ENV === "production") {
      //send discord channel message

      await sendchannelmessage(
        `📮 New post by ${postuser?.username}${
          newPost?.text ? "\n" + "**" + newPost?.text + "**" : ""
        }
      
      ${newPost?.image ? "\n**media added**" : ""}\nhttps://momosz.com/post/${
          newPost?.id
        }
        `
      );

      //send discord message

      await sendmessage(
        req,
        `${newPost?.text}${
          newPost?.image ? "\nmedia added" : ""
        }\nhttps://momosz.com/post/${newPost?.id}`,
        "post"
      );
    }

    return;
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

// upload media to cloudinary and return url and key
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
          // eslint-disable-next-line no-undef
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

// add preview link to database
const addpreviewlink = async (newPost) => {
  const findurlregex = /(https?:\/\/)(?!localhost|127\.0\.0\.1)[^\s]+\.[a-z]+/;
  const link = findurlregex.exec(newPost?.text);

  if (link) {
    await getLinkPreview(link[0], {
      followRedirects: `manual`,
      handleRedirects: (baseURL, forwardedURL) => {
        const urlObj = new URL(baseURL);
        const forwardedURLObj = new URL(forwardedURL);
        if (
          forwardedURLObj.hostname === urlObj.hostname ||
          forwardedURLObj.hostname === "www." + urlObj.hostname ||
          "www." + forwardedURLObj.hostname === urlObj.hostname
        ) {
          return true;
        } else {
          return false;
        }
      },
    })
      .then(async (data) => {
        await previewlinks.create({
          url: data?.url,
          title: data?.title,
          description: data?.description,
          image: data?.images[0] ? data?.images[0] : null,
          postId: newPost?.id,
        });
        return;
      })
      .catch((err) => {
        console.log("error getting link preview :", err);

        return;
      });
  } else {
    console.log("no link found");
    return;
  }
};

router.post("/addpoll", async (req, res) => {
  try {
    const {
      choice1,
      choice2,
      choice3,
      choice4,
      question,
      durationday,
      durationhour,
      durationminute,
      communityName,
    } = req.body;
    if (!communityName) {
      return res.status(400).send("Community name cannot be empty");
    }
    const community = await communities.findOne({
      where: {
        name: communityName,
      },
    });
    if (!community) {
      return res.status(400).send("Community does not exist");
    }
    //check if user is a member of the community
    const isMember = await communitymembers.findOne({
      where: {
        communityId: community.id,
        userId: req.user.id,
      },
    });
    if (!isMember) {
      return res.status(400).send("You are not a member of this community");
    }
    if (question.length > 255) {
      return res.status(400).send("Question cannot exceed 255 characters");
    }
    if (
      choice1.length > 25 ||
      choice2.length > 25 ||
      choice3.length > 25 ||
      choice4.length > 25
    ) {
      return res.status(400).send("Choices cannot exceed 25 characters");
    }

    //convert string duration values to number

    const days = parseInt(durationday);
    const hours = parseInt(durationhour);
    const minutes = parseInt(durationminute);

    //check if duration values are numbers
    if (isNaN(days) || isNaN(hours) || isNaN(minutes)) {
      return res.status(400).send("Duration must be numbers");
    }

    //check if duration values are integers (no decimals)
    if (
      !Number.isInteger(days) ||
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes)
    ) {
      return res.status(400).send("Duration values must be integers");
    }

    //check if duration values are within limits

    if (days < 0 || days > 7) {
      return res.status(400).send("Days must be between 0 and 7");
    }

    if (hours < 0 || hours > 23) {
      return res.status(400).send("Hours must be between 0 and 23");
    }

    if (minutes < 0 || minutes > 59) {
      return res.status(400).send("Minutes must be between 0 and 59");
    }

    if (!fiveMinutesCheck(days, hours, minutes)) {
      return res.status(400).send("Duration must be at least 5 minutes");
    }

    // Check if required fields are present and have non-zero length after removing whitespace
    if (!choice1.trim() || !choice2.trim() || !question.trim()) {
      return res
        .status(400)
        .send("choice1, choice2, and question are required.");
    }

    // Check if optional fields have zero or non-zero length after removing whitespace
    if (choice3 && !choice3.trim()) {
      return res
        .status(400)
        .send("choice3 must have non-zero length if provided.");
    }
    if (choice4 && !choice4.trim()) {
      return res
        .status(400)
        .send("choice4 must have non-zero length if provided.");
    }

    //The code below removes all whitespace and newline characters and then applies additional filtering or cleaning to the resulting string using a custom filter.cleanHacked() function.
    const cleanQuestion = filter.cleanHacked(
      question?.replace(/^\s+|\s+$/g, "").replace(/\n/g, "")
    );
    const cleanChoice1 = filter.cleanHacked(
      choice1?.replace(/^\s+|\s+$/g, "").replace(/\n/g, "")
    );
    const cleanChoice2 = filter.cleanHacked(
      choice2?.replace(/^\s+|\s+$/g, "").replace(/\n/g, "")
    );
    const cleanChoice3 = filter.cleanHacked(
      choice3?.replace(/^\s+|\s+$/g, "").replace(/\n/g, "")
    );
    const cleanChoice4 = filter.cleanHacked(
      choice4?.replace(/^\s+|\s+$/g, "").replace(/\n/g, "")
    );

    // If all validations pass, continue with other logic
    const existingPost = await posts.findOne({
      where: {
        text: cleanQuestion,
        postUser: req.user.id,
        communityid: community.id,
      },
    });
    if (existingPost) {
      return res.status(400).send("You already asked this question");
    }
    const createPost = await posts.create({
      postUser: req.user.id,
      text: cleanQuestion,
      communityid: community.id,
    });
    if (createPost) {
      const createPoll = await polls.create({
        duration: convertToMysqlDate(days, hours, minutes),
        postId: createPost?.id,
      });

      if (createPoll) {
        if (cleanChoice1) {
          await pollchoices.create({
            choice: cleanChoice1,
            pollId: createPoll?.id,
          });
        }
        if (cleanChoice2) {
          await pollchoices.create({
            choice: cleanChoice2,
            pollId: createPoll?.id,
          });
        }
        if (cleanChoice3) {
          await pollchoices.create({
            choice: cleanChoice3,
            pollId: createPoll?.id,
          });
        }
        if (cleanChoice4) {
          await pollchoices.create({
            choice: cleanChoice4,
            pollId: createPoll?.id,
          });
        }
        console.log("Pollchoices created successfully");
      } else {
        return res.status(400).send("Error creating poll");
      }

      if (cleanQuestion) {
        // extract mentioned users from question

        const mentionedUsers = cleanQuestion
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
              const member = await communitymembers.findOne({
                where: {
                  communityId: community.id,
                  userId: user.id,
                },
              });
              if (member) {
                if (user.id !== req.user.id) {
                  await notis.create({
                    type: "MENTION",
                    text: cleanQuestion ? cleanQuestion : null,
                    targetuserId: user?.id,
                    postId: createPost?.id,
                    userId: req.user.id,
                    communityid: community.id,
                  });
                }
              }
            });
          }
        }
      }

      //like own post

      await likes.create({
        postId: createPost?.id,
        userId: req.user.id,
      });
      deleteallcache();
      // send success response
      res.status(201).send({
        message: "Post created successfully",
        newpostid: createPost?.id,
      });

      //do background tasks after sending response

      //find user who posted the post

      // const postuser = await users.findOne({
      //   where: {
      //     id: req.user.id,
      //   },
      // });
      // eslint-disable-next-line no-undef
      if (process.env.NODE_ENV === "production") {
        //send discord channel message

        // await sendchannelmessage(
        //   `📮 New post by ${postuser?.username}${
        //     createPost?.text ? "\n" + "**" + createPost?.text + "**" : ""
        //   }

        // ${
        //   createPost?.image ? "\n**media added**" : ""
        // }\nhttps://momosz.com/post/${createPost?.id}
        //   `
        // );

        //send discord message

        await sendmessage(
          req,
          `${createPost?.text}\nhttps://momosz.com/post/${createPost?.id}`,
          "poll"
        );
      }

      return;
    } else {
      return res.status(500).send("Something went wrong");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});
function convertToMysqlDate(days, hours, minutes) {
  const now = new Date();
  const daysToAdd = days;
  const hoursToAdd = hours;
  const minutesToAdd = minutes;
  const dateWithAddedTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysToAdd,
    now.getHours() + hoursToAdd,
    now.getMinutes() + minutesToAdd,
    now.getSeconds()
  );
  const year = dateWithAddedTime.getFullYear();
  const month = (dateWithAddedTime.getMonth() + 1).toString().padStart(2, "0");
  const day = dateWithAddedTime.getDate().toString().padStart(2, "0");
  const hour = dateWithAddedTime.getHours().toString().padStart(2, "0");
  const minute = dateWithAddedTime.getMinutes().toString().padStart(2, "0");
  const second = dateWithAddedTime.getSeconds().toString().padStart(2, "0");
  const mysqlDate = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  return mysqlDate;
}

function fiveMinutesCheck(days, hours, minutes) {
  const now = new Date();
  const dateWithAddedTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + days,
    now.getHours() + hours,
    now.getMinutes() + minutes,
    now.getSeconds()
  );
  const fiveMinutesFromNow = new Date(now.getTime() + 4 * 60 * 1000); // 5 minutes from now

  if (dateWithAddedTime.getTime() < fiveMinutesFromNow.getTime()) {
    return false;
  } else {
    return true;
  }
}

module.exports = router;
