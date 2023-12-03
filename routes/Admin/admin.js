"use strict";
const router = require("express").Router();
const { profilebanners, users, posts } = require("../../models");
const { cloudinary } = require("../../utils/cloudinary");
const { deleteallcache } = require("../../utils/deletecache");

router.get("/allusers", async (req, res) => {
  if (req.user.status !== "admin") {
    return res.status(401).send("unauthorized access");
  }
  try {
    const allusers = await users.findAll({
      attributes: ["username", "avatar", "verified", "id", "status"],
    });

    res.status(200).send({
      message: "users retrieved successfully",
      allusers,
    });
  } catch (error) {
    console.log(error);

    res.status(500).send("Something went wrong");
  }
});

router.put("/changeStatus", async (req, res) => {
  if (req.user.status !== "admin") {
    return res.status(401).send("unauthorized access");
  }
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).send("userId is required");
    const finduser = await users.findOne({
      where: {
        id: userId,
      },
    });
    if (!finduser) return res.status(404).send("user not found");
    if (finduser.status === "admin")
      return res.status(400).send("cannot change status of admin");
    if (finduser.status === "active") {
      await users.update(
        {
          status: "inactive",
        },
        {
          where: {
            id: userId,
          },
        }
      );
      deleteallcache();

      return res
        .status(200)
        .send({ message: "status changed to inactive", status: "inactive" });
    }
    if (finduser.status === "inactive") {
      await users.update(
        {
          status: "active",
        },
        {
          where: {
            id: userId,
          },
        }
      );

      deleteallcache();

      return res
        .status(200)
        .send({ message: "status changed to inactive", status: "active" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("something went wrong");
  }
});

router.delete("/deleteUser/:userId", async (req, res) => {
  if (req.user.status !== "admin") {
    return res.status(401).send("unauthorized access");
  }
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).send("userId is required");
    const finduser = await users.findOne({
      where: {
        id: userId,
      },
    });
    if (!finduser) return res.status(404).send("user not found");
    if (finduser.status === "admin")
      return res.status(400).send("cannot delete admin");

    //delete user avatar from cloudinary if it exists

    if (finduser.imagekey) {
      await cloudinary.uploader.destroy(finduser.imagekey),
        (err, result) => {
          if (err) {
            return res.status(500).send("error deleting  profile picture");
          }
        };
    }

    // delete user banner from cloudinary if it exists

    const getuserbanner = await profilebanners.findOne({
      where: {
        userid: userId,
      },
    });
    if (getuserbanner?.imagekey) {
      await cloudinary.uploader.destroy(getuserbanner.imagekey),
        (err, result) => {
          if (err) {
            return res.status(500).send("error deleting profile banner");
          }
        };
    }
    // get posts and delete image from posts from cloudinary if it exists and delete post
    const getposts = await posts.findAll({
      where: {
        postUser: userId,
      },
    });
    if (getposts) {
      getposts.forEach(async (value) => {
        if (value.imagekey) {
          if (value.filetype === "video") {
            await cloudinary.uploader.destroy(
              value.imagekey,
              {
                resource_type: "video",
                upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
              },
              (err, result) => {
                if (err) {
                  return res.status(500).send(err);
                }
                console.log("video deleted from cloudinary", result);
              }
            );
          } else if (value.filetype === "image") {
            await cloudinary.uploader.destroy(
              value.imagekey,
              {
                upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
              },
              (err, result) => {
                if (err) {
                  return res.status(500).send(err);
                }
                console.log("Image deleted from cloudinary", result);
              }
            );
          }
        }
        await posts.destroy({
          where: {
            id: value.id,
          },
        });
      });
    }
    //delete user from database
    await users.destroy({
      where: {
        id: userId,
      },
    });
    //clear cache
    deleteallcache();
    return res.status(200).send("user deleted successfully");
  } catch (error) {
    console.log(error);
    return res.status(500).send("something went wrong");
  }
});

module.exports = router;
