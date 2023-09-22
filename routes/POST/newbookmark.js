"use strict";
const router = require("express").Router();
const { posts, bookmarks } = require("../../models");
const asyncLock = require("async-lock");
const lock = new asyncLock();
const cache = require("../../utils/cache");

router.post("/", async (req, res) => {
  try {
    // Check if postId is provided in the request body
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).send("postId is required");
    }
    //check if postId is a number
    if (isNaN(postId)) {
      return res.status(400).send("invalid postId");
    }

    // acquire the lock
    const key = `bookmark-post-${postId}-${req.user.id}`;
    await lock.acquire(
      key,
      async () => {
        // Check if the post exists
        const findpost = await posts.findOne({
          where: {
            id: postId,
          },
        });
        if (!findpost) {
          return res.status(404).send("Post not found");
        }

        // Find or create a bookmark
        const [newsave, created] = await bookmarks.findOrCreate({
          where: { postId, userId: req.user.id },
          defaults: { postId, userId: req.user.id },
        });

        //delete cache

        const bookmarkcache = cache.get(`bookmarkposts:${req.user.id}`);
        if (bookmarkcache) {
          cache.del(`bookmarkposts:${req.user.id}`);
        }
        cache.del(`bookmarkids:${req.user.id}`);

        // If bookmark already exists, destroy it
        if (!created) {
          await bookmarks.destroy({
            where: {
              postId,
              userId: req.user.id,
            },
          });

          // Send a 200 No Content response after deleting the bookmark
          return res.status(200).send({ bookmarked: false });
        }
        // Send a 201 Created response after creating a new  bookmark
        return res.status(201).send({ bookmarked: true });
      },
      { timeout: 5000 }
      // this timeout will force the lock to be released after 5 seconds if it is not released by the code
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
