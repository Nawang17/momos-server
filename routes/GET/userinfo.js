"use strict";
const router = require("express").Router();
const {
  users,
  follows,
  bookmarks,
  posts,
  likes,
  comments,
  nestedcomments,
  previewlinks,
  polls,
  pollchoices,
  pollvotes,
  commentlikes,
  communities,
  communitymembers,
} = require("../../models");
const sequelize = require("sequelize");
const cache = require("../../utils/cache");

router.get("/", async (req, res) => {
  const userFollowing = await follows.findAll({
    where: {
      userid: req.user.id,
    },
    include: [
      {
        model: users,
        as: "following",
        attributes: ["username", "avatar", "verified", "id"],
      },
    ],
  });
  const userfollowingarr = userFollowing.map((z) => z.following.username);
  res.status(200).send({
    message: "user retrieved successfully",
    user: {
      username: req.user.username,
      avatar: req.user.avatar,
    },
    userfollowingarr,
  });
});

router.get("/suggestedusers/:name", async (req, res) => {
  const { name } = req.params;
  const followingarray = await follows.findAll({
    where: {
      followerid: name ? name : "0",
    },
    include: [
      {
        model: users,
        as: "following",
        attributes: ["username", "avatar", "verified", "id"],
      },
    ],
  });
  const followingarr = followingarray.map((z) => z.following.username);
  const suggestedusers = await users.findAll({
    where: {
      username: {
        [sequelize.Op.notIn]: followingarr,
      },
    },
    attributes: ["username", "avatar", "verified", "id"],
    limit: 5,
  });
  res.status(200).send({
    message: "user retrieved successfully",
    suggestedusers,
  });
});

router.get("/bookmarks/:type", async (req, res) => {
  try {
    const { type } = req.params;
    if (type === "bookmarkids") {
      const bookmarkidscache = cache.get(`bookmarkids:${req.user.id}`);
      if (bookmarkidscache) {
        return res.status(200).send({
          cache: true,
          message: "bookmarks retrieved successfully",
          bookmarkIds: bookmarkidscache,
        });
      }
      const getbookmarks = await bookmarks.findAll({
        where: {
          userId: req.user.id,
        },
      });
      const bookmarkIds = getbookmarks.map((z) => z.postId);
      cache.set(`bookmarkids:${req.user.id}`, bookmarkIds);
      return res.status(200).send({
        message: "bookmarks retrieved successfully",
        bookmarkIds,
        cache: false,
      });
    } else {
      const bookmarkcache = cache.get(`bookmarkposts:${req.user.id}`);
      if (bookmarkcache) {
        return res.status(200).send({
          cache: true,
          message: "bookmarks retrieved successfully",
          bookmarks: bookmarkcache,
        });
      }

      const getbookmarks = await bookmarks.findAll({
        where: {
          userId: req.user.id,
        },
      });
      const bookmarkIds = getbookmarks.map((z) => z.postId);

      const bookmarkposts = await posts.findAll({
        where: {
          id: {
            [sequelize.Op.in]: bookmarkIds,
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
            [
              sequelize.literal(
                `(SELECT COUNT(*)
                FROM notis
                WHERE
                notis.targetuserId = posts.postUser
                AND notis.type = 'LIKE')`
              ),
              "usertotalpoints",
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
      cache.set(
        `bookmarkposts:${req.user.id}`,
        JSON.parse(JSON.stringify(bookmarkposts))
      );
      return res.status(200).send({
        cache: false,
        message: "bookmarks retrieved successfully",
        bookmarks: bookmarkposts,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});
module.exports = router;
