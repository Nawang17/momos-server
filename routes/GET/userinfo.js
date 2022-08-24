"use strict";
const router = require("express").Router();

router.get("/", (req, res) => {
  res.status(200).send({
    message: "user retrieved successfully",
    user: {
      username: req.user.username,
      avatar: req.user.avatar,
    },
  });
});

module.exports = router;
