"use strict";
const express = require("express");
const app = express();
const db = require("./models");
const cors = require("cors");
const port = process.env.PORT || 3001;
app.use(cors());
app.set("trust proxy", 1);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const { tokenCheck } = require("./middleware/tokenCheck");
const { newpostLimit, commentlimit } = require("./middleware/rateLimit");

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

app.use("/likedposts", tokenCheck, likedpost);
app.use("/likepost", tokenCheck, likepost);
app.use("/deletepost", tokenCheck, deletepost);
app.use("/userinfo", tokenCheck, userinfo);
app.use("/homeposts", homepost);
app.use("/newpost", tokenCheck, newpostLimit, newpost);
app.use("/auth/login", login);
app.use("/auth/register", register);
app.use("/profileinfo", profileinfo);
app.use("/post", singlepost);
app.use("/newcomment", tokenCheck, commentlimit, newcomment);
app.use("/deletecomment", tokenCheck, deletecomment);
app.use("/newnestedcomment", tokenCheck, newnestedcomment);
app.use("/deletenestedcomment", tokenCheck, deletenestedcomment);
app.use("/notis", tokenCheck, notis);

app.get("/", (req, res) => {
  res.send("Hello World");
});

db.sequelize.sync().then(() => {
  app.listen(port, async () => {
    console.log(`Server is listening on port ${port}`);
  });
});
