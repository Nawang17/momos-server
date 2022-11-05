"use strict";
const router = require("express").Router();
const { users, follows } = require("../../models");
router.get("/", async (req, res) => {
  const userFollowing = await follows.findAll({
    where: {
      userid: req.user.id,
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
  res.status(200).send({
    message: "user retrieved successfully",
    user: {
      username: req.user.username,
      avatar: req.user.avatar,
    },
    userfollowingarr,
  });
});

router.get("/suggestedusers/:name", async (req, res) => {
  const { name } = req.params;
  const followingarray = await follows.findAll({
    where: {
      followerid: name ? name : "0",
    },
    include: [
      {
        model: users,
        as: "following",
        attributes: ["username", "avatar", "verified", "id"],
      },
    ],
  });
  const followingarr = followingarray.map((z) => z.following.username);
  const suggestedusers = await users.findAll({
    where: {
      username: {
        [Op.notIn]: followingarr,
      },
    },
    attributes: ["username", "avatar", "verified", "id"],
    limit: 5,
  });
  res.status(200).send({
    message: "user retrieved successfully",
    suggestedusers,
  });
});

module.exports = router;
