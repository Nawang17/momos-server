"use strict";
const router = require("express").Router();
const { posts, users, likes, comments, follows } = require("../../models");
const { tokenCheck } = require("../../middleware/tokenCheck");

router.get("/:username", async (req, res) => {
  const { username } = req.params;
  try {
    if (!username) {
      return res.status(400).send("username is required");
    }
    const userInfo = await users.findOne({
      where: {
        username: username,
      },
      attributes: { exclude: ["password", "updatedAt"] },
    });
    if (!userInfo) {
      return res.status(400).send("User not found");
    } else if (userInfo.status !== "active") {
      return res.status(400).send("User is inactive");
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

      return res.status(200).send({
        message: "profile retrieved successfully",
        userPosts,
        userInfo,
        likedposts,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
});
router.get("/followdata/:username", async (req, res) => {
  const { username } = req.params;
  try {
    if (!username) {
      return res.status(400).send("username is required");
    }
    const userInfo = await users.findOne({
      where: {
        username: username,
      },
      attributes: { exclude: ["password", "updatedAt"] },
    });
    if (!userInfo) {
      return res.status(400).send("User not found");
    } else if (userInfo.status !== "active") {
      return res.status(400).send("User is inactive");
    } else {
      const userFollowers = await follows.findAll({
        where: {
          followingid: userInfo.id,
        },
        include: [
          {
            model: users,
            as: "follower",
            attributes: ["username", "avatar", "verified", "id"],
          },
        ],
      });

      const userfollowerarr = userFollowers.map((p) => p.follower.username);
      const userFollowing = await follows.findAll({
        where: {
          userid: userInfo.id,
        },
        include: [
          {
            model: users,
            as: "following",
            attributes: ["username", "avatar", "verified", "id"],
          },
        ],
      });
      const userfollowingarr = userFollowing.map((z) => z.following.username);

      return res.status(200).send({
        message: "follow data retrieved successfully",

        userFollowing,

        userFollowers,
        userfollowingarr,
        userfollowerarr,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
