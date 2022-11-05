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

module.exports = router;
