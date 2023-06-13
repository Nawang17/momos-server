"use strict";
const router = require("express").Router();
const { follows, notis, users } = require("../../models");
const asyncLock = require("async-lock");
const lock = new asyncLock();
const { deleteallcache } = require("../../utils/deletecache");
//route handler for follow request
router.post("/", async (req, res) => {
  try {
    //get followingid from request body
    const { followingid } = req.body;
    //check if followingid is provided
    if (!followingid) {
      return res.status(400).send("followingid is required");
    }
    //check if followingid is a number
    else if (isNaN(followingid)) {
      return res.status(400).send("Invalid followingid");
    }
    //check if user is trying to follow themselves
    else if (followingid === req.user.id) {
      return res.status(400).send("You cannot follow yourself");
    } else {
      //create async-lock key
      const key = `follow-user-${followingid}-${req.user.id}`;
      //acquire lock
      await lock.acquire(
        key,
        async () => {
          //check if the user exists and is not inactive
          const finduser = await users.findOne({
            where: {
              id: followingid,
            },
          });
          if (!finduser) {
            return res
              .status(400)
              .send("You cannot follow a non-existent user");
          } else if (finduser.status === "inactive") {
            return res.status(400).send("You cannot follow an inactive user");
          }
          //check if follow relationship already exists
          const [newFollow, created] = await follows.findOrCreate({
            where: {
              followingid,
              userid: req.user.id,
            },
            defaults: {
              followingid,
              userid: req.user.id,
              followerid: req.user.id,
            },
          });

          //if follow relationship already exists, destroy it
          if (!created) {
            await follows.destroy({
              where: {
                followingid,
                userid: req.user.id,
              },
            });

            deleteallcache();

            //return followed status as false
            return res.status(200).send({ followed: false });
          }
          //if follow relationship does not exist, create it
          else {
            //create new notification
            await notis.create({
              userId: req.user.id,
              type: "FOLLOW",
              text: "started following you.",
              targetuserId: followingid,
              followid: newFollow.id,
            });
            //get details of new follow relationship
            const newFollowing = await follows.findOne({
              where: {
                id: newFollow.id,
              },
              include: [
                {
                  model: users,
                  as: "follower",
                  attributes: ["username", "avatar", "verified", "id"],
                },
                {
                  model: users,
                  as: "following",
                  attributes: ["username", "avatar", "verified", "id"],
                },
              ],
            });
            deleteallcache();

            //respond with followed status as true and new follow relationship details
            res.status(200).send({ followed: true, newFollowing });

            const findusersocketID = onlineusers
              .filter(
                (obj, index, self) =>
                  self.findIndex((o) => o.socketid === obj.socketid) === index
              )
              .find((val) => val.userid === followingid);
            if (findusersocketID) {
              const followuser = await users.findOne({
                where: {
                  id: req.user.id,
                },
              });
              io.to(findusersocketID?.socketid).emit("newnotification", {
                type: "started following you",
                postId: null,
                username: followuser?.username,
                avatar: followuser?.avatar,
              });
            }
            return;
          }
        },
        //set timeout to release lock after 5 seconds if not released by the code
        { timeout: 5000 }
      );
    }
  } catch (error) {
    console.log(error);
    //error handling
    return res.status(500).send("Something went wrong");
  }
});

//export router
module.exports = router;
