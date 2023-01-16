"use strict";
require("dotenv").config();
const router = require("express").Router();
const { users } = require("../../models");
const bcrypt = require("bcryptjs");
const { sign } = require("jsonwebtoken");
var Filterer = require("bad-words");
var filter = new Filterer();
const { restrictednames } = require("../../utils/restrictedusernames");
const { avatarColor } = require("../../utils/randomColor");

const { sendmessage } = require("../../utils/discordbot");
router.post("/", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).send("Please fill all fields");
  } else if (/^\s*$/.test(username) || /^\s*$/.test(password)) {
    res.status(400).send("Please fill all fields");
  } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
    res.status(400).send("Username can only contain letters and numbers");
  } else if (username.length < 4 || username.length > 15) {
    res.status(400).send("Username must be between 4 and 15 characters");
  } else if (restrictednames.includes(username.toUpperCase())) {
    return res.status(400).send("Username is not available");
  } else if (password.length < 4) {
    return res.status(400).send("Password must be at least 4 characters");
  } else if (filter.isProfane(username)) {
    return res.status(400).send("Username is not available");
  } else {
    try {
      const user = await users.findOne({
        where: {
          username,
        },
      });
      if (user) {
        res.status(400).send("Username already exists");
      } else {
        const randomAvatarColor =
          avatarColor[Math.floor(avatarColor.length * Math.random())];
        const avatar = `https://ui-avatars.com/api/?background=${randomAvatarColor}&color=fff&name=${username.substring(
          0,
          1
        )}&size=128`;
        const newUser = await bcrypt.hash(password, 10).then((hash) => {
          return users.create({
            username,
            password: hash,
            avatar,
          });
        });
        if (newUser) {
          const token = sign(
            {
              id: newUser.id,
            },
            process.env.JWT_SECRET
          );

          //send discord message
          await sendmessage(
            req,
            `https://momosz.com/${newUser?.username}`,
            "account"
          );

          res.status(201).send({
            message: `Account created successfully.Welcome to momos.`,
            token: "Bearer " + token,
            user: {
              username,
              avatar,
            },
          });
        } else {
          res.status(400).send("Something went wrong");
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send("Something went wrong");
    }
  }
});
router.post("/gregister", async (req, res) => {
  const { username, email, avatar } = req.body;

  if (!username || !email || !avatar) {
    res.status(400).send("Please fill all fields");
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email)) {
    res.status(400).send("Please enter a valid email");
  } else if (restrictednames.includes(username.toUpperCase())) {
    return res.status(400).send("Username is not available");
  } else {
    try {
      const sanitizedUsername = username.replace(/\s+/g, "");
      const findemail = await users.findOne({
        where: {
          email,
        },
      });
      if (findemail) {
        return res.status(400).send("Account with this email already exists");
      }
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
          password: "chI3VkNCCgKO9ZyQ9SJt",
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

          //send discord message
          await sendmessage(
            req,
            `https://momosz.com/${newUser?.username}`,
            "google account"
          );
          res.status(201).send({
            message: `Account created successfully.Welcome to momos.`,
            token: "Bearer " + token,
            user: {
              username: newUser.username,
              avatar: newUser.avatar,
            },
          });
        } else {
          res.status(400).send("Something went wrong");
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send("Something went wrong");
    }
  }
});

module.exports = router;
