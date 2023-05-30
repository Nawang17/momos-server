"use strict";
const router = require("express").Router();
const { users, follows } = require("../../models");
const Sequelize = require("sequelize");
const { Op } = require("sequelize");

router.get("/suggest/:name", async (req, res) => {
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
    limit: 30,
  });
  res.status(200).send({
    message: "user retrieved successfully",
    suggestedusers,
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
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Adding 1 since months are zero-based
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
                AND YEAR(notis.createdAt) = ${currentYear}
                AND MONTH(notis.createdAt) = ${currentMonth}
              )`),
            "totalpoints",
          ],
        ],
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
