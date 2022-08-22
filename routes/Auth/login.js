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
        res.status(400).send("Invalid login credentials");
      } else {
        await compare(password, user.password).then((ismatch) => {
          if (ismatch) {
            const token = sign(
              {
                id: user.id,
              },
              process.env.JWT_SECRET
            );
            res.status(200).send({
              message: "login successful",
              token: "Bearer " + token,
              user: {
                username: user.username,
                avatar: user.avatar,
              },
            });
          } else {
            res.status(400).send("Invalid login credentials");
          }
        });
      }
    } catch (error) {
      res.status(400).send(error);
    }
  }
});

module.exports = router;
