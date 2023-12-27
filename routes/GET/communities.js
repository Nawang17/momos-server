"use strict";
const router = require("express").Router();
const {
  posts,
  users,
  likes,
  comments,
  nestedcommentlikes,
  nestedcomments,
  previewlinks,
  polls,
  pollchoices,
  pollvotes,
  commentlikes,
  communities,
  communitymembers,
  notis,
} = require("../../models");
const { tokenCheck } = require("../../middleware/tokenCheck");
const sequelize = require("sequelize");
const { Op } = require("sequelize");
const { cloudinary } = require("../../utils/cloudinary");

router.get("/", tokenCheck, async (req, res) => {
  //get all communiteis where i am a member
  const mycommunities = await communitymembers.findAll({
    where: {
      userId: req.user.id,
    },
    include: [
      {
        model: communities,
        attributes: [
          "id",
          "name",
          "banner",
          "bannerkey",
          "description",
          "private",
        ],
        include: [
          {
            model: communitymembers,
            attributes: ["communityId", "isadmin", "isOwner"],
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
  });

  const communitids = mycommunities.map((community) => community.communityId);
  //get all communities where i am not a member

  const findcommunities = await communities.findAll({
    where: {
      id: {
        [Op.notIn]: communitids,
      },
    },
    include: [
      {
        model: communitymembers,
        attributes: ["communityId"],
      },
    ],
  });

  return res.status(200).send({
    mycommunities,
    findcommunities,
  });
});
//get all communities for non logged in users
router.get("/allcommunities", async (_, res) => {
  const findcommunities = await communities.findAll({
    include: [
      {
        model: communitymembers,
        attributes: ["communityId"],
      },
    ],
  });

  return res.status(200).send({
    findcommunities,
  });
});

router.get("/communityProfile/:name", async (req, res) => {
  const community = await communities.findOne({
    where: {
      name: req.params.name,
    },
    include: [
      {
        model: communitymembers,
        attributes: ["communityId", "isadmin", "isOwner"],
        include: [
          {
            model: users,
            attributes: ["username", "avatar", "verified", "id"],
          },
        ],
      },
    ],
  });

  if (!community) {
    return res.status(404).send("Community not found");
  }
  if (!community.private) {
    const communityPosts = await posts.findAll({
      where: {
        communityid: community.id,
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
    return res.status(200).send({ community, communityPosts });
  }
  return res.status(200).send({ community });
});

router.get("/communityPosts/:name", tokenCheck, async (req, res) => {
  const findcommunity = await communities.findOne({
    where: {
      name: req.params.name,
    },
  });
  if (!findcommunity) {
    return res.status(404).send("Community not found");
  }
  //check if user is a member of community
  const communitymember = await communitymembers.findOne({
    where: {
      userId: req.user.id,
      communityId: findcommunity.id,
    },
  });
  if (!communitymember) {
    return res.status(400).send("You are not a member of this community");
  }
  if (findcommunity.private) {
    const communityPosts = await posts.findAll({
      where: {
        communityid: findcommunity.id,
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
    return res
      .status(200)
      .send({ communityPosts: communityPosts, private: true });
  }
  return res.status(200).send({ communityPosts: [], private: false });
});

router.get("/singlepost/:postid", tokenCheck, async (req, res) => {
  const { postid } = req.params;

  try {
    if (!postid) {
      res.status(400).send("postid is required");
    }
    if (isNaN(postid)) {
      res.status(400).send("postid must be a number");
    }
    const singlepost = await posts.findAll({
      where: {
        id: postid,
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
          model: communities,
          as: "community",
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
          model: posts,
          include: [
            {
              model: users,
              attributes: ["username", "avatar", "verified", "id"],
            },
          ],
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
          seperate: true,

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
              include: [
                {
                  model: nestedcommentlikes,
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
      return res.status(400).send("Post not found");
    } else {
      //check if user is member of community
      const checkifmember = await communitymembers.findOne({
        where: {
          communityId: singlepost[0].communityid,
          userId: req.user.id,
        },
      });
      if (!checkifmember) {
        return res.status(400).send("You are not a member of this community");
      }

      return res.status(200).send({
        cache: false,
        message: "post retrieved successfully",
        singlepost,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
});

//leave community

router.delete("/leavecommunity/:name", tokenCheck, async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).send("community name is required");
    }
    const findcommunity = await communities.findOne({
      where: {
        name,
      },
    });
    if (!findcommunity) {
      return res.status(400).send("community not found");
    }
    const checkifmember = await communitymembers.findOne({
      where: {
        communityId: findcommunity.id,
        userId: req.user.id,
      },
    });
    if (!checkifmember) {
      return res.status(400).send("You are not a member of this community");
    }
    if (checkifmember.isOwner) {
      return res.status(400).send("You cannot leave a community you created");
    }
    //delete users posts in community
    await posts.destroy({
      where: {
        communityid: findcommunity.id,
        postUser: req.user.id,
      },
    });

    //delete notis of users from community

    await notis.destroy({
      where: {
        communityid: findcommunity.id,
        targetuserId: req.user.id,
      },
    });
    //delete user from community
    await checkifmember.destroy();
    return res.status(200).send("You have left this community");
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
});

//delete community
router.delete("/deleteCommunity/:name", tokenCheck, async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).send("community name is required");
    }
    const findcommunity = await communities.findOne({
      where: {
        name,
      },
    });
    if (!findcommunity) {
      return res.status(400).send("community not found");
    }
    const checkifmember = await communitymembers.findOne({
      where: {
        communityId: findcommunity.id,
        userId: req.user.id,
      },
    });
    if (!checkifmember) {
      return res.status(400).send("You are not a member of this community");
    }
    if (!checkifmember.isOwner) {
      return res
        .status(400)
        .send("You are not allowed to delete this community");
    }
    //delete users posts of community
    await posts.destroy({
      where: {
        communityid: findcommunity.id,
      },
    });
    //delete notis of community

    await notis.destroy({
      where: {
        communityid: findcommunity.id,
      },
    });

    //delete banner of community if it exists

    if (findcommunity.banner && findcommunity.bannerkey) {
      await cloudinary.uploader.destroy(
        findcommunity.bannerkey,
        {
          // eslint-disable-next-line no-undef
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        },
        (err, result) => {
          if (err) {
            res.status(500).send(err);
          }
          console.log("Banner deleted from cloudinary", result);
        }
      );
    }

    //delete community
    await findcommunity.destroy();

    return res.status(200).send("Community deleted");
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
});
module.exports = router;
