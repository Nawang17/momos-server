const cron = require("node-cron");
const { posts, translations } = require("../models");
const { translate } = require("@vitalets/google-translate-api");
const { Op } = require("sequelize");

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
              console.error('Korean translation error:', koTranslationError);
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
          console.error('Translation response is missing expected properties:', res);
          
        }
      } catch (error) {
        console.error('Translation error:', error);
         return;
      }
    }

    console.log("addPostTranslations executed");
  } catch (error) {
    console.error("addPostTranslations executed error", error);
  }
});

module.exports = { addPostTranslations };
