"use strict";
require("dotenv").config();
const router = require("express").Router();
const { users } = require("../../models");
const bcrypt = require("bcryptjs");
const { sign } = require("jsonwebtoken");
const avatarColor = [
  "008AB8",
  "72139e",
  "f57505",
  "CC3333",
  "CC6699",
  "139e9e",
  "11963b",
  "054d85",
  "8207f5",
  "c70c0c",
  "0cc763",
  "2f695f",
  "106cad",
];

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
  } else if (password.length < 4) {
    res.status(400).send("Password must be at least 4 characters");
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
      res.status(500).send(error.message);
    }
  }
});
router.post("/gregister", async (req, res) => {
  const { username, email, avatar } = req.body;

  if (!username || !email || !avatar) {
    res.status(400).send("Please fill all fields");
  } else {
    try {
      const sanitizedUsername = username.replace(/\s+/g, "");
      const user = await users.findOne({
        where: {
          username: sanitizedUsername,
        },
      });
      if (user) {
        return res.status(400).send("Username already exists");
      } else {
        const newUser = await users.create({
          username: sanitizedUsername,
          email,
          password: "chI3VkNCCgKO9ZyQ9SJt",
          avatar,
        });
        if (newUser) {
          const token = sign(
            {
              id: newUser.id,
            },
            process.env.JWT_SECRET
          );
          res.status(201).send({
            message: `Account created successfully.Welcome to momos.`,
            token: "Bearer " + token,
            user: {
              username: sanitizedUsername,
              avatar,
            },
          });
        } else {
          res.status(400).send("Something went wrong");
        }
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
});

module.exports = router;
