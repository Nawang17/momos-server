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
const { Op } = require("sequelize");
const sequelize = require("sequelize");

router.get("/trending", async (req, res) => {
  try {
    const allPosts = await posts.findAll();
    const hashtagCounts = {};

    allPosts?.forEach((post) => {
      const hashtags = post?.text?.match(/#\w+/g) || []; // extract hashtags from post text using a regular expression
      hashtags?.forEach((hashtag) => {
        const lowercaseHashtag = hashtag?.toLowerCase(); // convert hashtag to lowercase
        hashtagCounts[lowercaseHashtag] =
          (hashtagCounts[lowercaseHashtag] || 0) + 1; // count the frequency of each hashtag (case-insensitive)
      });
    });

    const topHashtags = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1]) // sort the hashtag counts in descending order
      .slice(0, 10) // take the top 5 hashtags
      .map((entry) => ({ hashtag: entry[0], count: entry[1] }));
    res.status(200).send(topHashtags);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});
router.get("/getposts/:value", async (req, res) => {
  const { value } = req.params;
  if (!value) {
    return res.status(400).send("value is required");
  }
  try {
    const latestposts = await posts.findAll({
      order: [["id", "DESC"]],
      where: {
        text: {
          [Op.like]: "%" + value + "%",
        },
      },
      attributes: {
        include: [
          [
            sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM likes AS likes
                    WHERE
                        likes.postId = posts.id
                        
                )`),
            "likescount",
          ],
        ],
      },

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
    const popularposts = await posts.findAll({
      where: {
        text: {
          [Op.like]: "%" + value + "%",
        },
      },
      attributes: {
        include: [
          [
            sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM likes AS likes
                    WHERE
                        likes.postId = posts.id
                        
                )`),
            "likescount",
          ],
        ],
      },
      order: [[sequelize.literal("likescount"), "DESC"]],

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
    res.status(200).send({
      latestposts,

      popularposts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});
router.get("/getusers/:value", async (req, res) => {
  const { value } = req.params;
  if (!value) {
    return res.status(400).send("value is required");
  }
  try {
    const searcheduser = await users.findAll({
      where: {
        username: {
          [Op.like]: "%" + value + "%",
        },
      },

      attributes: ["username", "avatar", "verified", "description", "id"],
    });
    res.status(200).send(searcheduser);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
