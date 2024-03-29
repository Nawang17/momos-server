"use strict";
require("dotenv").config();
const router = require("express").Router();
const { communities, communitymembers, notis } = require("../../models");
const fs = require("fs");
const { cloudinary } = require("../../utils/cloudinary");
var filter = require("../../utils/bad-words-hacked");
filter = new filter();
const upload = require("../../utils/multermediaupload");
const { sendmessage, sendchannelmessage } = require("../../utils/discordbot");
const { newcommunitylimit } = require("../../middleware/rateLimit");
const { avatarColor } = require("../../utils/randomColor");
router.post(
  "/",
  newcommunitylimit,
  upload.single("media"),
  async (req, res) => {
    try {
      const media = req.file ? req.file : null;

      let communityname = req.body.communityname
        ? req.body.communityname.trim()
        : null;
      let description = req.body.description ? req.body.description : null;
      let privacy = req.body.privacy ? req.body.privacy : "Public";

      let mediaurl;
      let mediakey;

      if (privacy !== "Public" && privacy !== "Private") {
        return res.status(400).send("Invalid privacy setting");
      }

      if (!communityname || !description) {
        return res
          .status(400)
          .send("Community name and description cannot be empty");
      }
      if (description) {
        description = filter.cleanHacked(description?.trim());

        if (/^\s*$/.test(description)) {
          return res.status(400).send("Community description cannot be empty");
        }
        if (description.length > 160) {
          return res
            .status(400)
            .send("Community description cannot be longer than 160 characters");
        }
      }

      if (communityname) {
        if (filter.isProfane(communityname)) {
          return res.status(400).send("Community name is not available");
        }
        //send error if text contains only whitespace
        if (/^\s*$/.test(communityname)) {
          return res.status(400).send("Community name cannot be empty");
        }
        if (communityname.length > 20 || communityname.length < 4) {
          return res
            .status(400)
            .send("Community name must be between 4 and 20 characters");
        }
        const findcommunityname = await communities.findOne({
          where: { name: communityname },
        });
        if (findcommunityname) {
          return res.status(400).send("Community name already exists");
        }
      }

      // check if image is provided
      if (media) {
        const mediauploadresults = await uploadmedia(media);

        if (mediauploadresults[2]) {
          return res.status(400).send(mediauploadresults[2]);
        }
        mediaurl = mediauploadresults[0];
        mediakey = mediauploadresults[1];
      }
      let avatar;
      if (!media) {
        const randomAvatarColor =
          avatarColor[Math.floor(avatarColor.length * Math.random())];
        avatar = `https://ui-avatars.com/api/?background=${randomAvatarColor}&color=fff&name=${communityname.substring(
          0,
          1
        )}&size=128`;
      }
      //create new community

      const newCommunity = await communities.create({
        name: communityname,
        description: description,
        private: privacy === "Private" ? true : false,
        banner: mediaurl ? mediaurl : avatar,
        bannerkey: mediakey ? mediakey : null,
      });
      if (!newCommunity) {
        return res.status(500).send("Something went wrong");
      }
      const addcommunityowner = await communitymembers.create({
        communityId: newCommunity.id,
        userId: req.user.id,
        isadmin: true,
        isOwner: true,
      });
      if (!addcommunityowner) {
        return res.status(500).send("Something went wrong");
      }

      // send success response
      res.status(201).send({
        message: "Community created successfully",
        newcommunity: newCommunity.name,
      });

      //do background tasks after sending response

      // eslint-disable-next-line no-undef
      if (process.env.NODE_ENV === "production") {
        //send discord channel message

        await sendchannelmessage(
          `👨‍👩‍👦‍👦 New community created: ${newCommunity?.name}
      
     \nhttps://momosz.com/communities
        `
        );

        //send discord message

        await sendmessage(
          req,
          `${newCommunity?.name}\nhttps://momosz.com/communities`,
          "community"
        );
      }

      return;
    } catch (error) {
      console.log(error);
      return res.status(500).send("Something went wrong");
    }
  }
);

// upload media to cloudinary and return url and key
const uploadmedia = async (media) => {
  try {
    const imgsizelimit = 9437184; //9mb
    const videosizelimit = 52428800; //50 mb

    let mediaurl;
    let mediakey;
    let error;

    //if media is not an image or video, send error

    if (!media?.mimetype.startsWith("image")) {
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

router.post("/joincommunity", async (req, res) => {
  try {
    const { communityName } = req.body;
    const community = await communities.findOne({
      where: { name: communityName },
    });
    if (!community) {
      return res.status(404).send("Community not found");
    }
    const communitymember = await communitymembers.findOne({
      where: { communityId: community.id, userId: req.user.id },
    });
    if (communitymember) {
      return res.status(400).send("You are already a member of this community");
    }
    if (!community.private) {
      const newcommunitymember = await communitymembers.create({
        communityId: community.id,
        userId: req.user.id,
      });
      if (!newcommunitymember) {
        return res.status(500).send("Something went wrong");
      }
      res
        .status(201)
        .send({ message: `Welcome to ${community.name}`, request: false });
    } else {
      //find owner of community
      const communityowner = await communitymembers.findOne({
        where: { communityId: community.id, isOwner: true },
      });
      if (!communityowner) {
        return res.status(500).send("Something went wrong");
      }

      //check if notification already exists
      const notification = await notis.findOne({
        where: {
          type: "COMMUNITY_JOIN_REQUEST",
          text: `wants to join your community: ${community.name}`,
          targetuserId: communityowner.userId,
          userId: req.user.id,
        },
      });
      if (notification) {
        return res.status(201).send({
          message: `Request to join ${community.name} already sent`,
          request: true,
        });
      }
      //send notification to owner

      await notis.create({
        type: "COMMUNITY_JOIN_REQUEST",
        text: `wants to join your community: ${community.name}`,
        targetuserId: communityowner.userId,
        userId: req.user.id,
        communityid: community.id,
      });

      res.status(201).send({
        message: `Request to join ${community.name} sent to owner`,
        request: true,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

router.post("/acceptcommunityrequest", async (req, res) => {
  try {
    const { requestid, accept } = req.body;
    const requestAccepted = accept === true ? true : false;

    if (!requestid) {
      return res.status(400).send("Request id required");
    }
    const request = await notis.findOne({
      where: { id: requestid, type: "COMMUNITY_JOIN_REQUEST" },
    });
    if (!request) {
      return res.status(404).send("Request not found");
    }

    if (!requestAccepted) {
      await request.destroy();
      return res.status(400).send("Request rejected");
    }
    const community = await communities.findOne({
      where: { id: request.communityid },
    });
    if (!community) {
      return res.status(404).send("Community not found");
    }
    const communitymember = await communitymembers.findOne({
      where: { communityId: community.id, userId: request.userId },
    });
    if (communitymember) {
      await request.destroy();
      return res.status(400).send("You are already a member of this community");
    }
    const newcommunitymember = await communitymembers.create({
      communityId: community.id,
      userId: request.userId,
    });
    if (!newcommunitymember) {
      return res.status(500).send("Something went wrong");
    }
    await request.destroy();
    return res.status(201).send("Request accepted");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});
module.exports = router;
