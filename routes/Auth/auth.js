const router = require("express").Router();
("use strict");

const { registerlimit } = require("../../middleware/rateLimit");

const googleAuth = require("./Googleauth");
const login = require("./login");
const register = require("./register");

//routes for auth
router.post("/google", googleAuth);
router.post("/login", login);
router.post("/register", registerlimit, register);

module.exports = router;
