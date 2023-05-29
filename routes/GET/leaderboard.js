"use strict";
const router = require("express").Router();
const { users } = require("../../models");
const sequelize = require("sequelize");

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page ? req.query.page : 0);
    let usersCount;
    await users.count().then((c) => {
      usersCount = c;
    });

    const totalpoints = await users.findAll({
      limit: 20,
      offset: page * 20,
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
          // get count of total likes

          [
            sequelize.literal(`(
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

      order: [
        [sequelize.literal("totalpoints"), "DESC"],
        [sequelize.col("users.id"), "ASC"],
      ],
    });

    return res.json({
      usersCount,
      leaderboard: totalpoints,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
