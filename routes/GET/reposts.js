"use strict";
const router = require("express").Router();
const {
  posts,
  users,
  likes,
  comments,
  nestedcomments,

  previewlinks,
  postquotes,
  polls,
  pollchoices,
  pollvotes,
} = require("../../models");

//get reposts

router.get("/:postid", async (req, res) => {
  try {
    const { postid } = req.params;
    if (!postid) {
      res.status(400).send("postid is required");
    }
    if (isNaN(postid)) {
      res.status(400).send("postid must be a number");
    }
    const reposts = await posts.findAll({
      where: {
        quoteId: postid,
      },
      attributes: {
        exclude: ["updatedAt", "postUser"],
      },
      order: [["id", "DESC"]],
      include: [
        {
          model: polls,
          include: [
            {
              model: pollchoices,
              include: [
                {
                  model: pollvotes,
                  include: [
                    {
                      model: users,
                      attributes: ["username", "avatar", "verified", "id"],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: postquotes,
        },
        {
          model: previewlinks,
        },
        {
          model: users,

          attributes: ["username", "avatar", "verified", "id"],
        },
        {
          model: likes,
          seperate: true,
          include: [
            {
              model: users,
              attributes: ["username", "avatar", "verified", "id"],
            },
          ],
        },
        {
          model: comments,
          seperate: true,
          include: [
            {
              model: nestedcomments,
              seperate: true,
            },
          ],
        },
        {
          model: posts,
          include: [
            {
              model: users,
              attributes: ["username", "avatar", "verified", "id"],
            },
          ],
        },
      ],
    });
    res.status(200).send(reposts);
  } catch (err) {
    console.log(err);
    res.status(500).send("Something went wrong");
  }
});
module.exports = router;
