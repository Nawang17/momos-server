"use strict";
const router = require("express").Router();
const { users, profilebanners } = require("../../models");
const { cloudinary } = require("../../utils/cloudinary");
const { getColorFromURL } = require("color-thief-node");
var Filterer = require("bad-words");
var filter = new Filterer();
const { editprofilelimit } = require("../../middleware/rateLimit");
const { restrictednames } = require("../../utils/restrictedusernames");
const { deleteallcache } = require("../../utils/deletecache");
const validator = require("validator");

router.get("/editprofileinfo", async (req, res) => {
  const { id } = req.user;
  try {
    const userInfo = await users.findOne({
      where: {
        id: id,
      },
      attributes: ["username", "description", "avatar", "verified", "link"],
      include: [
        {
          model: profilebanners,
          attributes: ["imageurl"],
        },
      ],
    });
    if (!userInfo) {
      return res.status(400).send("User not found");
    } else {
      return res.status(200).send({
        message: "userinfo retrieved successfully",
        userInfo,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send("Something went wrong");
  }
});

router.put("/updateprofileinfo", editprofilelimit, async (req, res) => {
  const { username, description, avatar, banner, link } = req.body;
  const { id } = req.user;
  try {
    const finduser = await users.findOne({
      where: {
        id: id,
      },
    });
    if (!finduser) {
      return res.status(400).send("User not found");
    } else {
      let imguploadedResponse;
      let banneruploadedResponse;
      if (!username) {
        return res
          .status(400)
          .send("Username must be between 4 and 15 characters");
      }
      if (username) {
        if (!/^[a-zA-Z0-9]+$/.test(username)) {
          return res
            .status(400)
            .send("Username can only contain letters and numbers");
        }
        if (username.length < 4 || username.length > 15) {
          return res
            .status(400)
            .send("Username must be between 4 and 15 characters");
        }
        if (restrictednames.includes(username.toUpperCase())) {
          return res.status(400).send("Username is not available");
        }
        if (filter.isProfane(username)) {
          return res.status(400).send("Username is not available");
        }
        const finduserwithname = await users.findOne({
          where: {
            username: username,
          },
        });
        if (finduserwithname) {
          if (finduserwithname?.id !== id) {
            return res
              .status(400)
              .send("Username is taken, please choose another one");
          }
        } else {
          if (username !== finduser?.username) {
            if (finduser?.username === "Demo") {
              return res
                .status(400)
                .send("Username cannot be changed for demo account");
            } else {
              try {
                await users.update(
                  {
                    username: username,
                  },
                  {
                    where: {
                      id: id,
                    },
                  }
                );
                console.log("username updated successfully");
              } catch (error) {
                console.log(error);
                return res.status(400).send("Something went wrong");
              }
            }
          }
        }
      }
      if (link?.length > 100) {
        return res.status(400).send("Link must be less than 100 characters");
      }
      if (link.length > 0) {
        if (!validator.isURL(link)) {
          return res.status(400).send("Invalid link");
        }
        if (link !== finduser?.link) {
          try {
            await users.update(
              {
                link: link,
              },
              {
                where: {
                  id: id,
                },
              }
            );
            console.log("link updated successfully");
          } catch (error) {
            console.log(error);
            return res.status(400).send("Something went wrong");
          }
        }
      } else {
        try {
          await users.update(
            {
              link: link,
            },
            {
              where: {
                id: id,
              },
            }
          );
          console.log("link updated successfully");
        } catch (error) {
          console.log(error);
          return res.status(400).send("Something went wrong");
        }
      }
      if (description?.length > 160) {
        return res
          .status(400)
          .send("Description must be less than 161 characters");
      }
      if (
        description?.trim().replace(/(\r\n|\n|\r)/gm, "") !==
        finduser?.description
      ) {
        try {
          await users.update(
            {
              description: description?.trim().replace(/(\r\n|\n|\r)/gm, ""),
            },
            {
              where: {
                id: id,
              },
            }
          );
          console.log("description updated successfully");
        } catch (error) {
          console.log(error);
          return res.status(400).send("Something went wrong");
        }
      }
      if (banner) {
        const findprofilebanner = await profilebanners.findOne({
          where: {
            userid: id,
          },
        });
        try {
          banneruploadedResponse = await cloudinary.uploader.upload(banner, {
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          });
        } catch (error) {
          return res.status(500).send("error uploading image to cloudinary");
        }
        if (findprofilebanner?.imagekey) {
          await cloudinary.uploader.destroy(findprofilebanner.imagekey),
            (err, result) => {
              if (err) {
                return res.status(500).send("error deleting old banner");
              }
            };
        }
        if (banneruploadedResponse) {
          if (!findprofilebanner) {
            try {
              await profilebanners.create({
                userid: id,
                imageurl: banneruploadedResponse?.secure_url,
                imagekey: banneruploadedResponse?.public_id,
              });
              console.log("banner created successfully");
            } catch (error) {
              console.log(error);
              return res.status(400).send("Something went wrong");
            }
          } else {
            try {
              await profilebanners.update(
                {
                  imageurl: banneruploadedResponse?.secure_url,
                  imagekey: banneruploadedResponse?.public_id,
                },
                {
                  where: {
                    userid: id,
                  },
                },
                {
                  multi: true,
                }
              );

              console.log("banner updated successfully");
            } catch (error) {
              console.log(error);
              return res.status(400).send("Something went wrong");
            }
          }
        }
      }
      if (avatar) {
        try {
          imguploadedResponse = await cloudinary.uploader.upload(avatar, {
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          });
        } catch (error) {
          return res.status(500).send("error uploading image to cloudinary");
        }
        if (finduser.imagekey) {
          await cloudinary.uploader.destroy(finduser.imagekey),
            (err, result) => {
              if (err) {
                return res
                  .status(500)
                  .send("error deleting old profile picture");
              }
            };
        }
        if (imguploadedResponse) {
          try {
            await users.update(
              {
                avatar: imguploadedResponse?.secure_url,
                imagekey: imguploadedResponse?.public_id,
              },
              {
                where: {
                  id: id,
                },
              },
              {
                multi: true,
              }
            );
            const getprofilebanner = await profilebanners.findOne({
              where: {
                userid: id,
              },
            });

            if (
              getprofilebanner?.imagekey === null ||
              getprofilebanner === null
            ) {
              //change banner color to match profile avatar if user has no custom banner

              await getColorFromURL(imguploadedResponse?.secure_url)
                .then(async (d) => {
                  const convert = ((d[0] << 16) + (d[1] << 8) + d[2])
                    .toString(16)
                    .padStart(6, "0"); // convert rgb to hex
                  const banner = `https://ui-avatars.com/api/?background=${convert}&color=fff&name=&size=1920`; // create banner url
                  if (!getprofilebanner) {
                    await profilebanners.create({
                      userid: id,
                      imageurl: banner,
                    });
                  } else {
                    await profilebanners.update(
                      {
                        imageurl: banner,
                      },
                      {
                        where: {
                          userid: id,
                        },
                      }
                    ); // update banner in db
                  }
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          } catch (error) {
            console.log(error);
            return res.status(400).send("Something went wrong");
          }
        }
        console.log("avatar updated successfully");
      }

      const newUserInfo = await users.findOne({
        where: {
          id: id,
        },
        attributes: ["username", "avatar"],
      });
      deleteallcache();
      return res.status(200).send({
        message: "User profile updated successfully",
        newUserInfo,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
});

module.exports = router;
