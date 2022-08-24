"use strict";
const express = require("express");
const app = express();
const db = require("./models");
const cors = require("cors");
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(cors());
app.set("trust proxy", 1);
const { tokenCheck } = require("./middleware/tokenCheck");
const { newpostLimit } = require("./middleware/rateLimit");

const register = require("./routes/Auth/register");
const login = require("./routes/Auth/login");
const newpost = require("./routes/POST/newpost");
const homepost = require("./routes/GET/homepost");
const userinfo = require("./routes/GET/userinfo");
const deletepost = require("./routes/DELETE/deletepost");
const likepost = require("./routes/POST/likepost");
const likedpost = require("./routes/GET/likedpost");

app.use("/likedposts", tokenCheck, likedpost);
app.use("/likepost", tokenCheck, likepost);
app.use("/deletepost", tokenCheck, deletepost);
app.use("/userinfo", tokenCheck, userinfo);
app.use("/homeposts", homepost);
app.use("/newpost", tokenCheck, newpostLimit, newpost);
app.use("/auth/login", login);
app.use("/auth/register", register);

app.get("/", (req, res) => {
  res.send("Hello World");
});

db.sequelize.sync().then(() => {
  app.listen(port, async () => {
    console.log(`Server is listening on port ${port}`);
  });
});
