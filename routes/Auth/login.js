"use strict";
require("dotenv").config();
const { users } = require("../../models");
const { compare } = require("bcryptjs");
const { sign } = require("jsonwebtoken");
const { sendmessage } = require("../../utils/discordbot");

const login = async (req, res) => {
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
        await compare(password, user.password).then(async (ismatch) => {
          if (ismatch) {
            const token = sign(
              {
                id: user.id,
              },
              // eslint-disable-next-line no-undef
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

            // eslint-disable-next-line no-undef
            if (process.env.NODE_ENV === "production") {
              //send discord message
              await sendmessage(
                req,
                `https://momosz.com/${user.username}`,
                "login"
              );
            }
            return;
          } else {
            return res.status(400).send("Invalid login credentials");
          }
        });
      }
    } catch (error) {
      return res.status(400).send(error);
    }
  }
};

module.exports = login;
