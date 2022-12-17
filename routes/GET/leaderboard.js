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

    const getUsers = await users.findAll({
      limit: 10,
      offset: page * 10,
      attributes: {
        exclude: [
          "password",
          "email",
          "createdAt",
          "updatedAt",
          "imagekey",
          "status",
          "userid",
          "",
        ],
        include: [
          [
            sequelize.literal(`(
              
                      SELECT COUNT(*)
                      FROM posts AS posts
                      WHERE
                          posts.postUser = users.id
                          AND users.id != 6
      
                  )`),
            "totalposts",
          ],

          [
            sequelize.literal(`(
                SELECT COUNT(*)
                FROM posts AS posts
                INNER JOIN likes AS likes ON likes.postId = posts.id
                WHERE 
                  posts.postUser = users.id
                  AND likes.userId != users.id
                  AND users.id != 6
              )`),
            "totalLikes",
          ],
          [
            sequelize.literal(`(
                SELECT COUNT(*)
                FROM follows AS follows
                WHERE
                    follows.followingid = users.id

            )`),
            "totalFollowers",
          ],
        ],
      },

      order: [
        [
          sequelize.literal("totalposts + totalLikes / 2 + totalFollowers"),
          "DESC",
        ],
      ],
    });
    return res.json({ leaderboard: getUsers, usersCount });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
