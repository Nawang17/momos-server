"use strict";
const router = require("express").Router();
const { posts, users, likes, comments } = require("../../models");

router.get("/:username", async (req, res) => {
  const { username } = req.params;
  try {
    if (!username) {
      res.status(400).send("username is required");
    }
    const userInfo = await users.findOne({
      where: {
        username: username,
      },
      attributes: { exclude: ["password", "updatedAt"] },
    });
    if (!userInfo) {
      res.status(400).send("User not found");
    } else if (userInfo.status !== "active") {
      res.status(400).send("User is inactive");
    } else {
      const userPosts = await posts.findAll({
        where: {
          postUser: userInfo.id,
        },
        attributes: { exclude: ["updatedAt", "postUser"] },
        order: [["id", "DESC"]],
        include: [
          {
            model: users,
            attributes: ["username", "avatar", "verified", "id"],
          },
          {
            model: likes,
          },
          {
            model: comments,
          },
        ],
      });
      const findlikedPosts = await likes.findAll({
        where: {
          userId: userInfo.id,
        },
      });
      const likedpostsarr = findlikedPosts.map((post) => post.postId);
      const getallposts = await posts.findAll({
        attributes: { exclude: ["updatedAt", "postUser"] },
        order: [["id", "DESC"]],
        include: [
          {
            model: users,
            attributes: ["username", "avatar", "verified", "id"],
          },
          {
            model: likes,
          },
          {
            model: comments,
          },
        ],
      });
      const likedposts = getallposts.filter((post) =>
        likedpostsarr.includes(post.id)
      );

      res.status(200).send({
        message: "profile retrieved successfully",
        userPosts,
        userInfo,
        likedposts,
      });
    }
  } catch (error) {
    res.status(400).send(error);
    console.log(error);
  }
});

module.exports = router;
