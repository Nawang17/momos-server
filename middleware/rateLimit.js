const rateLimit = require("express-rate-limit");
const newpostLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 5, // limit to 5 requests every 1 min per windows
  message: "Too many posts created. Please wait 1 minute to create a new post.", //err messasge
  skipFailedRequests: true,
});

const commentlimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 5, // limit to 5 requests every 1 min per windows
  message:
    "Too many replies created. Please wait 1 minute to write a new reply.", //err messasge
  skipFailedRequests: true,
});
const nestedcommentlimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 5, // limit to 5 requests every 1 min per windows
  message:
    "Too many replies created. Please wait 1 minute to write a new reply.", //err messasge
  skipFailedRequests: true,
});
const followlimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 25, // limit to 25 requests every 1 min per windows
  message: "Too many follow requests. Please wait 1 minute.", //err messasge
  skipFailedRequests: true,
});
const likelimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 50, // limit to 35 requests every 1 min per windows
  message: "Too many like requests. Please wait 1 minute.", //err messasge
  skipFailedRequests: true,
});
const registerlimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // limit to 2 requests every 1 min per windows
  message: "Too many accounts created, please try again after an hour", //err messasge
  skipFailedRequests: true,
});

module.exports = {
  newpostLimit,
  registerlimit,
  commentlimit,
  followlimit,
  likelimit,
  nestedcommentlimit,
};
