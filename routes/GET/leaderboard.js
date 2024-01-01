"use strict";
const router = require("express").Router();
const { users } = require("../../models");
const sequelize = require("sequelize");
const cache = require("../../utils/cache");

router.get("/", async (req, res) => {
  try {
    const type = req.query.type ? req.query.type : "allTime";
    const page = parseInt(req.query.page ? req.query.page : 0);
    const leaderboardCache = cache.get(`leaderboard-${type}:${page}`);
    const usersCountCache = cache.get(`usersCount-${type}:${page}`);
    if (leaderboardCache && usersCountCache) {
      return res.status(200).send({
        cache: true,
        usersCount: usersCountCache,
        leaderboard: leaderboardCache,
        type,
      });
    }

    let usersCount;
    await users.count().then((c) => {
      usersCount = c;
    });
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Adding 1 since months are zero-based

    const allTimeQuery = `(
      SELECT COUNT(*)
      FROM notis
      WHERE
      notis.targetuserId = users.id
      AND notis.type = 'LIKE'
      AND notis.likeId IS NOT NULL
    )`;
    const currentMonthQuery = `(
      SELECT COUNT(*)
      FROM notis
      WHERE
      notis.targetuserId = users.id
      AND notis.type = 'LIKE'
      AND notis.likeId IS NOT NULL
      AND YEAR(notis.createdAt) = ${currentYear}
      AND MONTH(notis.createdAt) = ${currentMonth}
    
    )`;
    const lastMonthQuery = `(
      SELECT COUNT(*)
      FROM notis
      WHERE
      notis.targetuserId = users.id
      AND notis.type = 'LIKE'
      AND notis.likeId IS NOT NULL
      AND YEAR(notis.createdAt) = ${currentYear}
      AND MONTH(notis.createdAt) = ${currentMonth - 1}
    
    )`;
    const currentYearQuery = `(
      SELECT COUNT(*)
      FROM notis
      WHERE
      notis.targetuserId = users.id
      AND notis.type = 'LIKE'
      AND notis.likeId IS NOT NULL
      AND YEAR(notis.createdAt) = ${currentYear}
    
    )`;
    const lastYearQuery = `(
      SELECT COUNT(*)
      FROM notis
      WHERE
      notis.targetuserId = users.id
      AND notis.type = 'LIKE'
      AND notis.likeId IS NOT NULL
      AND YEAR(notis.createdAt) = ${currentYear - 1}
    
    )`;
    const queries = {
      allTime: allTimeQuery,
      currentMonth: currentMonthQuery,
      lastMonth: lastMonthQuery,
      currentYear: currentYearQuery,
      lastYear: lastYearQuery,
    };
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
          // get different query based on type

          [sequelize.literal(queries[type] || allTimeQuery), "totalpoints"],
        ],
      },

      order: [
        [sequelize.literal("totalpoints"), "DESC"],
        [sequelize.col("users.id"), "ASC"],
      ],
    });
    // cache leaderboard and usersCount
    cache.set(`leaderboard-${type}:${page}`, totalpoints);
    cache.set(`usersCount-${type}:${page}`, usersCount);

    return res.status(200).send({
      cache: false,
      usersCount,
      leaderboard: totalpoints,
      type,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
