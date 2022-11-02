"use strict";
const router = require("express").Router();
const {
  posts,
  users,
  likes,
  comments,
  nestedcomments,
} = require("../../models");

router.get("/:postid", async (req, res) => {
  const { postid } = req.params;
  try {
    if (!postid) {
      res.status(400).send("postid is required");
    }
    const singlepost = await posts.findAll({
      where: {
        id: postid,
      },
      attributes: { exclude: ["updatedAt", "postUser"] },
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
          include: [
            {
              model: users,
              attributes: ["username", "avatar", "verified", "id"],
            },
            {
              model: nestedcomments,

              include: [
                {
                  model: users,
                  as: "user",

                  attributes: ["username", "avatar", "verified", "id"],
                },
                {
                  model: users,
                  as: "repliedtouser",

                  attributes: ["username", "avatar", "verified", "id"],
                },
              ],
            },
          ],
        },
      ],
    });
    if (singlepost.length === 0) {
      res.status(400).send("Post not found");
    } else {
      res.status(200).send({
        message: "post retrieved successfully",
        singlepost,
      });
    }
  } catch (error) {
    res.status(400).send(error);
    console.log(error);
  }
});
module.exports = router;
