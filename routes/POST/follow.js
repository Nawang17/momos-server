"use strict";
const router = require("express").Router();
const { follows, notis, users } = require("../../models");

router.post("/", async (req, res) => {
  const { followingid } = req.body;
  if (!followingid) {
    return res.status(400).send("followingid is required");
  } else if (followingid === req.user.id) {
    return res.status(400).send("You cannot follow yourself");
  } else {
    try {
      const findFollow = await follows.findOne({
        where: {
          followingid,
          userid: req.user.id,
        },
      });

      if (findFollow) {
        await follows.destroy({
          where: {
            followingid,
            userid: req.user.id,
          },
        });

        return res.status(200).send({ followed: false });
      } else {
        const newfollow = await follows.create({
          followingid,
          userid: req.user.id,
          followerid: req.user.id,
        });
        await notis.create({
          userId: req.user.id,
          type: "FOLLOW",
          text: "started following you.",
          targetuserId: followingid,

          followid: newfollow.id,
        });
        const newFollowing = await follows.findOne({
          where: {
            id: newfollow.id,
          },
          include: [
            {
              model: users,
              as: "follower",
              attributes: ["username", "avatar", "verified", "id"],
            },
            {
              model: users,
              as: "following",
              attributes: ["username", "avatar", "verified", "id"],
            },
          ],
        });
        return res.status(200).send({ followed: true, newFollowing });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send("Something went wrong");
    }
  }
});

module.exports = router;
