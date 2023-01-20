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
