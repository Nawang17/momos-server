"use strict";
const router = require("express").Router();
const { chatrooms, users, chats } = require("../../models");
const { Op } = require("sequelize");
const {
  chatmessagelimit,
  tokenchatmessagelimit,
} = require("../../middleware/rateLimit");
const createnewchatroom = require("./newchatroom");
router.get("/:id1", async (req, res) => {
  try {
    let chatroomid = "";
    const userId1 = req.params.id1;
    const userId2 = req.user.id;

    if (!userId1 || !userId2) return res.status(400).send("no id provided");
    const findchatroom = await chatrooms.findOne({
      where: {
        [Op.or]: [
          { roomid: `${userId1}-${userId2}` },
          { roomid: `${userId2}-${userId1}` },
        ],
      },
    });
    if (findchatroom) {
      chatroomid = findchatroom.roomid;
    }
    if (!findchatroom) {
      const finduser1 = await users.findOne({
        where: {
          id: userId1,
        },
      });

      if (!finduser1) return res.status(400).send("user not found");
      chatroomid = await createnewchatroom(userId1, userId2);
      console.log("new chatroom created" + ": " + `${userId1}-${userId2}`);
    }

    return res.status(200).send({
      chatroomid: chatroomid,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

router.get("/getchatmessages/:roomid/:page", async (req, res) => {
  try {
    const chatroomid = req.params.roomid;
    if (!chatroomid) return res.status(400).send("no room id provided");
    const page = parseInt(req.params.page ? req.params.page : 0);

    const findchatmessages = await chatrooms.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { roomid: chatroomid },
              { roomid: chatroomid.split("-").reverse().join("-") },
            ],
          },
          {
            [Op.or]: [{ user1: req.user.id }, { user2: req.user.id }],
          },
        ],
      },

      include: [
        {
          model: users,
          as: "userone",
          attributes: ["username", "avatar", "verified", "id"],
        },

        {
          model: users,
          as: "usertwo",

          attributes: ["username", "avatar", "verified", "id"],
        },
        {
          model: chats,
          limit: 7,
          offset: page * 7,
          order: [["id", "DESC"]],

          include: [
            {
              model: users,

              attributes: ["username", "avatar", "verified", "id"],
            },
          ],
        },
      ],
    });

    if (!findchatmessages) {
      return res.status(400).send("chatroom not found");
    }
    let chatmsgcount;
    await chats
      .count({
        where: {
          chatroomid: findchatmessages?.id,
        },
      })
      .then((c) => {
        chatmsgcount = c;
      });

    return res.status(200).send({
      chatmessages: findchatmessages,
      chatmsgcount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

router.get("/get/chatrooms", async (req, res) => {
  try {
    const getchatrooms = await chatrooms.findAll({
      where: {
        [Op.or]: [{ user1: req.user.id }, { user2: req.user.id }],
      },
      include: [
        {
          model: users,
          as: "userone",
          attributes: ["username", "avatar", "verified", "id"],
        },

        {
          model: users,
          as: "usertwo",

          attributes: ["username", "avatar", "verified", "id"],
        },
        {
          model: chats,
          order: [["createdAt", "DESC"]],
          limit: 1,
          include: [
            {
              model: users,

              attributes: ["username", "avatar", "verified", "id"],
            },
          ],
        },
      ],
    });
    res.status(200).send({ chatrooms: getchatrooms });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

router.post(
  "/sendmessage",
  tokenchatmessagelimit,
  chatmessagelimit,
  async (req, res) => {
    try {
      const { chatroomid, message } = req.body;
      if (!chatroomid || !message)
        return res.status(400).send("no room id or message provided");
      if (message.trim().length === 0) {
        return res.status(400).send("message cannot be empty");
      }
      if (message.length > 500) {
        return res
          .status(400)
          .send("message cannot be more than 500 characters");
      }
      const findchatroom = await chatrooms.findOne({
        where: {
          id: chatroomid,
          [Op.or]: [{ user1: req.user.id }, { user2: req.user.id }],
        },
      });
      if (!findchatroom) return res.status(400).send("chatroom not found");
      const newmessage = await chats.create({
        message: message,
        userid: req.user.id,
        chatroomid: findchatroom.id,
      });
      const findnewmessage = await chats.findOne({
        where: {
          id: newmessage.id,
        },
        include: [
          {
            model: users,
            attributes: ["username", "avatar", "verified", "id"],
          },
        ],
      });
      if (!findnewmessage) return res.status(500).send("something went wrong");
      // eslint-disable-next-line no-undef
      io.in(findchatroom.roomid).emit("newmessage", findnewmessage);
      return res.status(200).send({ message: findnewmessage });
    } catch (error) {
      console.log(error);
      return res.status(500).send("Something went wrong");
    }
  }
);

router.delete("/deletemessage/:msgid", async (req, res) => {
  try {
    const msgid = req.params.msgid;
    if (!msgid) return res.status(400).send("no message id provided");
    const findmessage = await chats.findOne({
      where: {
        id: msgid,
        userid: req.user.id,
      },
    });
    if (!findmessage) return res.status(400).send("message not found");
    await chats.destroy({
      where: {
        id: msgid,
      },
    });
    return res.status(200).send("message deleted");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
