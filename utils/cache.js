const NodeCache = require("node-cache");
const cache = new NodeCache(); // default ttl is 0, meaning no expiration of cache unless deleted manually

module.exports = cache;
