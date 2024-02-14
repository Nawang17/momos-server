/* eslint-disable no-undef */
require("dotenv").config();
const iplocate = require("node-iplocate");
const requestIp = require("request-ip");
const sendmessage = async (req, message, type) => {
  const ip = requestIp.getClientIp(req)
    ? requestIp.getClientIp(req)
    : "209.122.203.50";
  const ipInformation = await iplocate(ip, {
    api_key: process.env.IPLOCATE_API_KEY,
  });

  const msg = `New ${type} - ${ipInformation?.ip} (is_proxy:${ipInformation?.threat?.is_proxy})\n`;

  // send discord message to momosbot
  try {
    await client?.users?.send(
      process.env.USERID,
      `${msg}${message?.replace(/@/g, "")} `
    );
  } catch (error) {
    console.log(error);
  }

  return;
};

const sendchannelmessage = async (message) => {
  //send message to momos server channel
  try {
    await client?.channels?.cache
      ?.get(process.env.CHANNEL_ID)
      ?.send(message?.replace(/@/g, ""));
  } catch (error) {
    console.log(error);
  }
  return;
};

module.exports = { sendmessage, sendchannelmessage };
