const cron = require("node-cron");
const {
  posts,
  translations,
  comments,
  nestedcomments,
  users,
  likes,
} = require("../models");
const { translate } = require("@vitalets/google-translate-api");
const { Op } = require("sequelize");
const transporter = require("./nodemailersetup");
const sequelize = require("sequelize");
// This cron job will run every 2 hours
const addPostTranslations = cron.schedule("0 */2 * * *", async () => {
  try {
    // Get all posts
    const postData = await posts.findAll({
      where: {
        language: null,
        text: {
          [Op.ne]: null,
        },
      },
      order: [["id", "DESC"]],
    });

    const converted = JSON.parse(JSON.stringify(postData));

    // For each post, get the translations and update the post language with the source language
    for (let i = 0; i < converted?.length; i++) {
      const currentpost = converted[i];

      if (!currentpost) {
        continue;
      }

      try {
        const res = await translate(currentpost?.text);

        if (res && res.raw && res.raw.src && res.text) {
          // Update post language
          await posts.update(
            { language: res.raw.src },
            { where: { id: currentpost.id } }
          );
          // Add translation to translations table if source language is not "en"
          if (res.raw.src !== "en") {
            await translations.create({
              translatedText: res.text,
              language: "en",
              postId: currentpost.id,
            });
          }

          // Add translation to translations table if source language is not "ko"
          if (res.raw.src !== "ko") {
            try {
              const koTranslation = await translate(currentpost.text, {
                to: "ko",
              });

              await translations.create({
                translatedText: koTranslation.text,
                language: "ko",
                postId: currentpost.id,
              });
            } catch (koTranslationError) {
              console.error("Korean translation error:", koTranslationError);
              // Remove language if there was an error during Korean translation
              await posts.update(
                { language: null },
                { where: { id: currentpost.id } }
              );

              // delete any translatiosn for the post if there was an error during Korean translation
              await translations.destroy({
                where: { postId: currentpost.id },
              });
              return;
            }
          }
        } else {
          console.error(
            "Translation response is missing expected properties:",
            res
          );
        }
      } catch (error) {
        console.error("Translation error:", error);
        return;
      }
    }

    console.log("addPostTranslations executed");
  } catch (error) {
    console.error("addPostTranslations executed error", error);
  }
});

//send email end  of month to all users with the websites monthly report like total users , total posts, top psots etc

const runonceon7pm = async () => {
  try {
    sendMonthlySummaryEmailfunc();
    console.log("runonceon7 38pm executed");
  } catch (error) {
    console.error("Error executing runonceon7 38pm:", error);
  }
};

