require("dotenv").config();

const requestIp = require("request-ip");

// list blacklisted  IP addresses

// eslint-disable-next-line no-undef
const blacklist = process.env.BLACKLISTED_IPS.split(" ");

//  check if the incoming request is from a blacklisted IP address

const blacklistMiddleware = (req, res, next) => {
  const ip = requestIp.getClientIp(req);
  if (blacklist.includes(ip)) {
    return res.status(403).send("Access denied");
  }
  next();
};

module.exports = blacklistMiddleware;
