const rateLimit = require("express-rate-limit");
const tokennewpostLimit = rateLimit({
  //token limit for new post
  keyGenerator: (req) => req.headers["authorization"],
  windowMs: 1 * 60 * 1000, // 1 min
  message: "Post limit reached. Please wait 1 minute to post again.",
  max: 3, // limit to 3 requests every 1 min per windows
  skipFailedRequests: true,
});
const newpostLimit = rateLimit({
  //ip limit for new post
  windowMs: 1 * 60 * 1000, // 1 min
  max: 3, // limit to 3 requests every 1 min per windows
  message: "Post limit reached. Please wait 1 minute to post again.",
  skipFailedRequests: true,
});
const tokencommentlimit = rateLimit({
  keyGenerator: (req) => req.headers["authorization"],
  windowMs: 1 * 60 * 1000, // 1 min
  max: 4, // limit to 4 requests every 1 min per windows
  message: "Reply limit reached. Please wait 1 minute to reply again.", //err messasge
  skipFailedRequests: true,
});
const commentlimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 4, // limit to 4 requests every 1 min per windows
  message: "Reply limit reached. Please wait 1 minute to reply again.", //err messasge
  skipFailedRequests: true,
});

const tokennestedcommentlimit = rateLimit({
  keyGenerator: (req) => req.headers["authorization"],
  windowMs: 1 * 60 * 1000, // 1 min
  max: 4, // limit to 4 requests every 1 min per windows
  message: "Reply limit reached. Please wait 1 minute to reply again.", //err messasge
  skipFailedRequests: true,
});
const nestedcommentlimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 4, // limit to 4 requests every 1 min per windows
  message: "Reply limit reached. Please wait 1 minute to reply again.", //err messasge
  skipFailedRequests: true,
});
const followlimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 20, // limit to 20 requests every 1 min per windows
  message: "Follow limit reached. Please wait 1 minute to follow again.", //err messasge
  skipFailedRequests: true,
});
const likelimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 20, // limit to 20 requests every 1 min per windows
  message: "Like limit reached. Please wait 1 minute to like again.", //err messasge
  skipFailedRequests: true,
});
const registerlimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1, // limit to 1 requests every 1 min per windows
  message: "Register limit reached. Please wait 1 hour to register again.", //err messasge
  skipFailedRequests: true,
});
const editprofilelimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 4, // limit to 4 requests every 1 min per windows
  message: "Edit profile limit reached. Please wait 1 minute to edit again.", //err messasge
  skipFailedRequests: true,
});
const commentlikelimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 20, // limit to 20 requests every 1 min per windows
  message: "Like limit reached. Please wait 1 minute to like again.", //err messasge
  skipFailedRequests: true,
});
const nestedcommentlikelimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 20, // limit to 20 requests every 1 min per windows
  message: "Like limit reached. Please wait 1 minute to like again.", //err messasge
  skipFailedRequests: true,
});
const chatmessagelimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 15, // limit to 15 requests every 1 min per windows
  message:
    "You are sending messages too fast. Please wait 1 minute to send again.", //err messasge
  skipFailedRequests: true,
});
const tokenchatmessagelimit = rateLimit({
  keyGenerator: (req) => req.headers["authorization"],
  windowMs: 1 * 60 * 1000, // 1 min
  max: 15, // limit to 15 requests every 1 min per windows
  message:
    "You are sending messages too fast. Please wait 1 minute to send again.", //err messasge
  skipFailedRequests: true,
});
const editcommentlimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 4, // limit to 4 requests every 1 min per windows
  message: "Edit comment limit reached. Please wait 1 minute to edit again.", //err messasge
  skipFailedRequests: true,
});

const bookmarklimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 15, // limit to 15 requests every 1 min per windows
  message: "Bookmakr limit reached. Please wait 1 minute to like again.", //err messasge
  skipFailedRequests: true,
});
const newcommunitylimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 5, // limit to 15 requests every 1 min per windows
  message:
    "Creating community limit reached. Please wait 10 minutes to create again.", //err messasge
  skipFailedRequests: true,
});
const tokennewcommunitypostLimit = rateLimit({
  //token limit for new post
  keyGenerator: (req) => req.headers["authorization"],
  windowMs: 1 * 60 * 1000, // 1 min
  message: "Post limit reached. Please wait 1 minute to post again.",
  max: 3, // limit to 3 requests every 1 min per windows
  skipFailedRequests: true,
});
const newcommunitypostLimit = rateLimit({
  //ip limit for new post
  windowMs: 1 * 60 * 1000, // 1 min
  max: 3, // limit to 3 requests every 1 min per windows
  message: "Post limit reached. Please wait 1 minute to post again.",
  skipFailedRequests: true,
});
const resetPasswordtokenrequest = rateLimit({
  //ip limit for reset password token request
  windowMs: 1 * 60 * 1000, // 1 min
  max: 4, // limit to 4 requests every 1 min per windows
  message: "Request limit reached. Please wait 1 minute to request again.",
  skipFailedRequests: true,
});
module.exports = {
  tokennewcommunitypostLimit,
  newcommunitypostLimit,
  newcommunitylimit,
  newpostLimit,
  registerlimit,
  commentlimit,
  followlimit,
  likelimit,
  nestedcommentlimit,
  editprofilelimit,
  commentlikelimit,
  nestedcommentlikelimit,
  chatmessagelimit,
  tokennewpostLimit,
  tokenchatmessagelimit,
  tokencommentlimit,
  tokennestedcommentlimit,
  editcommentlimit,
  bookmarklimit,
  resetPasswordtokenrequest,
};
