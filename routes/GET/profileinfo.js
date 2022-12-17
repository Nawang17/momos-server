"use strict";
const router = require("express").Router();
const { posts, users, likes, comments, follows } = require("../../models");
const sequelize = require("sequelize");
router.get("/:username", async (req, res) => {
  const { username } = req.params;
  try {
    if (!username) {
      return res.status(400).send("username is required");
    }
    const userInfo = await users.findOne({
      where: {
        username: username,
      },
      attributes: {
        exclude: ["password", "updatedAt", "email", "userid", "imagekey"],
      },
    });
    if (!userInfo) {
      return res.status(400).send("User not found");
    } else if (userInfo.status !== "active") {
      return res.status(400).send("User is inactive");
    } else {
      let points;
      const rank = await users
        .findAll({
          attributes: {
            include: [
              [
                sequelize.literal(`(
              
                      SELECT COUNT(*)
                      FROM posts AS posts
                      WHERE
                          posts.postUser = users.id
                          AND users.id != 6
      
                  )`),
                "totalposts",
              ],

              [
                sequelize.literal(`(
                SELECT COUNT(*)
                FROM posts AS posts
                INNER JOIN likes AS likes ON likes.postId = posts.id
                WHERE 
                  posts.postUser = users.id
                  AND likes.userId != users.id
                  AND users.id != 6
              )`),
                "totalLikes",
              ],
              [
                sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM follows AS follows
                    WHERE
                        follows.followingid = users.id
    
                )`),
                "totalFollowers",
              ],
            ],
          },

          order: [
            [
              sequelize.literal("totalposts + totalLikes  + totalFollowers"),
              "DESC",
            ],
          ],
          raw: true,
        })
        .then(async (users) => {
          points =
            (await users[users.findIndex((user) => user.id === userInfo.id)]
              .totalposts) +
            users[users.findIndex((user) => user.id === userInfo.id)]
              .totalLikes +
            users[users.findIndex((user) => user.id === userInfo.id)]
              .totalFollowers;
          return (await users.findIndex((user) => user.id === userInfo.id)) + 1;
        });

      let userPoststotalCount;

      await posts
        .count({
          where: {
            postUser: userInfo.id,
          },
        })
        .then((c) => {
          userPoststotalCount = c;
        });

      const userPosts = await posts.findAll({
        limit: 10,
        where: {
          postUser: userInfo.id,
        },
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

      const likedpostsidarray = await likes
        .findAll({
          where: {
            userId: userInfo.id,
          },
          raw: true,
        })
        .then(
          async (likes) =>
            await likes.map((like) => {
              return like.postId;
            })
        );

      let likedpoststotalCount;
      await posts
        .count({
          where: {
            id: {
              [sequelize.Op.in]: likedpostsidarray,
            },
          },
        })
        .then((c) => {
          likedpoststotalCount = c;
        });
      const likedposts = await posts.findAll({
        limit: 10,
        where: {
          id: {
            [sequelize.Op.in]: likedpostsidarray,
          },
        },
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

      return res.status(200).send({
        userPosts,
        userInfo,
        likedposts,
        rankInfo: { rank, points },
        likedpoststotalCount,
        userPoststotalCount,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
});
router.get("/followdata/:username", async (req, res) => {
  const { username } = req.params;
  try {
    if (!username) {
      return res.status(400).send("username is required");
    }
    const userInfo = await users.findOne({
      where: {
        username: username,
      },
      attributes: { exclude: ["password", "updatedAt", "email"] },
    });
    if (!userInfo) {
      return res.status(400).send("User not found");
    } else if (userInfo.status !== "active") {
      return res.status(400).send("User is inactive");
    } else {
      const userFollowers = await follows.findAll({
        where: {
          followingid: userInfo.id,
        },
        order: [["id", "DESC"]],
        include: [
          {
            model: users,
            as: "follower",
            attributes: ["username", "avatar", "verified", "id"],
          },
        ],
      });

      const userfollowerarr = userFollowers.map((p) => p.follower.username);
      const userFollowing = await follows.findAll({
        where: {
          userid: userInfo.id,
        },
        order: [["id", "DESC"]],
        include: [
          {
            model: users,
            as: "following",
            attributes: ["username", "avatar", "verified", "id"],
          },
        ],
      });
      const userfollowingarr = userFollowing.map((z) => z.following.username);

      return res.status(200).send({
        userFollowing,
        userFollowers,
        userfollowingarr,
        userfollowerarr,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});
router.get("/userposts/:userid", async (req, res) => {
  const { userid } = req.params;
  const page = parseInt(req.query.page ? req.query.page : 1);

  try {
    const userPosts = await posts.findAll({
      offset: page * 10,
      limit: 10,
      where: {
        postUser: userid,
      },
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
    return res.status(200).send(userPosts);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

router.get("/likedposts/:userid", async (req, res) => {
  try {
    const { userid } = req.params;
    const page = parseInt(req.query.page ? req.query.page : 1);

    const likedpostsidarray = await likes
      .findAll({
        where: {
          userId: userid,
        },
        raw: true,
      })
      .then(
        async (likes) =>
          await likes.map((like) => {
            return like.postId;
          })
      );

    const likedposts = await posts.findAll({
      offset: page * 10,
      limit: 10,
      where: {
        id: {
          [sequelize.Op.in]: likedpostsidarray,
        },
      },
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

    return res.status(200).send(likedposts);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
