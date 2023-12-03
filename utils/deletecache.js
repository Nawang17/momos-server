const cache = require("./cache");

function deleteallcache() {
  cache.flushAll();
  return;
}
module.exports = { deleteallcache };
