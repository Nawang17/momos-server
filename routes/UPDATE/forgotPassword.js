/* eslint-disable no-undef */
"use strict";

require("dotenv").config();
const { users, passwordresets } = require("../../models");
const { sign, verify } = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { isValidEmail } = require("../../utils/validations");
const bcrypt = require("bcryptjs");
const { compare } = require("bcryptjs");

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is provided and has a valid format
    if (!email) {
      return res.status(400).send("Email is required");
    }
    //check if email is valid format
    if (!isValidEmail(email)) {
      return res.status(400).send("Invalid email format");
    }

    // Check if user with provided email exists
    const user = await users.findOne({ where: { email: email } });
    if (!user) {
      // If user does not exist, pretend email was sent to avoid information leakage
      return res.status(200).send("Email sent");
    }

    // Check if there is an existing password reset token for the user
    const existingToken = await passwordresets.findOne({
      where: { userid: user.id },
    });

    if (existingToken) {
      try {
        // Verify if the existing token has expired

        verify(existingToken?.resettoken, process.env.PASS_RESET_JWT_SECRET);

        // If token is still valid, inform the user to wait before requesting again
        return res
          .status(409)
          .send(
            "Password reset email has already been sent. Please wait for 15 mins before requesting again"
          );
      } catch (error) {
        await passwordresets.destroy({ where: { userid: user.id } });
      }
    }

    // Generate a new token for password reset
    const token = sign(
      { id: user?.id },
      process.env.PASS_RESET_JWT_SECRET,
      { expiresIn: "900000" } // 15 mins expiry time
    );

    const link = `https://momosz.com/reset-password/${token}`;

    // Send password reset email
    const emailSent = await sendEmail(link, email);
    if (!emailSent) return res.status(500).send("Something went wrong");

    // Save the new token in the database
    await passwordresets.create({
      resettoken: token,
      userid: user.id,
    });

    // Inform the user that the email has been sent
    return res.status(200).send("Email sent");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Something went wrong");
  }
};

//create route to check token in valid

const resetTokenCheck = async (req, res) => {
  try {
    const { resetToken } = req.params;
    if (!resetToken) {
      return res.status(400).send("Token is required");
    }

    // Check if there is an existing password reset token for the user
    const existingToken = await passwordresets.findOne({
      where: { resettoken: resetToken },
    });

    if (!existingToken) {
      return res.status(400).send("Invalid token");
    }

    // Verify if the existing token has expired
    verify(
      existingToken?.resettoken,
      process.env.PASS_RESET_JWT_SECRET,
      async (err) => {
        if (err) {
          await passwordresets
            .destroy({ where: { resettoken: resetToken } })
            .then(() => {
              return res.status(400).send("Token has expired");
            });
        } else {
          return res.status(200).send("Token is valid");
        }
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).send("Something went wrong");
  }
};

//create route to update password in db

const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;

    if (!resetToken || !password) {
      return res.status(400).send("Token and password are required");
    }

    // Check if there is an existing password reset token for the user
    const existingToken = await passwordresets.findOne({
      where: { resettoken: resetToken },
    });

    if (!existingToken) {
      return res.status(400).send("Invalid token");
    }

    // Verify if the existing token has expired
    verify(
      existingToken?.resettoken,
      process.env.PASS_RESET_JWT_SECRET,
      async (err) => {
        if (err) {
          await passwordresets
            .destroy({ where: { resettoken: resetToken } })
            .then(() => {
              return res.status(400).send("Token has expired");
            });
        } else {
          //check if password is valid
          if (!password) {
            return res.status(400).send("Password is required");
          }

          //check if password is valid
          if (password.length < 6) {
            return res
              .status(400)
              .send("Password must be at least 6 characters long");
          }
          //find user in db
          const user = await users.findOne({
            where: {
              id: existingToken?.userid,
            },
          });

          if (!user) {
            return res.status(400).send("User does not exist");
          }
          await compare(password, user.password).then(async (ismatch) => {
            if (ismatch) {
              return res
                .status(400)
                .send(
                  "Your new password cannot be the same as your current password"
                );
            } else {
              //hash password
              const hashedPassword = await bcrypt.hash(password, 10);

              //update password in db
              await users.update(
                {
                  password: hashedPassword,
                },
                {
                  where: {
                    id: user?.id,
                  },
                }
              );

              //delete token from db
              await passwordresets.destroy({
                where: {
                  userid: user?.id,
                },
              });
              const token = sign(
                {
                  id: user?.id,
                },

                process.env.JWT_SECRET
              );
              return res.status(200).send({
                message: "Password updated",
                token: "Bearer " + token,
                user: {
                  username: user.username,
                  avatar: user.avatar,
                },
              });
            }
          });
        }
      }
    );
  } catch (error) {
    console.error(error);
    return res.status(500).send("Something went wrong");
  }
};
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,

  from: process.env.EMAIL_USER,
  auth: {
    user: process.env.EMAIL_USER,

    pass: process.env.EMAIL_PASS,
  },
});

//
function sendEmail(link, email) {
  // send mail with defined transport object
  return new Promise((resolve, reject) => {
    transporter.sendMail(
      {
        from: process.env.EMAIL_USER, // sender address
        to: email, // receiver
        subject: "[Momos] Password reset", // Subject line

        text: `
      href="https://momosz.com" style="text-decoration: none;">Momos</a></p>
      <p>If it was not you, you can safely ignore this email.</p>
      <p>Copy and paste the following link in your browser to choose a new password:</p>
      <p><a href="${link}">${link}</a></p>
    `,
        html: `
      <p>Somebody asked to reset your password on <a href="https://momosz.com" style="text-decoration: none;">Momos</a></p>
      <p>If it was not you, you can safely ignore this email.</p>
      <p>Copy and paste the following link in your browser to choose a new password:</p>
      <p><a href="${link}">${link}</a></p>
    `, // html body
      },
      (err) => {
        if (err) {
          console.log("error with sending email", err);
          reject(false);
        } else {
          resolve(true);
        }
      }
    );
  });
}
module.exports = { forgotPassword, resetTokenCheck, resetPassword };
