/* eslint-disable no-undef */
"use strict";
require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { fn } = require("sequelize");
const { Server } = require("socket.io");
const requestIp = require("request-ip");
global.io = new Server(server, {
  cors: {
    origin: process.env.ORIGINS.split(" "),
  },
});
const db = require("./models");
const cors = require("cors");
const port = process.env.PORT || 3001;

// blacklist of IP addresses
const blacklist = process.env.BLACKLISTED_IPS.split(" ");

// a custom middleware to check if the incoming request is from a blacklisted IP address
const blacklistMiddleware = (req, res, next) => {
  const ip = requestIp.getClientIp(req);
  if (blacklist.includes(ip)) {
    return res.status(403).send("Access denied");
  }
  next();
};

app.use(
  cors({
    origin: process.env.ORIGINS.split(" "),
  })
);
app.use(blacklistMiddleware);
app.set("trust proxy", 4);
app.use(express.json({ limit: "42mb" }));
app.use(express.urlencoded({ limit: "42mb", extended: true }));
const { tokenCheck } = require("./middleware/tokenCheck");
const {
  newpostLimit,
  commentlimit,
  followlimit,
  likelimit,
  nestedcommentlimit,
  registerlimit,
  commentlikelimit,
  nestedcommentlikelimit,
  tokennewpostLimit,
  editcommentlimit,
  tokencommentlimit,
  tokennestedcommentlimit,
  bookmarklimit,
  newcommunitypostLimit,
  tokennewcommunitypostLimit,
} = require("./middleware/rateLimit");

