"use strict";
const router = require("express").Router();
const { posts, users, notis } = require("../../models");
// const cache = require("../../utils/cache");

router.get("/", async (req, res) => {
  // const noticache = cache.get(`notis:${req.user.id}`);
  // if (noticache) {
  //   return res.status(200).send({
  //     cache: true,
  //     notis: noticache,
  //   });
  // }

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
    // cache.set(`notis:${req.user.id}`, JSON.parse(JSON.stringify(findNotis)));
    return res.status(200).send({ cache: false, notis: findNotis });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