const sendMonthlySummarySchdeule = cron.schedule("0 10 28-31 * *", () => {
  // Check if tomorrow is the first day of the next month
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (tomorrow.getDate() === 1) {
    // Run the monthly report function
    sendMonthlySummaryEmailfunc();
    console.log("sendMonthlySummarySchdeule executed");
  }
});
const sendMonthlySummaryEmailfunc = async () => {
  try {
    const currentDate = new Date();

    // Array of month names
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Get the current month and year
    const currentMonth = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();

    // Fetch top posts for the current month
    const topPosts = await posts.findAll({
      where: {
        communityid: null,
        createdAt: {
          [Op.gte]: new Date(currentYear, currentDate.getMonth(), 1),
          [Op.lt]: new Date(currentYear, currentDate.getMonth() + 1, 0),
        },
      },
      attributes: {
        exclude: ["updatedAt", "postUser"],
        include: [
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM postquotes WHERE postquotes.quotedPostId = posts.id)"
            ),
            "postquotesCount",
          ],
        ],
      },
      order: [["id", "DESC"]],
      include: [
        {
          model: likes,
          include: [
            {
              model: users,
              attributes: ["username", "avatar", "verified", "id"],
            },
          ],
          separate: true, // Fetch likes separately for each post
        },
        {
          model: users,
          attributes: ["username", "avatar", "verified", "id"],
        },
        {
          model: comments,
          separate: true, // Fetch comments separately
        },
      ],
    });

    // Find the post with the most likes
    let mostLikedPost = null;
    let maxLikes = 0;

    topPosts.forEach((post) => {
      const likeCount = post.likes.length;

      if (likeCount > maxLikes) {
        maxLikes = likeCount;
        mostLikedPost = post;
      }
    });

    // Fetch the top user of the month
    const leaderboardResponse = await fetch(
      "https://momos-backend.onrender.com/leaderboard?page=0&type=currentMonth"
    );
    const leaderboardData = await leaderboardResponse.json();
    const topUser = leaderboardData.leaderboard[0];

    // Fetch top user's total likes
    const userProfileResponse = await fetch(
      `https://momos-backend.onrender.com/profileinfo/${topUser?.username}`
    );
    const userProfileData = await userProfileResponse?.json();
    const topUserTotalLikes = userProfileData?.rankInfo?.points;

    // Initialize variables for post, comment counts, etc.
    let userPostCount,
      userCommentCount,
      userNestedCommentCount,
      totalPostsCount,
      newUsersCount;

    // Get total post count for the month
    totalPostsCount = await posts.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(currentYear, currentDate.getMonth(), 1),
          [Op.lt]: new Date(currentYear, currentDate.getMonth() + 1, 0),
        },
      },
    });

    // Get total new user count for the month
    newUsersCount = await users.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(currentYear, currentDate.getMonth(), 1),
          [Op.lt]: new Date(currentYear, currentDate.getMonth() + 1, 0),
        },
      },
    });

    // Get the total number of posts by the top user
    userPostCount = await posts.count({
      where: {
        postUser: topUser.id,
        communityid: null,
      },
    });

    // Get the total number of comments by the top user
    userCommentCount = await comments.count({
      where: {
        userId: topUser.id,
      },
    });

    // Get the total number of nested comments by the top user
    userNestedCommentCount = await nestedcomments.count({
      where: {
        userId: topUser.id,
      },
    });

    //send email to all users

    //get all user who have email

    const allUsers = await users.findAll({
      where: {
        email: {
          [Op.ne]: null,
        },
      },
    });

    // Send the monthly report email to all users

    allUsers.forEach(async (user) => {
      try {
        new Promise((resolve, reject) => {
          transporter.sendMail(
            {
              from: process.env.EMAIL_USER, // sender address
              to: user?.email, // receiver email
              subject: `Momos ${currentMonth} ${currentYear} Summary`,
              html: `
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Momos ${currentMonth} Summary</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
          }
          .container {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
          }
          h1 {
              color: #333333;
              text-align: center;
              font-size: 24px;
          }
          h1 a {
              color: #007BFF;
              text-decoration: none;
          }
          h1 a:hover {
              color: #0056b3;
          }
          p {
              color: #555555;
              line-height: 1.6;
          }
          .highlight {
              color: #007BFF;
              font-weight: bold;
          }
          .stats {
              display: flex;
              justify-content: space-between;
              padding: 15px;
              background-color: #f0f0f0;
              border-radius: 8px;
              margin-bottom: 20px;
              text-align: center;
          }
          .stat-item {
              width: 45%;
          }
          .stat-item p {
              margin: 0;
              color: #333333;
          }
          .stat-item .number {
              font-size: 36px;
              font-weight: bold;
              color: #007BFF;
          }
          .top-user {
              display: flex;
              align-items: center;
              background-color: #f9f9f9;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              position: relative;
              text-decoration: none;
              color: inherit;
          }
          .top-user img {
              width: 60px;
              height: 60px;
              border-radius: 50%;
              margin-right: 15px;
          }
          .top-post {
              background-color: #f9f9f9;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              text-decoration: none;
              color: inherit;
              display: block;
              overflow: hidden;
          }
          .top-post img {
              width: 100%;
              height: 200px;
              object-fit: cover;
              margin-top: 10px;
              border-radius: 8px;
          }
          .footer {
              text-align: center;
              margin-top: 20px;
              color: #999999;
              font-size: 12px;
          }
          .footer a {
              color: #007BFF;
              text-decoration: none;
          }
          .footer a:hover {
              text-decoration: underline;
          }
      </style>
  </head>
  
  <body>
      <div class="container">
          <h1><a href="https://momosz.com/">Momos</a> ${currentMonth} ${currentYear} Summary</h1>
          <div class="stats">
              <div class="stat-item">
                  <p class="number">${totalPostsCount}</p>
                  <p>New Posts</p>
              </div>
              <div class="stat-item">
                  <p class="number">${newUsersCount}</p>
                  <p>New Users</p>
              </div>
          </div>
          <h2>👑 Top User of the Month 👑</h2>
          <a href="https://momosz.com/${topUser?.username}" class="top-user">
              <img src="${topUser?.avatar}" alt="Top User Profile Picture">
              <div>
                  <p><span class="highlight">${topUser?.username}</span></p>
                  <p>Posts: <span class="highlight">${userPostCount}</span> | Likes: <span class="highlight">${topUserTotalLikes}</span> | Comments: <span class="highlight">${
                userCommentCount + userNestedCommentCount
              }</span></p>
              </div>
          </a>
          <h2>📈 Top Post of the Month 📈</h2>
          <a href="https://momosz.com/post/${
            mostLikedPost?.id
          }" class="top-post">
              <p><strong>by ${
                mostLikedPost?.user?.username
              }</strong> • <span class="highlight">${new Date(
                mostLikedPost?.createdAt
              ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</span></p>
              ${mostLikedPost?.text ? `<p>${mostLikedPost?.text}</p>` : ""}
              ${
                mostLikedPost?.image
                  ? `<img src="${mostLikedPost.image}" alt="Top Post Image">`
                  : ""
              }
              <p>Likes: <span class="highlight">${
                mostLikedPost?.likes?.length
              }</span> | Comments: <span class="highlight">${
                mostLikedPost?.comments?.length
              }</span></p>
          </a>
          <p>This summary is sent from Momos.</p>
          <div class="footer">
              <p>Thank you for being part of the Momos community!</p>
              <p><a href="https://momosz.com">Unsubscribe</a> | <a href="https://momosz.com">Visit our site</a></p>
          </div>
      </div>
  </body>
  </html>
            `,
            },
            (err) => {
              if (err) {
                console.log("Error with sending email", err);
                reject(false);
              } else {
                resolve(true);
              }
            }
          );
        });
      } catch (error) {
        console.error("Error executing sendMonthlySummary:", error);
      }
    });

    // Send the monthly report email
  } catch (error) {
    console.error("Error executing sendMonthlySummary:", error);
  }
};

module.exports = {
  addPostTranslations,
  sendMonthlySummarySchdeule,
  runonceon7pm,
};