const register = require("./routes/Auth/register");
const login = require("./routes/Auth/login");
const googleauth = require("./routes/Auth/Googleauth");
const newpost = require("./routes/POST/newpost");
const homepost = require("./routes/GET/homepost");
const userinfo = require("./routes/GET/userinfo");
const deletepost = require("./routes/DELETE/deletepost");
const pollvote = require("./routes/POST/pollvote");
const likepost = require("./routes/POST/likepost");
const likedpost = require("./routes/GET/likedpost");
const profileinfo = require("./routes/GET/profileinfo");
const singlepost = require("./routes/GET/singlepost");
const newcomment = require("./routes/POST/newcomment");
const deletecomment = require("./routes/DELETE/deletecomment");
const newnestedcomment = require("./routes/POST/newNestedComment");
const deletenestedcomment = require("./routes/DELETE/deletenestedcomment");
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
const editcomment = require("./routes/UPDATE/editcomments");
const editnestedcomment = require("./routes/UPDATE/editnestedcomments");
const bookmarkpost = require("./routes/POST/newbookmark");
const adminroute = require("./routes/Admin/admin");
const newCommunity = require("./routes/POST/newCommunity");
const getcommunity = require("./routes/GET/communities");
const newCommunitypost = require("./routes/POST/newCommunityPost");
const getnews = require("./routes/GET/news");
app.use("/likedposts", tokenCheck, likedpost);
app.use("/likepost", tokenCheck, likelimit, likepost);
app.use("/pollvote", tokenCheck, pollvote);
app.use("/deletepost", tokenCheck, deletepost);
app.use("/userinfo", tokenCheck, userinfo);
app.use("/homeposts", homepost);
app.use(
  "/newpost",

  tokenCheck,
  tokennewpostLimit,
  newpostLimit,
  newpost
);
app.use("/auth/login", login);
app.use("/auth/register", registerlimit, register);
app.use("/auth/google", googleauth);
app.use("/profileinfo", profileinfo);
app.use("/post", singlepost);
app.use(
  "/newcomment",

  tokenCheck,
  tokencommentlimit,
  commentlimit,
  newcomment
);
app.use("/deletecomment", tokenCheck, deletecomment);
app.use(
  "/newnestedcomment",

  tokenCheck,
  tokennestedcommentlimit,
  nestedcommentlimit,
  newnestedcomment
);
app.use(
  "/deletenestedcomment",

  tokenCheck,
  deletenestedcomment
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
app.use("/chat", tokenCheck, chat);
app.use("/editcomment", tokenCheck, editcommentlimit, editcomment);
app.use("/editnestedcomment", tokenCheck, editcommentlimit, editnestedcomment);
app.use("/bookmarkpost", tokenCheck, bookmarklimit, bookmarkpost);
app.use("/admin", tokenCheck, adminroute);
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

//initialize socket
const { verify } = require("jsonwebtoken");
const { users } = require("./models");
const cache = require("./utils/cache");

global.onlineusers = [];
io.on("connection", (socket) => {
  console.log("a user connected ", socket.id);

  socket.on("onlinestatus", (data) => {
    if (data.token) {
      const token = data.token.split(" ")[1];
      verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
          console.log("online status error: ", err);
          const userarr = onlineusers?.filter((obj, index, self) => {
            return index === self.findIndex((o) => o.username === obj.username);
          });
          io.emit("onlineusers", userarr);
        } else {
          const finduser = await users.findOne({
            where: {
              id: user?.id,
            },
          });
          onlineusers.push({
            userid: finduser?.id,
            username: finduser?.username,
            avatar: finduser?.avatar,
            description: finduser?.description,
            socketid: socket.id,
          });
          console.log(finduser?.username, "is online");
          const userarr = onlineusers?.filter((obj, index, self) => {
            return index === self.findIndex((o) => o.username === obj.username);
          });
          io.emit("onlineusers", userarr);
        }
      });
    } else {
      const userarr = onlineusers?.filter((obj, index, self) => {
        return index === self.findIndex((o) => o.username === obj.username);
      });
      io.emit("onlineusers", userarr);
    }
  });
  socket.on("removeOnlinestatus", (data) => {
    if (data.token) {
      const token = data.token.split(" ")[1];
      verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
          console.log("remove online status error: ", err);
        } else {
          //change lastseen value to curretn time for user in database but only if there is single value of user in onlineusers array
          const findUser = onlineusers?.filter((obj, index, self) => {
            return index === self.findIndex((o) => o.username === obj.username);
          });
          if (findUser.length === 1 && findUser[0].userid !== undefined) {
            users.update(
              {
                lastseen: fn("NOW"),
              },
              {
                where: {
                  id: user?.id,
                },
              }
            );
            cache.del(`profileinfo:${findUser[0].username}`);
          }

          onlineusers = onlineusers.filter((u) => u?.socketid !== socket?.id);
          console.log("user disconnected");
          const userarr = onlineusers?.filter((obj, index, self) => {
            return index === self.findIndex((o) => o.username === obj.username);
          });
          io.emit("onlineusers", userarr);
        }
      });
    }
  });
  socket.on("joinroom", (data) => {
    if (data.roomid !== undefined) {
      socket.join(data.roomid);
    }
  });
  socket.on("leaveroom", (data) => {
    if (data.roomid !== undefined) {
      socket.leave(data.roomid);
    }
  });
  socket.on("sendmessage", (data) => {
    io.emit("newmessage", data);
  });

  socket.on("disconnect", () => {
    //change lastseen value to curretn time for user in database but only if there is single value of user in onlineusers array

    const findUser = onlineusers?.filter((obj, index, self) => {
      return index === self.findIndex((o) => o.username === obj.username);
    });
    if (findUser.length === 1 && findUser[0].userid !== undefined) {
      users.update(
        {
          lastseen: fn("NOW"),
        },
        {
          where: {
            id: findUser[0].userid,
          },
        }
      );
      cache.del(`profileinfo:${findUser[0].username}`);
    }
    onlineusers = onlineusers.filter((user) => user.socketid !== socket.id);

    const userarr = onlineusers?.filter((obj, index, self) => {
      return index === self.findIndex((o) => o.username === obj.username);
    });
    io.emit("onlineusers", userarr);
    console.log("user disconnected");
  });
});

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
