const rateLimit = require("express-rate-limit");
const newpostLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 5, // limit to 5 requests every 1 min per windows
  message: "Too many post requests. Please try again after 1 minute.", //err messasge
});

const signuplimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 15, // limit to 15 requests every 1 min per windows
  message: "Too many signup requests. Please try again after 2 minutes.", //err messasge
});

module.exports = { newpostLimit, signuplimit };
