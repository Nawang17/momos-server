"use strict";
const router = require("express").Router();
const {
  likes,
  notis,
  posts,
  polls,
  pollvotes,
  pollchoices,
} = require("../../models");

router.post("/", async (req, res) => {
  try {
    const { pollid, pollchoiceid, postid } = req.body;

    // check if pollid, pollchoiceid, postid are provided
    if (!pollid || !pollchoiceid || !postid) {
      return res.status(400).send("pollid, pollchoiceid, postid are required");
    }
    // check if pollid, pollchoiceid, postid are numbers
    if (isNaN(pollid) || isNaN(pollchoiceid) || isNaN(postid)) {
      return res.status(400).send("invalid pollid or pollchoiceid or postid");
    }

    // Check if the post exists
    const findpost = await posts.findOne({
      where: {
        id: postid,
      },
    });
    if (!findpost) {
      return res.status(404).send("Post not found");
    }
    //check if its own poll

    if (findpost.postUser === req.user.id) {
      return res.status(400).send("You cannot vote on your own poll");
    }

    // Check if the poll exists

    const findpoll = await polls.findOne({
      where: {
        id: pollid,
      },
    });
    if (!findpoll) {
      return res.status(404).send("Poll not found");
    }

    //check if duration is over

    const pollEndDate = new Date(Date.parse(findpoll?.duration));
    if (pollEndDate < Date.now()) {
      return res.status(400).send("Poll is closed");
    }

    // Check if the pollchoice exists

    const findpollchoice = await pollchoices.findOne({
      where: {
        id: pollchoiceid,
      },
    });
    if (!findpollchoice) {
      return res.status(404).send("Pollchoice not found");
    }

    // find poll vote

    const findpollvote = await pollvotes.findOne({
      where: {
        pollId: pollid,
        userId: req.user.id,
      },
    });

    if (findpollvote) {
      return res.status(400).send("You have already voted for this poll");
    }

    // Create pollvote

    const newpollvote = await pollvotes.create({
      pollId: pollid,
      pollchoicesId: pollchoiceid,
      userId: req.user.id,
    });
    if (!newpollvote) {
      return res.status(500).send("Something went wrong");
    }

    return res.status(200).send({
      voted: true,
      newpollvote,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong");
  }
});

module.exports = router;
