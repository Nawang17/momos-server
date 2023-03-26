"use strict";
const router = require("express").Router();
const {
  posts,
  users,
  likes,
  comments,
  follows,
  nestedcomments,
  previewlinks,
  postquotes,
} = require("../../models");
const sequelize = require("sequelize");
const { tokenCheck } = require("../../middleware/tokenCheck");
router.get("/", async (req, res) => {
  try {
    const sortby = req.query.sortby ? req.query.sortby : "Latest";
    const page = parseInt(req.query.page ? req.query.page : 0);
    let homeposts;
    let postCount;
    await posts.count().then((c) => {
      postCount = c;
    });
    if (sortby === "Latest") {
      //sort by latest
      homeposts = await posts.findAll({
        limit: 10,
        offset: page * 10,
        attributes: {
          exclude: ["updatedAt", "postUser"],
        },
        order: [["id", "DESC"]],
        include: [
          {
            model: postquotes,
            seperate: true,
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
            include: [
              {
                model: users,
                attributes: ["username", "avatar", "verified", "id"],
              },
            ],
            seperate: true,
          },
          {
            model: comments,
            include: [
              {
                model: nestedcomments,
                seperate: true,
              },
            ],
            seperate: true,
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
      if (homeposts) {
        res.status(200).send({
          message: "Latest posts",
          homeposts,
          postCount,
        });
      } else {
        res.status(400).send("something went wrong");
      }
    } else if (sortby === "Popular") {
      //sort by likes
      homeposts = await posts.findAll({
        limit: 10,
        offset: page * 10,
        attributes: {
          exclude: ["updatedAt", "postUser"],

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
            model: postquotes,
            seperate: true,
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
            include: [
              {
                model: users,
                attributes: ["username", "avatar", "verified", "id"],
              },
            ],
            seperate: true,
          },
          {
            model: comments,
            include: [
              {
                model: nestedcomments,
                seperate: true,
              },
            ],
            seperate: true,
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
      if (homeposts) {
        res.status(200).send({
          message: "Popular posts",
          homeposts,
          postCount,
        });
      } else {
        res.status(400).send("something went wrong");
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});
router.get("/followingposts", tokenCheck, async (req, res) => {
  try {
    //sort by following users posts
    let postCount;

    const page = parseInt(req.query.page ? req.query.page : 0);
    const followingids = await follows
      .findAll({
        where: {
          followerid: req.user.id,
        },
      })
      .then(async (f) => {
        return await f.map((follow) => {
          return follow.followingid;
        });
      });
    await posts
      .count({
        where: {
          postUser: {
            [sequelize.Op.in]: followingids,
          },
        },
      })
      .then((c) => {
        postCount = c;
      });
    const homeposts = await posts.findAll({
      where: {
        postUser: {
          [sequelize.Op.in]: followingids,
        },
      },
      limit: 10,
      offset: page * 10,
      attributes: {
        exclude: ["updatedAt", "postUser"],
      },
      order: [["id", "DESC"]],
      include: [
        {
          model: postquotes,
          seperate: true,
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
          include: [
            {
              model: users,
              attributes: ["username", "avatar", "verified", "id"],
            },
          ],
          seperate: true,
        },
        {
          model: comments,
          include: [
            {
              model: nestedcomments,
              seperate: true,
            },
          ],
          seperate: true,
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
      message: "Following users posts",
      homeposts,
      postCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
