"use strict";
const router = require("express").Router();
const cache = require("../../utils/cache");
const axios = require("axios");

router.get("/Top", async (_, res) => {
  const newYorkTimeOptions = { timeZone: "America/New_York" };
  const currentDate = new Date().toLocaleDateString(
    "en-US",
    newYorkTimeOptions
  );
  const currentHour = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  });

  const date = `${currentDate}-${currentHour}`;
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
