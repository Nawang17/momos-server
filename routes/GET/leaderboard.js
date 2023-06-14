"use strict";
const router = require("express").Router();
const { users } = require("../../models");
const sequelize = require("sequelize");
const cache = require("../../utils/cache");

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page ? req.query.page : 0);
    const leaderboardCache = cache.get(`leaderboard:${page}`);
    const usersCountCache = cache.get(`usersCount:${page}`);
    if (leaderboardCache && usersCountCache) {
      return res.status(200).send({
        cache: true,
        usersCount: usersCountCache,
        leaderboard: leaderboardCache,
      });
    }

    let usersCount;
    await users.count().then((c) => {
      usersCount = c;
    });
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Adding 1 since months are zero-based
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
                AND YEAR(notis.createdAt) = ${currentYear}
                AND MONTH(notis.createdAt) = ${currentMonth}
              
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
        [sequelize.literal("totalpoints"), "DESC"],
        [sequelize.col("users.id"), "ASC"],
      ],
    });
    // cache leaderboard and usersCount
    cache.set(`leaderboard:${page}`, totalpoints);
    cache.set(`usersCount:${page}`, usersCount);

    return res.status(200).send({
      cache: false,
      usersCount,
      leaderboard: totalpoints,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
