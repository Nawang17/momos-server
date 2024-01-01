/* eslint-disable no-undef */
require("dotenv").config();
const { verify } = require("jsonwebtoken");
const { users } = require("../models");
const cache = require("./cache");
const { fn } = require("sequelize");

//initialize socket
const initializeSocket = () => {
  io.on("connection", (socket) => {
    console.log("a user connected ", socket.id);

    socket.on("onlinestatus", (data) => {
      if (data.token) {
        const token = data.token.split(" ")[1];
        verify(token, process.env.JWT_SECRET, async (err, user) => {
          if (err) {
            console.log("online status error: ", err);
            const userarr = onlineusers?.filter((obj, index, self) => {
              return (
                index === self.findIndex((o) => o.username === obj.username)
              );
            });
            io.emit("onlineusers", userarr);
          } else {
            const finduser = await users.findOne({
              where: {
                id: user?.id,
              },
            });
            onlineusers.push({
              userid: finduser?.id,
              username: finduser?.username,
              avatar: finduser?.avatar,
              description: finduser?.description,
              socketid: socket.id,
            });
            console.log(finduser?.username, "is online");
            const userarr = onlineusers?.filter((obj, index, self) => {
              return (
                index === self.findIndex((o) => o.username === obj.username)
              );
            });
            io.emit("onlineusers", userarr);
          }
        });
      } else {
        const userarr = onlineusers?.filter((obj, index, self) => {
          return index === self.findIndex((o) => o.username === obj.username);
        });
        io.emit("onlineusers", userarr);
      }
    });
    socket.on("removeOnlinestatus", (data) => {
      if (data.token) {
        const token = data.token.split(" ")[1];
        verify(token, process.env.JWT_SECRET, async (err, user) => {
          if (err) {
            console.log("remove online status error: ", err);
          } else {
            //change lastseen value to curretn time for user in database but only if there is single value of user in onlineusers array
            const findUser = onlineusers?.filter((obj, index, self) => {
              return (
                index === self.findIndex((o) => o.username === obj.username)
              );
            });
            if (findUser.length === 1 && findUser[0].userid !== undefined) {
              users.update(
                {
                  lastseen: fn("NOW"),
                },
                {
                  where: {
                    id: user?.id,
                  },
                }
              );
              cache.del(`profileinfo:${findUser[0].username}`);
            }

            onlineusers = onlineusers.filter((u) => u?.socketid !== socket?.id);
            console.log("user disconnected");
            const userarr = onlineusers?.filter((obj, index, self) => {
              return (
                index === self.findIndex((o) => o.username === obj.username)
              );
            });
            io.emit("onlineusers", userarr);
          }
        });
      }
    });
    socket.on("joinroom", (data) => {
      if (data.roomid !== undefined) {
        socket.join(data.roomid);
      }
    });
    socket.on("leaveroom", (data) => {
      if (data.roomid !== undefined) {
        socket.leave(data.roomid);
      }
    });
    socket.on("sendmessage", (data) => {
      io.emit("newmessage", data);
    });

    socket.on("disconnect", () => {
      //change lastseen value to curretn time for user in database but only if there is single value of user in onlineusers array

      const findUser = onlineusers?.filter((obj, index, self) => {
        return index === self.findIndex((o) => o.username === obj.username);
      });
      if (findUser.length === 1 && findUser[0].userid !== undefined) {
        users.update(
          {
            lastseen: fn("NOW"),
          },
          {
            where: {
              id: findUser[0].userid,
            },
          }
        );
        cache.del(`profileinfo:${findUser[0].username}`);
      }
      onlineusers = onlineusers.filter((user) => user.socketid !== socket.id);

      const userarr = onlineusers?.filter((obj, index, self) => {
        return index === self.findIndex((o) => o.username === obj.username);
      });
      io.emit("onlineusers", userarr);
      console.log("user disconnected");
    });
  });
};

module.exports = initializeSocket;
