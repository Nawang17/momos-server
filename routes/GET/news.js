"use strict";
const router = require("express").Router();
const cache = require("../../utils/cache");
const axios = require("axios");
require("dotenv").config();

router.get("/Top", async (_, res) => {
  let news;
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
  try {
    news = await axios.get(
      `https://api.thenewsapi.com/v1/news/top?api_token=${process.env.NEWS_API_TOKEN}&locale=us&limit=1`
    );
  } catch (error) {
    return res.status(500).send({
      message: "Error retrieving top news",
    });
  }

  const newsData = news.data;
  cache.set(`TopNews-${date}`, newsData);
  res.status(200).send({
    message: "Top news retrieved successfully",
    news: newsData,
    cached: false,
  });
});
module.exports = router;
