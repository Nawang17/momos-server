"use strict";
const router = require("express").Router();

const {
  users,
  follows,
  bookmarks,
  posts,
  likes,
  comments,
  nestedcomments,
  previewlinks,
  polls,
  pollchoices,
  pollvotes,
  commentlikes,
  communities,
  communitymembers,
  notis
} = require("../../models");
const sequelize = require("sequelize");
// const cache = require("../../utils/cache");

router.get("/", async (req, res) => {
  // const noticache = cache.get(`notis:${req.user.id}`);
  // if (noticache) {
  //   return res.status(200).send({
  //     cache: true,
  //     notis: noticache,
  //   });
  // }

  try {
    const findNotis = await notis.findAll({
      where: {
        targetuserId: req.user.id,
      },
      order: [["id", "DESC"]],
      include: [
        {
          model: users,
          as: "user",
          attributes: ["username", "avatar", "verified", "id"],
        },
        {
          model: posts,
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
                },
              ],
              seperate: true,
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
        },

        {
          model: users,
          as: "targetuser",

          attributes: ["username", "avatar", "verified", "id"],
        },
      ],
    });
    // cache.set(`notis:${req.user.id}`, JSON.parse(JSON.stringify(findNotis)));
    return res.status(200).send({ cache: false, notis: findNotis });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
