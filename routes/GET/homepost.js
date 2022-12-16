"use strict";
const router = require("express").Router();
const { posts, users, likes, comments } = require("../../models");
const sequelize = require("sequelize");
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page ? req.query.page : 0);
    let postCount;
    await posts.count().then((c) => {
      postCount = c;
    });
    const homeposts = await posts.findAll({
      limit: 10,
      offset: page * 10,
      attributes: {
        exclude: ["updatedAt", "postUser"],

        // include: [
        //   [
        //     sequelize.literal(`(
        //             SELECT COUNT(*)
        //             FROM likes AS likes
        //             WHERE
        //                 likes.postId = posts.id

        //         )`),
        //     "likescount",
        //   ],
        // ],
      },
      // order: [[sequelize.literal("likescount"), "DESC"]],
      order: [["id", "DESC"]],
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
    if (homeposts) {
      res.status(200).send({
        message: "posts retrieved successfully",
        homeposts,
        postCount,
      });
    } else {
      res.status(400).send("something went wrong");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
