"use strict";
require("dotenv").config();
const router = require("express").Router();
const { posts, users } = require("../../models");

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
    res.status(400).send(error);
  }
});

module.exports = router;
