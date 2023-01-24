require("dotenv").config();
const geoip = require("geoip-lite");
const requestIp = require("request-ip");
const sendmessage = async (req, message, type) => {
  const ip = requestIp.getClientIp(req)
    ? requestIp.getClientIp(req)
    : "209.122.203.50";
  const msg = `New ${type} - ${geoip.lookup(ip).city}, ${
    geoip.lookup(ip).country
  } (${ip})\n`;

  // send discord message

  await client.users.send(process.env.USERID, `${msg}${message} `);
  return;
};

const sendchannelmessage = async (message) => {
  //send message to momos server channel
  await client.channels.cache.get(process.env.CHANNEL_ID).send(message);
};

module.exports = { sendmessage, sendchannelmessage };
