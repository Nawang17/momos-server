/* eslint-disable no-undef */
"use strict";
require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const initializeSocket = require("./utils/socket");
const blacklistMiddleware = require("./middleware/blackListedIps");
const db = require("./models");
const cors = require("cors");
const port = process.env.PORT || 3001;

global.io = new Server(server, {
  cors: {
    origin: process.env.ORIGINS.split(" "),
  },
});
app.use(
  cors({
    origin: process.env.ORIGINS.split(" "),
  })
);
app.use(blacklistMiddleware); // check if the incoming request is from a blacklisted IP address
app.set("trust proxy", 4); // proxy for render server
app.use(express.json({ limit: "42mb" }));
app.use(express.urlencoded({ limit: "42mb", extended: true }));
const { tokenCheck } = require("./middleware/tokenCheck");
const {
  newpostLimit,
  commentlimit,
  followlimit,
  likelimit,
  nestedcommentlimit,
  commentlikelimit,
  nestedcommentlikelimit,
  tokennewpostLimit,
  tokencommentlimit,
  tokennestedcommentlimit,
  bookmarklimit,
  newcommunitypostLimit,
  tokennewcommunitypostLimit,
} = require("./middleware/rateLimit");

const newpost = require("./routes/POST/newpost");
const homepost = require("./routes/GET/homepost");
const userinfo = require("./routes/GET/userinfo");
const pollvote = require("./routes/POST/pollvote");
const likepost = require("./routes/POST/likepost");
const likedpost = require("./routes/GET/likedpost");
const profileinfo = require("./routes/GET/profileinfo");
const singlepost = require("./routes/GET/singlepost");
const newcomment = require("./routes/POST/newcomment");
const newnestedcomment = require("./routes/POST/newNestedComment");
const notis = require("./routes/GET/notis");
const follow = require("./routes/POST/follow");
const suggestedusers = require("./routes/GET/suggestedusers");
const settingsinfo = require("./routes/GET/settingsinfo");
const search = require("./routes/GET/search");
const leaderboard = require("./routes/GET/leaderboard");
const likecomment = require("./routes/POST/likecomment");
const likenestedcomment = require("./routes/POST/likenestedcomment");
const userlevel = require("./routes/GET/userlevel");
const reposts = require("./routes/GET/reposts");
const chat = require("./routes/chat/chat");
const bookmarkpost = require("./routes/POST/newbookmark");
const newCommunity = require("./routes/POST/newCommunity");
const getcommunity = require("./routes/GET/communities");
const newCommunitypost = require("./routes/POST/newCommunityPost");
const getnews = require("./routes/GET/news");
const userSettings = require("./routes/USETTINGS/userSettings");
const auth = require("./routes/Auth/auth");
const deletetions = require("./routes/DELETE/delete");
const updates = require("./routes/UPDATE/update");
const admin = require("./routes/Admin/admin");
const {
  addPostTranslations,
  sendMonthlySummarySchdeule,
} = require("./utils/cronjobs");
// add post translations every 15 minutes cron job
addPostTranslations.start();
// send monthly summary every last of the month cron job
sendMonthlySummarySchdeule.start();

app.use("/likedposts", tokenCheck, likedpost);
app.use("/likepost", tokenCheck, likelimit, likepost);
app.use("/pollvote", tokenCheck, pollvote);
app.use("/userinfo", tokenCheck, userinfo);
app.use("/homeposts", homepost);
app.use(
  "/newpost",

  tokenCheck,
  tokennewpostLimit,
  newpostLimit,
  newpost
);
// route for authenctication
app.use("/auth", auth);

//route for admin

app.use("/admin", tokenCheck, admin);

//route for chat
app.use("/chat", tokenCheck, chat);

//route for deletions

app.use("/", deletetions);

//route for user settings
app.use("/usersettings", tokenCheck, userSettings);

//route for updating comments and nested comments

app.use("/", updates);

app.use("/profileinfo", profileinfo);
app.use("/post", singlepost);
app.use(
  "/newcomment",

  tokenCheck,
  tokencommentlimit,
  commentlimit,
  newcomment
);
app.use(
  "/newnestedcomment",

  tokenCheck,
  tokennestedcommentlimit,
  nestedcommentlimit,
  newnestedcomment
);

app.use("/notis", tokenCheck, notis);
app.use("/follow", tokenCheck, followlimit, follow);
app.use("/suggestedusers", suggestedusers);
app.use("/settingsinfo", tokenCheck, settingsinfo);
app.use("/search", search);
app.use("/leaderboard", leaderboard);
app.use(
  "/likecomment",

  tokenCheck,
  commentlikelimit,
  likecomment
);
app.use(
  "/likenestedcomment",

  tokenCheck,
  nestedcommentlikelimit,
  likenestedcomment
);
app.use("/userlevel", tokenCheck, userlevel);
app.use("/reposts", reposts);
app.use("/bookmarkpost", tokenCheck, bookmarklimit, bookmarkpost);

app.use("/newcommunity", tokenCheck, newCommunity);
app.use("/getcommunities", getcommunity);
app.use(
  "/newcommunitypost",
  tokenCheck,
  tokennewcommunitypostLimit,
  newcommunitypostLimit,
  newCommunitypost
);
app.use("/news", getnews);

global.onlineusers = []; // array to store online users

//initialize Socket
initializeSocket();

const {
  Client,
  Events,
  ActivityType,
  GatewayIntentBits,
} = require("discord.js");

// Create a new client instance
//global is used to make the client available to all files
global.client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
global.client.once(Events.ClientReady, (c) => {
  console.log(`Discord bot ready! Logged in as ${c.user.tag}`);

  c.user.setPresence({
    activities: [{ name: "momosz.com", type: ActivityType.Watching }],
  });
});

// Log in to Discord with your client's token
global.client.login(process.env.DISCORD_BOT_TOKEN);

app.get("/", async (req, res) => {
  res.send("momos api");
});

// force: true
db.sequelize
  .sync()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
