/* eslint-disable no-undef */
"use strict";
require("dotenv").config();
const { users, profilebanners } = require("../../models");
const bcrypt = require("bcryptjs");
const { sign } = require("jsonwebtoken");
var Filterer = require("bad-words");
var filter = new Filterer();
const { restrictednames } = require("../../utils/restrictedusernames");
const { avatarColor } = require("../../utils/randomColor");

const { sendmessage, sendchannelmessage } = require("../../utils/discordbot");
const { isValidEmail } = require("../../utils/validations");
const register = async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    res.status(400).send("Please fill all fields");
  } else if (/^\s*$/.test(username) || /^\s*$/.test(password)) {
    res.status(400).send("Please fill all fields");
  } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
    res.status(400).send("Username can only contain letters and numbers");
  } else if (username.length < 4 || username.length > 15) {
    res.status(400).send("Username must be between 4 and 15 characters");
  } else if (!/^(?=.*[a-zA-Z]).+$/g.test(username)) {
    return res.status(400).send("Username must contain at least one letter");
  } else if (restrictednames.includes(username.toUpperCase())) {
    return res.status(400).send("Username is not available");
  } else if (password.length < 6) {
    return res.status(400).send("Password must be at least 6 characters");
  } else if (filter.isProfane(username)) {
    return res.status(400).send("Username is not available");
  } else {
    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).send("Invalid email format");
      }
    }
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
            email: email ? email : null,
          });
        });
        if (newUser) {
          const token = sign(
            {
              id: newUser.id,
            },
            process.env.JWT_SECRET
          );
          const banner = `https://ui-avatars.com/api/?background=${randomAvatarColor}&color=fff&name=&size=1920`; // create banner url

          await profilebanners.create({
            imageurl: banner,
            userid: newUser?.id,
          }); // create banner in db
          res.status(201).send({
            message: `Account created successfully.Welcome to momos.`,
            token: "Bearer " + token,
            user: {
              username,
              avatar,
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
              "account"
            );
          }

          return;
        } else {
          res.status(400).send("Something went wrong");
        }
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send("Something went wrong");
    }
  }
};

module.exports = register;
