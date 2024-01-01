"use strict";
const router = require("express").Router();
const { users } = require("../../models");
const sequelize = require("sequelize");
const cache = require("../../utils/cache");

router.get("/", async (req, res) => {
  const userlevelcache = cache.get(`userlevel:${req.user.id}`);
  if (userlevelcache) {
    return res.status(200).send({
      cache: true,
      userlevel: userlevelcache,
    });
  }

  try {
    const userlevel = await users.findOne({
      where: {
        id: req.user.id,
      },
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
                AND notis.likeId IS NOT NULL 
              
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
    // cache user level
    cache.set(
      `userlevel:${req.user.id}`,
      JSON.parse(JSON.stringify(userlevel))
    );

    res.status(200).send({
      cache: false,
      message: "user retrieved successfully",
      userlevel,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Somwthing went wrong");
  }
});

module.exports = router;
