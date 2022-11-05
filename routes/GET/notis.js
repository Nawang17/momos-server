"use strict";
const router = require("express").Router();
const { posts, users, nestedcomments, notis } = require("../../models");

router.get("/", async (req, res) => {
  try {
    const findNotis = await notis.findAll({
      where: {
        targetuserId: req.user.id,
      },
      order: [["id", "DESC"]],
      include: [
        {
          model: users,
          as: "user",
          attributes: ["username", "avatar", "verified", "id"],
        },
        {
          model: posts,
          attributes: { exclude: ["updatedAt", "postUser"] },
        },

        {
          model: users,
          as: "targetuser",

          attributes: ["username", "avatar", "verified", "id"],
        },
      ],
    });
    return res.status(200).send({ notis: findNotis });
  } catch (error) {
    return res.status(500).send(error);
  }
});

module.exports = router;
