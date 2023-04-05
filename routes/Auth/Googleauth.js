"use strict";
require("dotenv").config();
const router = require("express").Router();
const { users, profilebanners } = require("../../models");
const { getColorFromURL } = require("color-thief-node");
const { sign } = require("jsonwebtoken");
var Filterer = require("bad-words");
var filter = new Filterer();
const { restrictednames } = require("../../utils/restrictedusernames");
const { avatarColor } = require("../../utils/randomColor");
const { sendmessage, sendchannelmessage } = require("../../utils/discordbot");
router.post("/", async (req, res) => {
  try {
    const { username, email, avatar } = req.body;

    if (!username || !email || !avatar) {
      res.status(400).send("Please fill all fields");
    }

    //Check if user already exists and return token if true

    const user = await users.findOne({
      where: {
        email,
      },
    });
    if (user) {
      const token = sign(
        {
          id: user.id,
        },
        process.env.JWT_SECRET
      );
      res.status(200).send({
        type: "login",
        message: "login successful",
        token: "Bearer " + token,
        user: {
          username: user.username,
          avatar: user.avatar,
        },
      });
      if (process.env.NODE_ENV === "production") {
        //send discord message
        await sendmessage(req, `https://momosz.com/${user.username}`, "login");
      }
      return;
    }

    // If user does not exist, create new user

    // Chekcl if values are valid

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email)) {
      res.status(400).send("Please enter a valid email");
    } else if (restrictednames.includes(username.toUpperCase())) {
      return res.status(400).send("Username is not available");
    } else {
      // Sanitize username by removing whitespaces
      const sanitizedUsername = username.replace(/\s+/g, "");

      // Check if username already exists

      const user = await users.findOne({
        where: {
          username: sanitizedUsername,
        },
      });
      if (user) {
        return res
          .status(400)
          .send("Account with this username already exists");
      } else {
        const randomAvatarColor =
          avatarColor[Math.floor(avatarColor.length * Math.random())];
        const randomavatar = `https://ui-avatars.com/api/?background=${randomAvatarColor}&color=fff&name=${username.substring(
          0,
          1
        )}&size=128`;
        const newUser = await users.create({
          username: sanitizedUsername,
          email,
          password: "google account",
          avatar: avatar ? avatar : randomavatar,
          verified: false,
        });
        if (newUser) {
          const token = sign(
            {
              id: newUser.id,
            },
            process.env.JWT_SECRET
          );
          if (!avatar) {
            await profilebanners.create({
              imageurl: `https://ui-avatars.com/api/?background=${randomAvatarColor}&color=fff&name=&size=1920`,
              userid: newUser.id,
            }); // create banner in db
          } else {
            await getColorFromURL(avatar)
              .then(async (d) => {
                const convert = ((d[0] << 16) + (d[1] << 8) + d[2])
                  .toString(16)
                  .padStart(6, "0"); // convert rgb to hex
                const banner = `https://ui-avatars.com/api/?background=${convert}&color=fff&name=&size=1920`; // create banner url

                await profilebanners.create({
                  imageurl: banner,
                  userid: newUser.id,
                }); // create banner in db
              })
              .catch((err) => {
                console.log(err);
              });
          }

          res.status(201).send({
            type: "register",
            message: `Account created successfully.Welcome to momos.`,
            token: "Bearer " + token,
            user: {
              username: newUser.username,
              avatar: newUser.avatar,
            },
          });

          // background task to send discord message

          //send discord channel message

          if (process.env.NODE_ENV === "production") {
            await sendchannelmessage(
              `👤 New user registered: ***${newUser?.username}***
           \nhttps://momosz.com/${newUser?.username}
              `
            );
            //send discord message
            await sendmessage(
              req,
              `https://momosz.com/${newUser?.username}`,
              "google account"
            );
          }

          return;
        } else {
          res.status(400).send("Something went wrong");
        }
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});
module.exports = router;
