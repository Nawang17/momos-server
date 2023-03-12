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
                  INNER JOIN likes AS likes ON likes.postId = posts.id
                  WHERE 
                    posts.postUser = users.id
                    AND likes.userId != users.id
                )`),
            "totalLikes",
          ],
          // get count of total likes on users comments
          [
            sequelize.literal(`(
            SELECT COUNT(*)
            FROM comments AS comments
            INNER JOIN commentlikes AS commentlikes ON commentlikes.commentId = comments.id
            WHERE
              comments.userId = users.id
              AND commentlikes.userId != users.id
          )`),
            "totalCommentLikes",
          ],
          // get count of total likes on users nestedcomments

          [
            sequelize.literal(`(
            SELECT COUNT(*)
            FROM nestedcomments AS nestedcomments
            INNER JOIN nestedcommentlikes AS nestedcommentlikes ON nestedcommentlikes.nestedcommentId = nestedcomments.id
            WHERE
            nestedcomments.userId = users.id
              AND nestedcommentlikes.userId != users.id
          )`),
            "totalNestedCommentLikes",
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
