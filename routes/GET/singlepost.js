"use strict";
const router = require("express").Router();
const {
  posts,
  users,
  likes,
  comments,
  nestedcomments,
  commentlikes,
  nestedcommentlikes,
  previewlinks,
  polls,
  pollchoices,
  pollvotes,
  communities,
  communitymembers,
  translations,
} = require("../../models");
const cache = require("../../utils/cache");

const sequelize = require("sequelize");
router.get("/:postid", async (req, res) => {
  const { postid } = req.params;

  // check cache
  const singlepostcache = cache.get(`singlepost:${postid}`);
  if (singlepostcache) {
    return res.status(200).send({
      cache: true,
      message: "post retrieved successfully",

      singlepost: singlepostcache,
    });
  }

  try {
    if (!postid) {
      res.status(400).send("postid is required");
    }
    if (isNaN(postid)) {
      res.status(400).send("postid must be a number");
    }
    const singlepost = await posts.findAll({
      where: {
        id: postid,
        communityid: null,
      },
      attributes: {
        exclude: ["updatedAt", "postUser"],
        include: [
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM postquotes WHERE postquotes.quotedPostId = posts.id)"
            ),
            "postquotesCount",
          ],
        ],
      },

      include: [
        {
          model: translations,
          attributes: ["translatedText", "language"],
        },
        {
          model: communities,
          as: "comshare",
          include: [
            {
              model: communitymembers,
              attributes: ["communityId", "isadmin", "isOwner"],
            },
          ],
        },
        {
          model: polls,
          include: [
            {
              model: pollchoices,
              include: [
                {
                  model: pollvotes,
                  include: [
                    {
                      model: users,
                      attributes: ["username", "avatar", "verified", "id"],
                    },
                  ],
                },
              ],
            },
          ],
        },

        {
          model: previewlinks,
        },
        {
          model: users,
          attributes: ["username", "avatar", "verified", "id"],
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
        {
          model: likes,
          include: [
            {
              model: users,
              attributes: ["username", "avatar", "verified", "id"],
            },
          ],
          seperate: true,
        },
        {
          model: comments,
          seperate: true,

          include: [
            {
              model: commentlikes,
              seperate: true,
              include: [
                {
                  model: users,
                  attributes: ["username", "avatar", "verified", "id"],
                },
              ],
            },

            {
              model: users,
              attributes: ["username", "avatar", "verified", "id"],
            },
            {
              model: nestedcomments,
              seperate: true,
              include: [
                {
                  model: nestedcommentlikes,
                  seperate: true,

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
            },
          ],
        },
      ],
    });
    if (singlepost.length === 0) {
      return res.status(400).send("Post not found");
    } else {
      // set cache
      cache.set(`singlepost:${postid}`, JSON.parse(JSON.stringify(singlepost)));

      return res.status(200).send({
        cache: false,
        message: "post retrieved successfully",
        singlepost,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
});
module.exports = router;
