"use strict";
const router = require("express").Router();
const { users } = require("../../models");
const sequelize = require("sequelize");
router.get("/", async (req, res) => {
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
    res.status(200).send({
      message: "user retrieved successfully",
      userlevel,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Somwthing went wrong");
  }
});

module.exports = router;
