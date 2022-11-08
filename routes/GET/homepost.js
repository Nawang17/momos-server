"use strict";
const router = require("express").Router();
const { posts, users, likes, comments } = require("../../models");

router.get("/", async (req, res) => {
  try {
    const homeposts = await posts.findAll({
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
    if (homeposts) {
      res.status(200).send({
        message: "posts retrieved successfully",
        homeposts,
      });
    } else {
      res.status(400).send("something went wrong");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
