"use strict";
const router = require("express").Router();
const { posts, users, likes, comments } = require("../../models");
const { Op } = require("sequelize");
const sequelize = require("sequelize");
router.get("/getposts/:value", async (req, res) => {
  const { value } = req.params;
  if (!value) {
    return res.status(400).send("value is required");
  }
  try {
    const latestposts = await posts.findAll({
      order: [["id", "DESC"]],
      where: {
        text: {
          [Op.like]: "%" + value + "%",
        },
      },
      attributes: {
        include: [
          [
            sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM likes AS likes
                    WHERE
                        likes.postId = posts.id
                        
                )`),
            "likescount",
          ],
        ],
      },

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
    const popularposts = await posts.findAll({
      where: {
        text: {
          [Op.like]: "%" + value + "%",
        },
      },
      attributes: {
        include: [
          [
            sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM likes AS likes
                    WHERE
                        likes.postId = posts.id
                        
                )`),
            "likescount",
          ],
        ],
      },
      order: [[sequelize.literal("likescount"), "DESC"]],

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
    res.status(200).send({
      latestposts,

      popularposts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});
router.get("/getusers/:value", async (req, res) => {
  const { value } = req.params;
  if (!value) {
    return res.status(400).send("value is required");
  }
  try {
    const searcheduser = await users.findAll({
      where: {
        username: {
          [Op.like]: "%" + value + "%",
        },
      },

      attributes: ["username", "avatar", "verified", "description", "id"],
    });
    res.status(200).send(searcheduser);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
