"use strict";
const router = require("express").Router();
const { users, likes, posts } = require("../../models");
const sequelize = require("sequelize");
router.get("/", async (req, res) => {
  try {
    const getUsers = await users.findAll({
      limit: 10,
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
            )`),
            "totalLikes",
          ],
        ],
      },

      order: [[sequelize.literal("totalposts + totalLikes"), "DESC"]],
    });
    return res.json({ leaderboard: getUsers });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});
router.get("/getall", async (req, res) => {
  try {
    const getUsers = await users.findAll({
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
              )`),
            "totalLikes",
          ],
        ],
      },

      order: [[sequelize.literal("totalposts + totalLikes"), "DESC"]],
    });
    return res.json({ leaderboard: getUsers });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
