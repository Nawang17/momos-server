"use strict";
const express = require("express");
const app = express();
const db = require("./models");
const cors = require("cors");
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(cors());
app.set("trust proxy", 1);

const register = require("./routes/Auth/register");
const login = require("./routes/Auth/login");

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
