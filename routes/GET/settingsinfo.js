"use strict";
const router = require("express").Router();
const { users } = require("../../models");
const { cloudinary } = require("../../utils/cloudinary");
const restrictednames = ["ABOUT", "LOGIN", "REGISTER"];
router.get("/editprofileinfo", async (req, res) => {
  const { id } = req.user;
  try {
    const userInfo = await users.findOne({
      where: {
        id: id,
      },
      attributes: ["username", "description", "avatar", "verified"],
    });
    if (!userInfo) {
      return res.status(400).send("User not found");
    } else {
      return res.status(200).send({
        message: "userinfo retrieved successfully",
        userInfo,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
});

router.put("/updateprofileinfo", async (req, res) => {
  const { username, description, avatar } = req.body;
  const { id } = req.user;
  try {
    const finduser = await users.findOne({
      where: {
        id: id,
      },
    });
    if (!finduser) {
      return res.status(400).send("User not found");
    } else {
      let imguploadedResponse;
      if (!username) {
        return res
          .status(400)
          .send("Username must be between 4 and 15 characters");
      }
      if (username) {
        if (restrictednames.includes(username.toUpperCase())) {
          return res.status(400).send("Username is not available");
        }
        if (!/^[a-zA-Z0-9]+$/.test(username)) {
          return res
            .status(400)
            .send("Username can only contain letters and numbers");
        }
        if (username.length < 4 || username.length > 15) {
          return res
            .status(400)
            .send("Username must be between 4 and 15 characters");
        }
        const finduserwithname = await users.findOne({
          where: {
            username: username,
          },
        });
        if (finduserwithname) {
          if (finduserwithname?.id !== id) {
            return res
              .status(400)
              .send("Username is taken, please choose another one");
          }
        } else {
          if (username !== finduser?.username) {
            if (finduser?.username === "Demo") {
            } else {
              try {
                await users.update(
                  {
                    username: username,
                  },
                  {
                    where: {
                      id: id,
                    },
                  }
                );
                console.log("username updated successfully");
              } catch (error) {
                console.log(error);
                return res.status(400).send("Something went wrong");
              }
            }
          }
        }
      }

      if (description?.length > 160) {
        return res
          .status(400)
          .send("Description must be less than 161 characters");
      }
      if (
        description?.trim().replace(/(\r\n|\n|\r)/gm, "") !==
        finduser?.description
      ) {
        try {
          await users.update(
            {
              description: description?.trim().replace(/(\r\n|\n|\r)/gm, ""),
            },
            {
              where: {
                id: id,
              },
            }
          );
          console.log("description updated successfully");
        } catch (error) {
          console.log(error);
          return res.status(400).send("Something went wrong");
        }
      }

      if (avatar) {
        try {
          imguploadedResponse = await cloudinary.uploader.upload(avatar, {
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          });
        } catch (error) {
          return res.status(500).send("error uploading image to cloudinary");
        }
        if (finduser.imagekey) {
          await cloudinary.uploader.destroy(finduser.imagekey),
            (err, result) => {
              if (err) {
                return res
                  .status(500)
                  .send("error deleting old profile picture");
              }
            };
        }
        if (imguploadedResponse) {
          try {
            await users.update(
              {
                avatar: imguploadedResponse?.secure_url,
                imagekey: imguploadedResponse?.public_id,
              },
              {
                where: {
                  id: id,
                },
              },
              {
                multi: true,
              }
            );
          } catch (error) {
            console.log(error);
            return res.status(400).send("Something went wrong");
          }
        }
        console.log("avatar updated successfully");
      }

      const newUserInfo = await users.findOne({
        where: {
          id: id,
        },
        attributes: ["username", "avatar"],
      });
      return res.status(200).send({
        message: "User profile updated successfully",
        newUserInfo,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
});

module.exports = router;
