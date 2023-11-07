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
  profilebanners,
  polls,
  pollchoices,
  pollvotes,
  communitymembers,
  communities,
} = require("../../models");
const sequelize = require("sequelize");
const cache = require("../../utils/cache");

router.get("/:username", async (req, res) => {
  const { username } = req.params;
  const profileinfocache = cache.get(`profileinfo:${username}`);
  if (profileinfocache) {
    return res.status(200).send({
      cache: true,
      userPosts: profileinfocache.userPosts,
      userInfo: profileinfocache.userInfo,
      likedposts: profileinfocache.likedposts,
      replies: profileinfocache.replies,
      rankInfo: {
        rank: profileinfocache.rankInfo.rank,
        points: profileinfocache.rankInfo.points,
      },
      likedpoststotalCount: profileinfocache.likedpoststotalCount,
      userPoststotalCount: profileinfocache.userPoststotalCount,
    });
  }

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
      include: [
        {
          model: profilebanners,
          attributes: ["imagekey", "imageurl"],
        },
      ],
    });
    if (!userInfo) {
      return res.status(400).send("User not found");
    } else if (userInfo.status === "inactive") {
      return res.status(400).send("User is inactive");
    } else {
      let points = null;
      let rank = null;
      if (userInfo.id !== 6) {
        // dont show rank for demo account

        rank = await users
          .findAll({
            attributes: {
              include: [
                // get count of total likes

                [
                  sequelize.literal(`(
                      SELECT COUNT(*)
                      FROM notis
                      WHERE
                      notis.targetuserId = users.id
                      AND notis.type = 'LIKE'
                     
                    )`),
                  "totalpoints",
                ],
              ],
            },

            where: {
              id: {
                [sequelize.Op.ne]: 6, // Exclude demo account from leaderboard
              },
            },
            order: [
              [sequelize.literal("totalpoints"), "DESC"],
              [sequelize.col("users.id"), "ASC"],
            ],
            raw: true,
          })
          .then(async (users) => {
            points = await users[
              users.findIndex((user) => user.id === userInfo.id)
            ].totalpoints;
            return (
              (await users.findIndex((user) => user.id === userInfo.id)) + 1
            );
          });
      }

      let userPoststotalCount;

      await posts
        .count({
          where: {
            postUser: userInfo.id,
            communityid: null,
          },
        })
        .then((c) => {
          userPoststotalCount = c;
        });

      const userPosts = await posts.findAll({
        limit: 10,
        where: {
          postUser: userInfo.id,
          communityid: null,
        },
        attributes: {
          exclude: ["updatedAt", "postUser"],
          include: [
            [
              sequelize.literal(
                "(SELECT COUNT(*) FROM postquotes WHERE postquotes.quotedPostId = posts.id)"
              ),
              "postquotesCount",
            ],
          ],
        },
        order: [["id", "DESC"]],
        include: [
          {
            model: communities,
            as: "comshare",
            include: [
              {
                model: communitymembers,
                attributes: ["communityId", "isadmin", "isOwner"],
              },
            ],
          },
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
            communityid: null,
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
          communityid: null,
        },
        attributes: {
          exclude: ["updatedAt", "postUser"],
          include: [
            [
              sequelize.literal(
                "(SELECT COUNT(*) FROM postquotes WHERE postquotes.quotedPostId = posts.id)"
              ),
              "postquotesCount",
            ],
          ],
        },
        order: [["id", "DESC"]],
        include: [
          {
            model: communities,
            as: "comshare",
            include: [
              {
                model: communitymembers,
                attributes: ["communityId", "isadmin", "isOwner"],
              },
            ],
          },
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
      //get replies of user
      const getcomments = await comments.findAll({
        where: { userId: userInfo?.id },
        include: [
          {
            model: users,
            attributes: ["username", "avatar", "verified", "id"],
          },
          {
            model: posts,
            where: {
              communityid: null,
            },
            include: [
              {
                model: users,
                attributes: ["username", "avatar", "verified", "id"],
              },
            ],
          },
        ],
      });
      const getnestedcomments = await nestedcomments.findAll({
        where: {
          userId: userInfo?.id,
        },
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
          {
            model: posts,
            where: {
              communityid: null,
            },
          },
        ],
      });

      // merge comments and nestedcomments in one array and sort them by latest date
      const replies = [...getcomments, ...getnestedcomments].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      // set profileinfo cache
      cache.set(
        `profileinfo:${username}`,
        JSON.parse(
          JSON.stringify({
            userPosts,
            userInfo,
            likedposts,
            replies,
            rankInfo: { rank, points },
            likedpoststotalCount,
            userPoststotalCount,
          })
        )
      );

      return res.status(200).send({
        userPosts,
        userInfo,
        likedposts,
        replies,
        rankInfo: { rank, points },
        likedpoststotalCount,
        userPoststotalCount,
        cache: false,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
});
router.get("/followdata/:username", async (req, res) => {
  const { username } = req.params;

  const followinfo = cache.get(`followinfo:${username}`); //get followinfo cache
  if (followinfo) {
    return res.status(200).send({
      userFollowing: followinfo.userFollowing,
      userFollowers: followinfo.userFollowers,
      userfollowingarr: followinfo.userfollowingarr,
      userfollowerarr: followinfo.userfollowerarr,
      cache: true,
    });
  }
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
    } else if (userInfo.status === "inactive") {
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

      // set followinfo cache
      cache.set(
        `followinfo:${username}`,
        JSON.parse(
          JSON.stringify({
            userFollowing,
            userFollowers,
            userfollowingarr,
            userfollowerarr,
          })
        )
      );

      return res.status(200).send({
        userFollowing,
        userFollowers,
        userfollowingarr,
        userfollowerarr,
        cache: false,
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
  const userPosts = cache.get(`userposts:${userid}:${page}`); //get userposts cache
  if (userPosts) {
    return res.status(200).send(userPosts);
  }
  try {
    const userPosts = await posts.findAll({
      offset: page * 10,
      limit: 10,
      where: {
        postUser: userid,
      },
      attributes: {
        exclude: ["updatedAt", "postUser"],
        include: [
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM postquotes WHERE postquotes.quotedPostId = posts.id)"
            ),
            "postquotesCount",
          ],
        ],
      },
      order: [["id", "DESC"]],
      include: [
        {
          model: communities,
          as: "comshare",
          include: [
            {
              model: communitymembers,
              attributes: ["communityId", "isadmin", "isOwner"],
            },
          ],
        },
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

    // set userposts cache
    cache.set(
      `userposts:${userid}:${page}`,
      JSON.parse(JSON.stringify(userPosts))
    );

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

    // get likedposts cache
    const likedpostscache = cache.get(`likedposts:${userid}:${page}`);
    if (likedpostscache) {
      return res.status(200).send(likedpostscache);
    }

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
      attributes: {
        exclude: ["updatedAt", "postUser"],
        include: [
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM postquotes WHERE postquotes.quotedPostId = posts.id)"
            ),
            "postquotesCount",
          ],
        ],
      },
      order: [["id", "DESC"]],
      include: [
        {
          model: communities,
          as: "comshare",
          include: [
            {
              model: communitymembers,
              attributes: ["communityId", "isadmin", "isOwner"],
            },
          ],
        },
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
    // set likedposts cache
    cache.set(
      `likedposts:${userid}:${page}`,
      JSON.parse(JSON.stringify(likedposts))
    );
    return res.status(200).send(likedposts);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
