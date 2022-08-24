"use strict";
const router = require("express").Router();
const { likes } = require("../../models");

router.get("/", async (req, res) => {
  try {
    const findlikedPosts = await likes.findAll({
      where: {
        userId: req.user.id,
      },
    });
    const likedposts = findlikedPosts.map((post) => post.postId);
    res.status(200).send({ likedposts: likedposts });
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
