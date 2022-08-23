require("dotenv").config();
const { users } = require("../models");
const { verify } = require("jsonwebtoken");
const tokenCheck = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).send("No token, authorization denied");
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
    if (finduser.status === "active") {
      req.user = {
        id: user.id,
        username: finduser.username,
        avatar: finduser.avatar,
      };
      next();
    } else {
      return res
        .status(401)
        .send("Your account is restricted to perform this action");
    }
  });
};
module.exports = { tokenCheck };
