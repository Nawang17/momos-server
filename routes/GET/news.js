"use strict";
const router = require("express").Router();
const cache = require("../../utils/cache");
const axios = require("axios");
require("dotenv").config();

let requestCount = 0;
let currentHour = new Date().getHours();

router.get("/Top", async (_, res) => {
  const newYorkTimeOptions = { timeZone: "America/New_York" };
  const now = new Date();
  const currentDate = now.toLocaleDateString("en-US", newYorkTimeOptions);
  const hour = now.getHours();

  // Check if the hour has changed
  if (hour !== currentHour) {
    currentHour = hour;
    requestCount = 0;
  }

  if (requestCount >= 4) {
    return res.status(429).send({
      message: "Request limit reached for this hour. Please try again later.",
    });
  }

  const date = `${currentDate}-${hour}`;
  const cachedNews = await cache.get(`TopNews-${date}`);

  if (cachedNews) {
    return res.status(200).send({
      message: "Top news retrieved successfully",
      news: cachedNews,
      cached: true,
    });
  }

  try {
    const news = await axios.get(
      `https://api.thenewsapi.com/v1/news/top?api_token=${process.env.NEWS_API_TOKEN}&locale=us&limit=1`
    );
    const newsData = news.data;
    cache.set(`TopNews-${date}`, newsData);
    requestCount += 1;
    return res.status(200).send({
      message: "Top news retrieved successfully",
      news: newsData,
      cached: false,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error retrieving top news",
    });
  }
});

module.exports = router;
