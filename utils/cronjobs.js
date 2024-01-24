const cron = require("node-cron");
const { posts, translations } = require("../models");
const { translate } = require("@vitalets/google-translate-api");
const { Op } = require("sequelize");
// this cron job will run once every hour
const addPostTranslations = cron.schedule("0 * * * *", async () => {
  try {
    //get all posts
    const postData = await posts.findAll({
      where: {
        language: null,
        text: {
          [Op.ne]: null,
        },
      },
      order: [["id", "DESC"]], //order by id desc to get the latest posts first
    });
    const converted = JSON.parse(JSON.stringify(postData));
    //for each posts get the translations and update the post language wiht the src language and if src lang is en then make another translation to ko and add that to trnaslations table
    for (let i = 0; i < converted.length; i++) {
      const currentpost = converted[i];
      if (currentpost.text === null || currentpost?.language) {
        continue;
      }
      await translate(currentpost?.text).then(async (res) => {
        await posts.update(
          { language: res?.raw?.src },
          { where: { id: currentpost?.id } }
        );
        if (res?.raw?.src !== "ko") {
          await translate(
            currentpost?.text,

            {
              to: "ko",
            }
          ).then(async (res) => {
            await translations.create({
              translatedText: res?.text,
              language: "ko",
              postId: currentpost?.id,
            });
          });
        }
        if (res?.raw?.src !== "en") {
          await translations.create({
            translatedText: res?.text,
            language: "en",
            postId: currentpost?.id,
          });
        }
      });
    }

    console.log("addPostTranslations executed");
    return;
  } catch (error) {
    console.log("addPostTranslations executed error", error);
    return;
  }
});

module.exports = { addPostTranslations };
