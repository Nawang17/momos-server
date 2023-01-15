require("dotenv").config();
const { users } = require("../models");
const { verify } = require("jsonwebtoken");
const tokenCheck = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).send("You are not logged in");
  }
  verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(401).send("Token is not valid");
    }
    const finduser = await users.findOne({
      where: {
        id: user.id,
      },
    });
    if (finduser) {
      if (finduser.status === "inactive") {
        return res.status(401).send("Your account is inactive");
      } else {
        req.user = {
          id: user.id,
          username: finduser?.username,
          avatar: finduser?.avatar,
          status: finduser?.status,
        };

        next();
      }
    } else {
      return res.status(401).send("User not found");
    }
  });
};
module.exports = { tokenCheck };
