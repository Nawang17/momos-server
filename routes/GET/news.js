"use strict";
const router = require("express").Router();
const cache = require("../../utils/cache");
const axios = require("axios");

router.get("/Top", async (_, res) => {
  const [day, month, year] = new Date().toLocaleDateString("en-US").split("/");
  const date = `${day}/${month}/${year}`;
  const cachedNews = await cache.get(`TopNews-${date}`);

  if (cachedNews) {
    return res.status(200).send({
      message: "Top news retrieved successfully",
      news: cachedNews,
      cached: true,
    });
  }

  const news = await axios.get(
    "https://api.thenewsapi.com/v1/news/top?api_token=pKmGDf94fEZ1xb789WHrvXBjtO9TzpeD583fpGbY&locale=us&limit=1"
  );
  const newsData = news.data;
  cache.set(`TopNews-${date}`, newsData);
  res.status(200).send({
    message: "Top news retrieved successfully",
    news: newsData,
    cached: false,
  });
});
module.exports = router;
