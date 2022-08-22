require("dotenv").config();

const { verify } = require("jsonwebtoken");
const tokenCheck = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({
      message: "No token, authorization denied",
    });
  }
  verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        message: "Token is not valid",
      });
    }
    req.user = user;
    next();
  });
};
module.exports = { tokenCheck };
