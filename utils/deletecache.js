const cache = require("./cache");

function deleteallcache() {
  cache.flushAll();
}
module.exports = { deleteallcache };
