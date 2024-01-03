/* eslint-disable no-undef */
"use strict";
require("dotenv").config();
const router = require("express").Router();
const { compare } = require("bcryptjs");
const bcrypt = require("bcryptjs");
const { profilebanners, users, posts } = require("../../models");
const { cloudinary } = require("../../utils/cloudinary");
const { deleteallcache } = require("../../utils/deletecache");

//get user info

router.get("/getUserInfo", async (req, res) => {
  try {
    const user = await users.findOne({
      where: {
        id: req.user.id,
      },
      attributes: {
        exclude: ["imagekey"],
      },
    });
    if (!user) {
      return res.status(404).send("user not found");
    }
    const isGoogleAccount = process.env.GOOGLE_PASS.split(",").includes(
      user.password
    );
    const responseUser = {
      ...user.toJSON(),
      isGoogleAccount: isGoogleAccount,
      password: undefined, // Exclude the password from the response
    };
    return res.status(200).send(responseUser);
  } catch (error) {
    console.log(error);
    return res.status(500).send("something went wrong");
  }
});

//update user email

function isValidEmail(email) {
  const emailRegex =
    // eslint-disable-next-line no-control-regex
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;
  return emailRegex.test(email);
}

// Example usage
const email = "test@example.com";
if (isValidEmail(email)) {
  console.log("Valid email address");
} else {
  console.log("Invalid email address");
}

//update email

router.put("/updateEmail", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send("Please fill all fields");
    } else if (req.user.id === 6) {
      return res.status(400).send("You cannot change this account's email");
    }
    const user = await users.findOne({
      where: {
        id: req.user.id,
      },
    });
    if (!user) {
      return res.status(400).send("User not found");
    } else {
      await compare(password, user.password).then(async (ismatch) => {
        if (!ismatch) {
          return res.status(400).send("Your password is incorrect");
        } else {
          //check if email is valid`
          if (!isValidEmail(email)) {
            return res.status(400).send("Invalid email address");
          }
          //check if email already exists
          if (email === user.email) {
            return res.status(400).send("This is your current email");
          }

          //update email
          await users.update(
            {
              email: email,
            },
            {
              where: {
                id: req.user.id,
              },
            }
          );

          return res.status(200).send("Email updated successfully");
        }
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

//update user password
router.put("/updatePassword", async (req, res) => {
  try {
    const { CurrentPassword, NewPassword, ConfirmNewPassword } = req.body;
    if (!CurrentPassword || !NewPassword || !ConfirmNewPassword) {
      return res.status(400).send("Please fill all fields");
    } else if (NewPassword !== ConfirmNewPassword) {
      return res
        .status(400)
        .send("Your new password and confirm password do not match");
    } else if (CurrentPassword === NewPassword) {
      return res
        .status(400)
        .send("Your new password cannot be the same as your current password");
    } else if (NewPassword.length < 6) {
      return res
        .status(400)
        .send("Your new password must be at least 6 characters");
    }
    if (req.user.id === 6) {
      return res.status(400).send("You cannot change this account's password");
    }
    const user = await users.findOne({
      where: {
        id: req.user.id,
      },
    });
    if (!user) {
      return res.status(400).send("User not found");
    } else {
      await compare(CurrentPassword, user.password).then(async (ismatch) => {
        if (!ismatch) {
          return res.status(400).send("Your current password is incorrect");
        } else {
          await bcrypt.hash(ConfirmNewPassword, 10).then((hash) => {
            return users.update(
              {
                password: hash,
              },
              {
                where: {
                  id: req.user.id,
                },
              }
            );
          });

          return res.status(200).send("Password updated successfully");
        }
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

// eslint-disable-next-line no-unused-vars
const deleteAccountroute =
  ("/deleteAccount/:password",
  async (req, res) => {
    try {
      const { password } = req.params;
      if (!password) return res.status(400).send("Please fill all fields");

      const userId = req.user.id;
      const finduser = await users.findOne({
        where: {
          id: userId,
        },
      });
      if (!finduser) {
        return res.status(404).send("user not found");
      }
      if (finduser?.id === 6 || finduser?.id === 5) {
        return res.status(400).send("You cannot delete this account");
      }
      await compare(password, finduser.password).then(async (ismatch) => {
        if (!ismatch) {
          return res.status(400).send("Your current password is incorrect");
        } else {
          //delete user avatar from cloudinary if it exists

          if (finduser.imagekey) {
            await cloudinary.uploader.destroy(finduser.imagekey),
              (err) => {
                if (err) {
                  return res
                    .status(500)
                    .send("error deleting  profile picture");
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
              (err) => {
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
          if (getposts.length > 0) {
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
          return res.status(200).send("Account deleted successfully");
        }
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send("something went wrong");
    }
  });
module.exports = router;
