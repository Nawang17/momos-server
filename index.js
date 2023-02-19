"use strict";
require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
global.io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL],
  },
});
const db = require("./models");
const cors = require("cors");
const port = process.env.PORT || 3001;
app.use(
  cors({
    origin: [process.env.CLIENT_URL],
  })
);
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
} = require("./middleware/rateLimit");

const register = require("./routes/Auth/register");
const login = require("./routes/Auth/login");
const newpost = require("./routes/POST/newpost");
const homepost = require("./routes/GET/homepost");
const userinfo = require("./routes/GET/userinfo");
const deletepost = require("./routes/DELETE/deletepost");
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

app.use("/likedposts", tokenCheck, likedpost);
app.use("/likepost", tokenCheck, likelimit, likepost);
app.use("/deletepost", tokenCheck, deletepost);
app.use("/userinfo", tokenCheck, userinfo);
app.use("/homeposts", homepost);
app.use("/newpost", tokenCheck, newpostLimit, newpost);
app.use("/auth/login", login);
app.use("/auth/register", registerlimit, register);
app.use("/profileinfo", profileinfo);
app.use("/post", singlepost);
app.use("/newcomment", tokenCheck, commentlimit, newcomment);
app.use("/deletecomment", tokenCheck, deletecomment);
app.use("/newnestedcomment", tokenCheck, nestedcommentlimit, newnestedcomment);
app.use("/deletenestedcomment", tokenCheck, deletenestedcomment);
app.use("/notis", tokenCheck, notis);
app.use("/follow", tokenCheck, followlimit, follow);
app.use("/suggestedusers", suggestedusers);
app.use("/settingsinfo", tokenCheck, settingsinfo);
app.use("/search", search);
app.use("/leaderboard", leaderboard);
app.use("/likecomment", tokenCheck, commentlikelimit, likecomment);
app.use(
  "/likenestedcomment",
  tokenCheck,
  nestedcommentlikelimit,
  likenestedcomment
);
app.use("/userlevel", tokenCheck, userlevel);
app.use("/reposts", reposts);
app.use("/chat", tokenCheck, chat);

//initialize socket
const { verify } = require("jsonwebtoken");

let onlineusers = [];
io.on("connection", (socket) => {
  console.log("a user connected ", socket.id);

  socket.on("onlinestatus", async (data) => {
    if (data.token) {
      const token = data.token.split(" ")[1];
      verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          console.log("err", err);
          const userarr = onlineusers.map((user) => user.userid);
          io.emit("onlineusers", [...new Set(userarr)]);
        } else {
          onlineusers.push({ userid: user.id, socketid: socket.id });
          console.log("user added to online users list", onlineusers);
          const userarr = onlineusers.map((user) => user?.userid);
          io.emit("onlineusers", [...new Set(userarr)]);
        }
      });
    } else {
      const userarr = onlineusers.map((user) => user?.userid);
      io.emit("onlineusers", [...new Set(userarr)]);
    }
  });
  socket.on("removeOnlinestatus", async (data) => {
    if (data.token) {
      const token = data.token.split(" ")[1];
      verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          console.log("err", err);
        } else {
          onlineusers = onlineusers.filter((u) => u?.socketid !== socket?.id);

          const userarr = onlineusers.map((user) => user?.userid);
          io.emit("onlineusers", [...new Set(userarr)]);
        }
      });
    }
  });
  socket.on("joinroom", async (data) => {
    if (data.roomid !== undefined) {
      socket.join(data.roomid);
      console.log("user joined room", socket.rooms);
    }
  });
  socket.on("leaveroom", (data) => {
    if (data.roomid !== undefined) {
      socket.leave(data.roomid);
      console.log("user left room", socket.rooms);
    }
  });
  socket.on("sendmessage", (data) => {
    console.log(data);
    io.emit("newmessage", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    console.log("users count ", socket.adapter.sids.size);
    onlineusers = onlineusers.filter((user) => user.socketid !== socket.id);
    const userarr = onlineusers.map((user) => user.userid);
    io.emit("onlineusers", [...new Set(userarr)]);

    console.log("user removed from onlineusers", onlineusers);
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

app.get("/", (req, res) => {
  res.send("momos server ");
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
