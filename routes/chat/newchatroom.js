"use strict";

const { chatrooms } = require("../../models");

const createnewchatroom = async (id1, id2) => {
  try {
    const newchatroom = await chatrooms.create({
      roomid: `${id1}-${id2}`,
      user1: id1,
      user2: id2,
    });
    return newchatroom.roomid;
  } catch (error) {
    console.log(error);
    return;
  }
};
module.exports = createnewchatroom;
