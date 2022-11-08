const rateLimit = require("express-rate-limit");
const newpostLimit = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 min
  max: 6, // limit to 5 requests every 2 min per windows
  message: "Too many posts created. Please wait 2 minute to create a new post.", //err messasge
});

const commentlimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 5, // limit to 5 requests every 1 min per windows
  message:
    "Too many replies created. Please wait 1 minute to write a new reply.", //err messasge
});
const nestedcommentlimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 5, // limit to 5 requests every 1 min per windows
  message:
    "Too many replies created. Please wait 1 minute to write a new reply.", //err messasge
});
const followlimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 25, // limit to 30 requests every 1 min per windows
  message: "Too many follow requests. Please wait 1 minute.", //err messasge
});
const likelimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 35, // limit to 35 requests every 1 min per windows
  message: "Too many like requests. Please wait 1 minute.", //err messasge
});
const registerlimit = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 min
  max: 6, // limit to 6 requests every 1 min per windows
  message: "Too many signup requests. Please try again after 30 minutes.", //err messasge
});

module.exports = {
  newpostLimit,
  registerlimit,
  commentlimit,
  followlimit,
  likelimit,
  nestedcommentlimit,
};
