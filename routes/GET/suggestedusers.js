"use strict";
const router = require("express").Router();
const { users, follows } = require("../../models");
const Sequelize = require("sequelize");
const { Op } = require("sequelize");
const sequelize = require("sequelize");
const cache = require("../../utils/cache");

router.get("/suggest/:name", async (req, res) => {
  const { name } = req.params;
  const cachedsuggestedusers = cache.get(`suggestedusers:${name}`);

  if (name && cachedsuggestedusers) {
    return res.status(200).send({
      message: "user retrieved successfully",
      suggestedusers: cachedsuggestedusers,
      cached: true,
    });
  }
  const finduser = await users.findOne({
    where: {
      username: name ? name : "no",
    },
  });
  const followingarray = await follows.findAll({
    where: {
      followerid: finduser?.id ? finduser.id : "0",
    },
    include: [
      {
        model: users,
        as: "following",
        attributes: ["username"],
      },
    ],
  });
  const followingarr = followingarray.map((z) => z.following.username);
  const suggestedusers = await users.findAll({
    order: Sequelize.fn("RAND"),
    where: {
      username: {
        [Op.notIn]: followingarr,
      },
    },
    attributes: ["username", "avatar", "verified", "id", "description"],
    limit: 30,
  });
  if (name) {
    cache.set(
      `suggestedusers:${name}`,
      JSON.parse(JSON.stringify(suggestedusers))
    );
  }
  res.status(200).send({
    message: "user retrieved successfully",
    suggestedusers,
    cached: false,
  });
});
router.get("/allsuggested/:name", async (req, res) => {
  const { name } = req.params;
  const finduser = await users.findOne({
    where: {
      username: name ? name : "no",
    },
  });
  const followingarray = await follows.findAll({
    where: {
      followerid: finduser?.id ? finduser.id : "0",
    },
    include: [
      {
        model: users,
        as: "following",
        attributes: ["username"],
      },
    ],
  });
  const followingarr = followingarray.map((z) => z.following.username);
  const suggestedusers = await users.findAll({
    order: Sequelize.fn("RAND"),
    where: {
      username: {
        [Op.notIn]: followingarr,
      },
    },
    attributes: ["username", "avatar", "verified", "id", "description"],
  });
  res.status(200).send({
    message: "user retrieved successfully",
    suggestedusers,
  });
});
router.get("/topuser", async (req, res) => {
  try {
    //top user of all time

    const gettopuser = await users.findAll({
      limit: 1,
      attributes: {
        exclude: [
          "password",
          "email",
          "createdAt",
          "updatedAt",
          "imagekey",
          "status",
          "userid",
        ],
        include: [
          [
            Sequelize.literal(`(
                SELECT COUNT(*)
                FROM notis
                WHERE
                notis.targetuserId = users.id
                AND notis.type = 'LIKE'
             
              )`),
            "totalpoints",
          ],
        ],
      },
      where: {
        id: {
          [sequelize.Op.ne]: 6, // Exclude demo account from leaderboard
        },
      },
      order: [
        [Sequelize.literal("totalpoints"), "DESC"],
        [Sequelize.col("users.id"), "ASC"],
      ],
    });

    res.status(200).send({
      message: "top user retrieved successfully",
      topuser: gettopuser[0]?.username,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
