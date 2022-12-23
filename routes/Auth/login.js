"use strict";
require("dotenv").config();
const router = require("express").Router();
const { users } = require("../../models");
const { compare } = require("bcryptjs");
const { sign } = require("jsonwebtoken");

router.post("/", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).send("Please fill all fields");
  } else {
    try {
      const user = await users.findOne({
        where: {
          username,
        },
      });
      if (!user) {
        return res.status(400).send("Invalid login credentials");
      } else {
        await compare(password, user.password).then((ismatch) => {
          if (ismatch) {
            const token = sign(
              {
                id: user.id,
              },
              process.env.JWT_SECRET
            );
            return res.status(200).send({
              message: "login successful",
              token: "Bearer " + token,
              user: {
                username: user.username,
                avatar: user.avatar,
              },
            });
          } else {
            return res.status(400).send("Invalid login credentials");
          }
        });
      }
    } catch (error) {
      return res.status(400).send(error);
    }
  }
});
router.post("/glogin", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send("Please fill all fields");
  } else {
    try {
      const user = await users.findOne({
        where: {
          password: "chI3VkNCCgKO9ZyQ9SJt",
          email,
        },
      });
      if (!user) {
        return res.status(400).send("Invalid login credentials");
      } else {
        const token = sign(
          {
            id: user.id,
          },
          process.env.JWT_SECRET
        );
        return res.status(200).send({
          message: "login successful",
          token: "Bearer " + token,
          user: {
            username: user.username,
            avatar: user.avatar,
          },
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send("Something went wrong");
    }
  }
});

module.exports = router;
