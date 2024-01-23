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
  polls,
  pollchoices,
  pollvotes,
  commentlikes,
  communities,
  communitymembers,
  translations,
} = require("../../models");
const sequelize = require("sequelize");
const { tokenCheck } = require("../../middleware/tokenCheck");
const cache = require("../../utils/cache");

router.get("/", async (req, res) => {
  try {
    const sortby = req.query.sortby ? req.query.sortby : "Latest";
    const page = parseInt(req.query.page ? req.query.page : 0);

    let homeposts;
    let postCount;

    if (sortby === "Latest") {
      //check if cache exists
      const cachedlatestposts = cache.get(`latestHomePosts:${page}`);
      const cachedlatestpostscount = cache.get(`latestHomePostscount:${page}`);
      if (cachedlatestposts && cachedlatestpostscount) {
        return res.status(200).send({
          message: "Latest posts",
          homeposts: cachedlatestposts,
          postCount: cachedlatestpostscount,
          cached: true,
        });
      } else {
        homeposts = await posts.findAll({
          limit: 10,
          offset: page * 10,
          where: {
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
              model: translations,
              attributes: ["translatedText", "language"],
            },
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
                  model: commentlikes,
                  seperate: true,
                  include: [
                    {
                      model: users,
                      attributes: ["username", "avatar", "verified", "id"],
                    },
                  ],
                },
                {
                  model: users,

                  attributes: ["username", "avatar", "verified", "id"],
                },
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
          await posts
            .count({
              where: {
                communityid: null,
              },
            })
            .then((c) => {
              postCount = c;
            });

          //set cache for latest homeposts
          cache.set(
            `latestHomePosts:${page}`,
            JSON.parse(JSON.stringify(homeposts))
          );
          cache.set(`latestHomePostscount:${page}`, postCount);

          return res.status(200).send({
            message: "Latest posts",
            homeposts,
            postCount,
            cached: false,
          });
        } else {
          res.status(400).send("something went wrong");
        }
      }

      //sort by latest
    } else if (sortby === "Popular") {
      //check if cache exists
      const cachedpopularposts = cache.get(`popularHomePosts:${page}`);
      const cachedpopularpostscount = cache.get(
        `popularHomePostscount:${page}`
      );
      if (cachedpopularposts && cachedpopularpostscount) {
        return res.status(200).send({
          message: "Popular posts",
          homeposts: cachedpopularposts,
          postCount: cachedpopularpostscount,
          cached: true,
        });
      }

      //sort by likes
      homeposts = await posts.findAll({
        limit: 10,
        offset: page * 10,
        where: {
          communityid: null,
        },
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
            [
              sequelize.literal(
                "(SELECT COUNT(*) FROM postquotes WHERE postquotes.quotedPostId = posts.id)"
              ),
              "postquotesCount",
            ],
          ],
        },
        order: [[sequelize.literal("likescount"), "DESC"]],
        include: [
          {
            model: translations,
            attributes: ["translatedText", "language"],
          },
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
                model: commentlikes,
                seperate: true,
                include: [
                  {
                    model: users,
                    attributes: ["username", "avatar", "verified", "id"],
                  },
                ],
              },
              {
                model: users,

                attributes: ["username", "avatar", "verified", "id"],
              },
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
        await posts
          .count({
            where: {
              communityid: null,
            },
          })
          .then((c) => {
            postCount = c;
          });
        //set cache for popular posts
        cache.set(
          `popularHomePosts:${page}`,
          JSON.parse(JSON.stringify(homeposts))
        );
        cache.set(`popularHomePostscount:${page}`, postCount);

        return res.status(200).send({
          message: "Popular posts",
          homeposts,
          postCount,
          cached: false,
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
          communityid: null,
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
        communityid: null,
      },
      limit: 10,
      offset: page * 10,
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
          model: translations,
          attributes: ["translatedText", "language"],
        },
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
          model: previewlinks,
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
              model: commentlikes,
              seperate: true,
              include: [
                {
                  model: users,
                  attributes: ["username", "avatar", "verified", "id"],
                },
              ],
            },
            {
              model: users,

              attributes: ["username", "avatar", "verified", "id"],
            },
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
router.get("/communityposts", tokenCheck, async (req, res) => {
  try {
    let postCount;

    const page = parseInt(req.query.page ? req.query.page : 0);

    //get all communities user is in

    const mycommunities = await communitymembers.findAll({
      where: {
        userId: req.user.id,
      },
      include: [
        {
          model: communities,
          attributes: ["name"],
        },
      ],
    });

    const communityids = mycommunities.map(
      (community) => community.communityId
    );

    await posts
      .count({
        where: {
          communityid: {
            [sequelize.Op.in]: communityids,
          },
        },
      })
      .then((c) => {
        postCount = c;
      });
    const homeposts = await posts.findAll({
      where: {
        communityid: {
          [sequelize.Op.in]: communityids,
        },
      },
      limit: 10,
      offset: page * 10,
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
          model: translations,
          attributes: ["translatedText", "language"],
        },
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
          model: communities,
          as: "community",
        },
        {
          model: previewlinks,
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
              model: commentlikes,
              seperate: true,
              include: [
                {
                  model: users,
                  attributes: ["username", "avatar", "verified", "id"],
                },
              ],
            },
            {
              model: users,

              attributes: ["username", "avatar", "verified", "id"],
            },
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
